import { applyContentOverrides, ARTICLES, findLesson, findSection, type ContentOverrides } from '@kidsland/shared';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import { config } from '../config';
import { envFilesFound, smtpUrlFiles, smtpUrlFromSystem } from '../envFiles';
import type { PoolClient } from 'pg';
import type { Db } from '../db/pool';
import { checkMail, deliverMail, smtpSettings } from '../mail';

/** Percent of each payment the site keeps; 20 until the admin sets it on the payments tab. */
export async function commissionPercent(db: Db | PoolClient) {
  const { rows } = await db.query("SELECT value FROM app_settings WHERE key = 'commission_percent'");
  const n = Number(rows[0]?.value);
  return rows.length && Number.isFinite(n) ? n : 20;
}

/** First and last two letters only, so the admin can compare with the password in Google without showing it. */
const maskPass = (p: string) => (p.length < 6 ? '' : `${p.slice(0, 2)}${'•'.repeat(p.length - 4)}${p.slice(-2)}`);
import { HttpError } from '../errors';
import { isUuid, type TutorRow } from '../tutors';
import { documentsOf, publicApplication, sendDocument } from './tutorCabinet';

/** Reads everything the admin changed on the site's content. */
export async function loadContentOverrides(db: Db): Promise<ContentOverrides> {
  const [topics, articles, lessons] = await Promise.all([
    db.query('SELECT id, section, name FROM cms_topics ORDER BY created_at'),
    db.query('SELECT * FROM cms_articles ORDER BY updated_at'),
    db.query('SELECT * FROM cms_lessons'),
  ]);
  return {
    topics: topics.rows,
    articles: articles.rows.map((a) => ({
      id: a.id,
      section: a.section,
      topic: a.topic,
      title: a.title,
      summary: a.summary,
      minutes: a.minutes,
      sections: a.sections,
      hidden: a.is_hidden,
    })),
    lessons: lessons.rows.map((l) => ({ lessonId: l.lesson_id, title: l.title, sections: l.sections })),
  };
}

/** Re-reads the admin's content and puts it into the shared lists the routes use. */
export async function refreshContent(db: Db) {
  applyContentOverrides(await loadContentOverrides(db));
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const textBlock = z.object({
  title: z.string().trim().max(120).optional().default(''),
  text: z.string().trim().min(1, 'Текст блока пустой').max(5000),
  tip: z.string().trim().max(500).optional().default(''),
});
const articleSchema = z.object({
  section: z.string(),
  topic: z.string(),
  title: z.string().trim().min(3, 'Название слишком короткое').max(120),
  summary: z.string().trim().max(300).default(''),
  minutes: z.number().int().min(1).max(60).default(3),
  sections: z.array(textBlock).min(1, 'Добавьте хотя бы один блок текста').max(20),
});
const lessonSchema = z.object({
  title: z.string().trim().min(2).max(120),
  sections: z.array(textBlock).min(1).max(20),
});

/** The admin's workplace: notifications, tutor applications, lesson chats and site content. */
export function adminRouter(db: Db) {
  const r = Router();
  r.use(requireAuth, requireRole('admin'));

  // ---- Letters the site sent (or is waiting to send) ----
  r.get('/mail', async (req, res) => {
    const status = z.enum(['pending', 'sent', 'failed']).optional().parse(req.query.status || undefined);
    const { rows } = await db.query(
      `SELECT id, to_email, subject, body, status, error, created_at, sent_at, tried_at FROM email_outbox
        WHERE ($1::text IS NULL OR status = $1) ORDER BY created_at DESC LIMIT 200`,
      [status ?? null],
    );
    const counts = await db.query('SELECT status, count(*)::int AS n FROM email_outbox GROUP BY status');
    res.json({
      letters: rows.map((m) => ({ id: m.id, to: m.to_email, subject: m.subject, body: m.body, status: m.status, error: m.error, createdAt: m.created_at, sentAt: m.sent_at, triedAt: m.tried_at })),
      counts: Object.fromEntries(counts.rows.map((c) => [c.status, c.n])),
      mailReady: !!config.smtpUrl,
      hosted: process.env.NODE_ENV === 'production',
      envFiles: envFilesFound,
      mailLogin: smtpSettings()?.user ?? '',
      mailPassLength: smtpSettings()?.pass.length ?? 0,
      mailPassHint: maskPass(smtpSettings()?.pass ?? ''),
      smtpUrlFiles,
      smtpOverridesSystem: !!smtpUrlFromSystem && smtpUrlFromSystem !== config.smtpUrl,
    });
  });

  // Logs in to Gmail without sending a letter.
  r.post('/mail/check', async (_req, res) => {
    res.json(await checkMail());
  });

  // Letters that failed (e.g. before the mail password was fixed) go back to the queue.
  r.post('/mail/retry', async (_req, res) => {
    const { rowCount } = await db.query("UPDATE email_outbox SET status = 'pending', error = NULL WHERE status = 'failed'");
    await deliverMail(db);
    res.json({ requeued: rowCount ?? 0 });
  });

  // ---- Payments and receipts ----
  r.get('/payments', async (_req, res) => {
    const { rows } = await db.query(
      `SELECT p.id, p.kind, p.title, p.amount, p.amount_shown, p.currency, p.method, p.receipt_no, p.created_at, u.email
         FROM payments p JOIN users u ON u.id = p.parent_id ORDER BY p.created_at DESC LIMIT 200`,
    );
    const total = await db.query("SELECT COALESCE(sum(amount), 0)::int AS sum FROM payments WHERE created_at > now() - interval '30 days'");
    const percent = await commissionPercent(db);
    const share = (amount: number) => Math.round((amount * percent) / 100);
    res.json({
      payments: rows.map((p) => ({
        id: p.id, kind: p.kind, title: p.title, amount: p.amount, amountShown: p.amount_shown, currency: p.currency,
        method: p.method, receiptNo: p.receipt_no, createdAt: p.created_at, email: p.email, commission: share(p.amount),
      })),
      month: total.rows[0].sum,
      monthCommission: share(total.rows[0].sum),
      commissionPercent: percent,
    });
  });

  // Removes a test payment from the list, together with its admin notification. Lessons already bought stay.
  r.delete('/payments/:id', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Оплата не найдена');
    const { rowCount } = await db.query('DELETE FROM payments WHERE id = $1', [req.params.id]);
    if (!rowCount) throw new HttpError(404, 'Оплата не найдена');
    await db.query('DELETE FROM admin_notifications WHERE link = $1', [`/billing/receipt/${req.params.id}`]);
    res.json({ ok: true });
  });

  // The site's share of every payment; the rest goes to the tutor.
  r.put('/commission', async (req, res) => {
    const { percent } = z.object({ percent: z.number().int().min(0).max(60) }).parse(req.body);
    await db.query(
      "INSERT INTO app_settings (key, value) VALUES ('commission_percent', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [String(percent)],
    );
    res.json({ commissionPercent: percent });
  });

  // ---- Notifications ----
  r.get('/notifications', async (_req, res) => {
    const { rows } = await db.query('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 100');
    const { rows: c } = await db.query('SELECT count(*)::int AS n FROM admin_notifications WHERE read_at IS NULL');
    res.json({
      unread: c[0].n,
      notifications: rows.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        link: n.link,
        createdAt: n.created_at,
        read: !!n.read_at,
      })),
    });
  });

  r.post('/notifications/read', async (req, res) => {
    const { ids } = z.object({ ids: z.array(z.string()).optional() }).parse(req.body ?? {});
    if (ids) await db.query('UPDATE admin_notifications SET read_at = now() WHERE read_at IS NULL AND id = ANY($1::uuid[])', [ids.filter(isUuid)]);
    else await db.query('UPDATE admin_notifications SET read_at = now() WHERE read_at IS NULL');
    res.json({ ok: true });
  });

  // ---- Tutor applications ----
  const loadTutor = async (id: string) => {
    if (!isUuid(id)) throw new HttpError(404, 'Анкета не найдена');
    const { rows } = await db.query<TutorRow & { email: string }>(
      'SELECT t.*, u.email FROM tutor_profiles t JOIN users u ON u.id = t.user_id WHERE t.id = $1',
      [id],
    );
    if (!rows[0]) throw new HttpError(404, 'Анкета не найдена');
    return rows[0];
  };
  const applicationView = async (t: TutorRow & { email: string }) => ({
    tutor: {
      id: t.id,
      email: t.email,
      displayName: t.display_name,
      headline: t.headline,
      bio: t.bio,
      subjects: t.subjects,
      languages: t.languages,
      ageMin: t.age_min,
      ageMax: t.age_max,
      hourlyRate: t.hourly_rate,
      videoUrl: t.video_url,
      isPublished: t.is_published,
    },
    application: publicApplication(t),
    documents: await documentsOf(db, t.id),
  });

  r.get('/tutor-applications', async (req, res) => {
    const status = z.enum(['pending', 'approved', 'rejected', 'draft', 'all']).catch('pending').parse(req.query.status);
    const { rows } = await db.query<TutorRow & { email: string }>(
      `SELECT t.*, u.email FROM tutor_profiles t JOIN users u ON u.id = t.user_id
        WHERE ($1 = 'all' OR t.verification = $1)
        ORDER BY t.submitted_at DESC NULLS LAST, t.display_name LIMIT 200`,
      [status],
    );
    res.json({ applications: await Promise.all(rows.map(applicationView)) });
  });

  r.get('/tutor-applications/:tutorId', async (req, res) => {
    res.json(await applicationView(await loadTutor(req.params.tutorId)));
  });

  r.get('/tutor-applications/:tutorId/documents/:docId', async (req, res) => {
    const t = await loadTutor(req.params.tutorId);
    await sendDocument(db, t.id, req.params.docId, res);
  });

  r.post('/tutor-applications/:tutorId/review', async (req, res) => {
    const { decision, note } = z
      .object({ decision: z.enum(['approve', 'reject']), note: z.string().trim().max(1000).default('') })
      .parse(req.body);
    if (decision === 'reject' && note.length < 3) throw new HttpError(400, 'Напишите преподавателю, что нужно исправить');
    const t = await loadTutor(req.params.tutorId);
    await db.query(
      `UPDATE tutor_profiles SET verification = $2, verification_note = $3, reviewed_at = now(), is_published = $4 WHERE id = $1`,
      [t.id, decision === 'approve' ? 'approved' : 'rejected', note || null, decision === 'approve'],
    );
    res.json(await applicationView(await loadTutor(t.id)));
  });

  // ---- Lesson chats (read only) ----
  r.get('/lesson-chats', async (_req, res) => {
    const { rows } = await db.query(
      `SELECT b.id, b.slot_time, b.status, t.display_name AS tutor_name, c.nickname AS child_name,
              count(m.id)::int AS messages, max(m.created_at) AS last_at
         FROM bookings b
         JOIN tutor_profiles t ON t.id = b.tutor_id
         LEFT JOIN child_profiles c ON c.id = b.child_id
         JOIN lesson_messages m ON m.booking_id = b.id
        GROUP BY b.id, t.display_name, c.nickname
        ORDER BY last_at DESC LIMIT 100`,
    );
    res.json({
      chats: rows.map((b) => ({
        bookingId: b.id,
        startsAt: b.slot_time,
        status: b.status,
        tutorName: b.tutor_name,
        childName: b.child_name,
        messages: b.messages,
        lastAt: b.last_at,
      })),
    });
  });

  r.get('/lesson-chats/:bookingId', async (req, res) => {
    if (!isUuid(req.params.bookingId)) throw new HttpError(404, 'Урок не найден');
    const { rows } = await db.query(
      'SELECT id, is_tutor, body, created_at FROM lesson_messages WHERE booking_id = $1 ORDER BY created_at, id',
      [req.params.bookingId],
    );
    res.json({ messages: rows.map((m) => ({ id: m.id, isTutor: m.is_tutor, body: m.body, createdAt: m.created_at })) });
  });

  // ---- Site content ----
  r.get('/content', async (_req, res) => {
    res.json(await loadContentOverrides(db));
  });

  r.post('/content/topics', async (req, res) => {
    const { section, name } = z.object({ section: z.string(), name: z.string().trim().min(2).max(60) }).parse(req.body);
    const s = findSection(section);
    if (!s) throw new HttpError(400, 'Нет такого раздела');
    if (s.topics.some((t) => t.name.toLowerCase() === name.toLowerCase())) throw new HttpError(409, 'Такая тема уже есть');
    await db.query('INSERT INTO cms_topics (id, section, name) VALUES ($1, $2, $3)', [newId('t'), section, name]);
    await refreshContent(db);
    res.status(201).json(await loadContentOverrides(db));
  });

  r.delete('/content/topics/:id', async (req, res) => {
    await db.query('DELETE FROM cms_topics WHERE id = $1', [req.params.id]);
    await refreshContent(db);
    res.json(await loadContentOverrides(db));
  });

  const checkTopic = (section: string, topic: string) => {
    const s = findSection(section);
    if (!s) throw new HttpError(400, 'Нет такого раздела');
    if (!s.topics.some((t) => t.id === topic)) throw new HttpError(400, 'Нет такой темы в разделе');
  };
  const saveArticle = async (id: string, a: z.infer<typeof articleSchema>, hidden = false) => {
    await db.query(
      `INSERT INTO cms_articles (id, section, topic, title, summary, minutes, sections, is_hidden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET section = $2, topic = $3, title = $4, summary = $5, minutes = $6,
         sections = $7, is_hidden = $8, updated_at = now()`,
      [id, a.section, a.topic, a.title, a.summary, a.minutes, JSON.stringify(a.sections), hidden],
    );
    await refreshContent(db);
  };

  r.post('/content/articles', async (req, res) => {
    const a = articleSchema.parse(req.body);
    checkTopic(a.section, a.topic);
    const id = newId('a');
    await saveArticle(id, a);
    res.status(201).json({ id, content: await loadContentOverrides(db) });
  });

  r.put('/content/articles/:id', async (req, res) => {
    const a = articleSchema.parse(req.body);
    checkTopic(a.section, a.topic);
    await saveArticle(req.params.id, a);
    res.json({ id: req.params.id, content: await loadContentOverrides(db) });
  });

  r.post('/content/articles/:id/hidden', async (req, res) => {
    const { hidden } = z.object({ hidden: z.boolean() }).parse(req.body);
    const { rowCount } = await db.query('UPDATE cms_articles SET is_hidden = $2, updated_at = now() WHERE id = $1', [req.params.id, hidden]);
    if (!rowCount) {
      // A built-in article: store a copy so it can be hidden.
      const base = ARTICLES.find((x) => x.id === req.params.id);
      if (!base) throw new HttpError(404, 'Статья не найдена');
      await saveArticle(base.id, { ...base, sections: base.sections.map((s) => ({ ...s, tip: s.tip ?? '' })) }, hidden);
    } else await refreshContent(db);
    res.json(await loadContentOverrides(db));
  });

  r.put('/content/lessons/:lessonId', async (req, res) => {
    const l = lessonSchema.parse(req.body);
    if (!findLesson(req.params.lessonId)) throw new HttpError(404, 'Урок не найден');
    await db.query(
      `INSERT INTO cms_lessons (lesson_id, title, sections) VALUES ($1, $2, $3)
       ON CONFLICT (lesson_id) DO UPDATE SET title = $2, sections = $3, updated_at = now()`,
      [req.params.lessonId, l.title, JSON.stringify(l.sections)],
    );
    await refreshContent(db);
    res.json(await loadContentOverrides(db));
  });

  r.delete('/content/lessons/:lessonId', async (req, res) => {
    await db.query('DELETE FROM cms_lessons WHERE lesson_id = $1', [req.params.lessonId]);
    await refreshContent(db);
    res.json(await loadContentOverrides(db));
  });

  return r;
}

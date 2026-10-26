import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { COUNTRY_CODES, LANGUAGE_IDS, TOPIC_IDS, findSection, findUnsafeContent } from '@kidsland/shared';
import { createReadStream } from 'node:fs';
import express, { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import { config } from '../config';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { notifyAdmins } from '../notify';
import { isUuid, publicTutor, tutorForUser, type TutorRow } from '../tutors';
import { loadContentOverrides, newId, refreshContent } from './admin';
import { flagUnsafe } from './lessonRoom';

const profileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(60),
    headline: z.string().trim().max(120),
    bio: z.string().trim().max(2000),
    videoUrl: z
      .union([z.string().trim().url().max(300), z.string().regex(/^\/api\/uploads\/videos\/[\w-]+\.\w+$/), z.literal('')])
      .optional(),
    avatar: z.string().max(40).optional(),
    // Checked against the live list: the admin can add topics while the server runs.
    subjects: z
      .array(z.string().max(40))
      .min(1, 'Выберите хотя бы один предмет')
      .refine((ids) => ids.every((id) => TOPIC_IDS.includes(id)), 'Неизвестный предмет'),
    languages: z.array(z.enum(LANGUAGE_IDS as [string, ...string[]])).min(1, 'Выберите хотя бы один язык'),
    country: z.enum(COUNTRY_CODES).nullable().optional(),
    ageMin: z.number().int().min(4).max(18),
    ageMax: z.number().int().min(4).max(18),
    hourlyRate: z.number().int().min(0).max(50000),
    isPublished: z.boolean(),
  })
  .refine((p) => p.ageMin <= p.ageMax, { message: 'Минимальный возраст больше максимального', path: ['ageMin'] });

const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
const UPLOAD_PREFIX = '/api/uploads/videos/';

async function removeUploadedVideo(url: string | null) {
  if (!url?.startsWith(UPLOAD_PREFIX)) return;
  await unlink(`${config.uploadsDir}/videos/${url.slice(UPLOAD_PREFIX.length)}`).catch(() => {});
}

const year = () => new Date().getFullYear();
const yearFrom = z.number().int().min(1950).max(year());
const yearTo = z.number().int().min(1950).max(year() + 6).nullable();
const applicationSchema = z.object({
  education: z
    .array(
      z
        .object({
          institution: z.string().trim().min(2, 'Укажите учебное заведение').max(200),
          specialty: z.string().trim().max(200),
          yearFrom,
          yearTo,
        })
        .refine((e) => e.yearTo === null || e.yearTo >= e.yearFrom, { message: 'Год окончания раньше года начала' }),
    )
    .max(10),
  experience: z
    .array(
      z
        .object({
          place: z.string().trim().min(2, 'Укажите место работы').max(200),
          position: z.string().trim().max(200),
          yearFrom,
          yearTo,
        })
        .refine((e) => e.yearTo === null || e.yearTo >= e.yearFrom, { message: 'Год окончания раньше года начала' }),
    )
    .max(20),
});

export const DOCUMENT_TYPES: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_DOCUMENTS = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const publicDocument = (d: any) => ({ id: d.id, kind: d.kind, title: d.title, mime: d.mime, size: d.size, createdAt: d.created_at });

export const publicApplication = (t: TutorRow) => ({
  status: t.verification,
  note: t.verification_note,
  submittedAt: t.submitted_at,
  reviewedAt: t.reviewed_at,
  education: t.education,
  experience: t.experience,
});

export async function documentsOf(db: Db, tutorId: string) {
  const { rows } = await db.query('SELECT * FROM tutor_documents WHERE tutor_id = $1 ORDER BY created_at', [tutorId]);
  return rows.map(publicDocument);
}

/** Sends a stored document file; the caller has already checked who may see it. */
export async function sendDocument(db: Db, tutorId: string, docId: string, res: import('express').Response) {
  if (!isUuid(docId)) throw new HttpError(404, 'Документ не найден');
  const { rows } = await db.query('SELECT * FROM tutor_documents WHERE id = $1 AND tutor_id = $2', [docId, tutorId]);
  const d = rows[0];
  if (!d) throw new HttpError(404, 'Документ не найден');
  res.setHeader('Content-Type', d.mime);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(d.title)}.${DOCUMENT_TYPES[d.mime]}"`);
  createReadStream(`${config.documentsDir}/${d.file_name}`)
    .on('error', () => res.status(404).end())
    .pipe(res);
}

const MAX_DAYS_AHEAD = 60;
const slotsSchema = z.object({
  startsAt: z.array(z.string().datetime({ offset: true })).min(1).max(50),
  durationMin: z.number().int().min(15).max(120).default(45),
});

/** A tutor's own profile, schedule and lessons. */
export function tutorCabinetRouter(db: Db) {
  const r = Router();
  r.use(requireAuth, requireRole('tutor'));

  // A tutor teaches something the site has no topic for yet (say, Armenian): the topic is added to the section
  // at once, so families can find it in the filters, and the admin is told to have a look.
  r.post('/topics', async (req, res) => {
    const body = z.object({ section: z.string(), name: z.string().trim().min(2, 'Слишком короткое название').max(40) }).parse(req.body);
    const name = body.name[0].toUpperCase() + body.name.slice(1);
    const section = findSection(body.section);
    if (!section || section.articlesOnly) throw new HttpError(400, 'Нет такого раздела');
    if (findUnsafeContent(name)) throw new HttpError(400, 'Название не прошло проверку безопасности');
    const same = section.topics.find((tp) => tp.name.toLowerCase() === name.toLowerCase());
    if (same) return res.json({ topic: same, content: await loadContentOverrides(db) });
    const topic = { id: newId('t'), name };
    await db.query('INSERT INTO cms_topics (id, section, name) VALUES ($1, $2, $3)', [topic.id, section.id, name]);
    await refreshContent(db);
    const t = await tutorForUser(db, req.user!.id);
    await notifyAdmins(db, 'topic', `Новая тема от наставника: ${name}`, `${t?.display_name ?? ''}, раздел «${section.name}»`, 'content');
    res.status(201).json({ topic, content: await loadContentOverrides(db) });
  });

  const myTutor = async (userId: string) => {
    const t = await tutorForUser(db, userId);
    if (!t) throw new HttpError(404, 'Профиль наставника не найден');
    return t;
  };

  r.get('/profile', async (req, res) => {
    res.json({ tutor: publicTutor(await myTutor(req.user!.id)) });
  });

  /** The tutor's page is open: shown as online on the tutor card for 5 minutes. */
  r.post('/ping', async (req, res) => {
    await db.query('UPDATE tutor_profiles SET last_seen_at = now() WHERE user_id = $1', [req.user!.id]);
    res.status(204).end();
  });

  r.put('/profile', async (req, res) => {
    const p = profileSchema.parse(req.body);
    const t = await myTutor(req.user!.id);
    // Contacts in a public profile would let families and children be taken off the platform.
    const unsafe = findUnsafeContent(`${p.headline}\n${p.bio}`);
    if (unsafe) {
      await flagUnsafe(db, req.user!.id, 'tutor-profile', `${p.headline}\n${p.bio}`, unsafe);
      throw new HttpError(400, `${unsafe}. Уберите контакты из описания: общение идёт только через платформу.`);
    }
    if (p.isPublished && t.verification !== 'approved') {
      throw new HttpError(400, 'Профиль можно опубликовать после проверки администратором. Заполните анкету и отправьте её на проверку.');
    }
    if (t.video_url !== (p.videoUrl || null)) await removeUploadedVideo(t.video_url);
    const { rows } = await db.query(
      `UPDATE tutor_profiles SET display_name = $2, headline = $3, bio = $4, video_url = $5, avatar = $6,
         subjects = $7, languages = $8, age_min = $9, age_max = $10, hourly_rate = $11, is_published = $12, country = $13
       WHERE id = $1 RETURNING *`,
      [t.id, p.displayName, p.headline, p.bio, p.videoUrl || null, p.avatar ?? t.avatar, p.subjects, p.languages, p.ageMin, p.ageMax, p.hourlyRate, p.isPublished, p.country === undefined ? t.country : p.country],
    );
    res.json({ tutor: publicTutor(rows[0]) });
  });

  /** Video introduction: the raw file is the request body (mp4, webm or mov). */
  r.post(
    '/video',
    express.raw({ type: Object.keys(VIDEO_TYPES), limit: `${config.maxVideoMb}mb` }),
    async (req, res) => {
      const ext = VIDEO_TYPES[req.header('content-type')?.split(';')[0] ?? ''];
      if (!ext || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw new HttpError(400, 'Загрузите видео в формате MP4, WebM или MOV');
      }
      const t = await myTutor(req.user!.id);
      const name = `${randomUUID()}.${ext}`;
      await writeFile(`${config.uploadsDir}/videos/${name}`, req.body);
      await removeUploadedVideo(t.video_url);
      const { rows } = await db.query('UPDATE tutor_profiles SET video_url = $2 WHERE id = $1 RETURNING *', [
        t.id,
        UPLOAD_PREFIX + name,
      ]);
      res.status(201).json({ tutor: publicTutor(rows[0]) });
    },
  );

  r.delete('/video', async (req, res) => {
    const t = await myTutor(req.user!.id);
    await removeUploadedVideo(t.video_url);
    const { rows } = await db.query('UPDATE tutor_profiles SET video_url = NULL WHERE id = $1 RETURNING *', [t.id]);
    res.json({ tutor: publicTutor(rows[0]) });
  });

  // ---- Application: education, experience and documents, reviewed by an admin ----

  r.get('/application', async (req, res) => {
    const t = await myTutor(req.user!.id);
    res.json({ application: publicApplication(t), documents: await documentsOf(db, t.id) });
  });

  r.put('/application', async (req, res) => {
    const a = applicationSchema.parse(req.body);
    const t = await myTutor(req.user!.id);
    if (t.verification === 'pending') throw new HttpError(400, 'Анкета на проверке. Изменить её можно после ответа администратора.');
    const { rows } = await db.query<TutorRow>(
      'UPDATE tutor_profiles SET education = $2, experience = $3 WHERE id = $1 RETURNING *',
      [t.id, JSON.stringify(a.education), JSON.stringify(a.experience)],
    );
    res.json({ application: publicApplication(rows[0]) });
  });

  /** A diploma or certificate: the raw file is the body, kind and title come in the query string. */
  r.post(
    '/documents',
    express.raw({ type: Object.keys(DOCUMENT_TYPES), limit: `${config.maxDocumentMb}mb` }),
    async (req, res) => {
      const mime = req.header('content-type')?.split(';')[0] ?? '';
      const ext = DOCUMENT_TYPES[mime];
      if (!ext || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw new HttpError(400, 'Загрузите документ в формате PDF, JPG или PNG');
      }
      const { kind, title } = z
        .object({
          kind: z.enum(['diploma', 'certificate', 'identity', 'other']),
          title: z.string().trim().min(2, 'Как называется документ?').max(120),
        })
        .parse(req.query);
      const t = await myTutor(req.user!.id);
      if (t.verification === 'pending') throw new HttpError(400, 'Анкета на проверке. Добавить документы можно после ответа администратора.');
      const { rows: count } = await db.query('SELECT count(*)::int AS n FROM tutor_documents WHERE tutor_id = $1', [t.id]);
      if (count[0].n >= MAX_DOCUMENTS) throw new HttpError(400, `Можно загрузить до ${MAX_DOCUMENTS} документов`);
      const name = `${randomUUID()}.${ext}`;
      await writeFile(`${config.documentsDir}/${name}`, req.body);
      const { rows } = await db.query(
        'INSERT INTO tutor_documents (tutor_id, kind, title, file_name, mime, size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [t.id, kind, title, name, mime, req.body.length],
      );
      res.status(201).json({ document: publicDocument(rows[0]) });
    },
  );

  r.get('/documents/:id/file', async (req, res) => {
    const t = await myTutor(req.user!.id);
    await sendDocument(db, t.id, req.params.id, res);
  });

  r.delete('/documents/:id', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Документ не найден');
    const t = await myTutor(req.user!.id);
    if (t.verification === 'pending') throw new HttpError(400, 'Анкета на проверке. Удалить документ можно после ответа администратора.');
    const { rows } = await db.query('DELETE FROM tutor_documents WHERE id = $1 AND tutor_id = $2 RETURNING file_name', [req.params.id, t.id]);
    if (!rows[0]) throw new HttpError(404, 'Документ не найден');
    await unlink(`${config.documentsDir}/${rows[0].file_name}`).catch(() => {});
    res.status(204).end();
  });

  r.post('/application/submit', async (req, res) => {
    const t = await myTutor(req.user!.id);
    if (t.verification === 'pending') throw new HttpError(400, 'Анкета уже на проверке');
    const missing: string[] = [];
    if (t.headline.trim().length < 5 || t.bio.trim().length < 30) missing.push('Заполните заголовок и рассказ о себе во вкладке «Профиль»');
    if (!t.education.length) missing.push('Добавьте образование');
    const docs = await documentsOf(db, t.id);
    if (!docs.some((d) => d.kind === 'diploma' || d.kind === 'certificate')) missing.push('Загрузите хотя бы один диплом или сертификат');
    if (!docs.some((d) => d.kind === 'identity')) missing.push('Загрузите копию удостоверения личности или паспорта');
    if (missing.length) throw new HttpError(400, ['Анкета ещё не готова', ...missing].join('. '));
    const { rows } = await db.query<TutorRow>(
      `UPDATE tutor_profiles SET verification = 'pending', submitted_at = now(), verification_note = NULL WHERE id = $1 RETURNING *`,
      [t.id],
    );
    await notifyAdmins(db, 'tutor-application', `Анкета преподавателя на проверку: ${t.display_name}`, t.headline, `tutor:${t.id}`);
    res.json({ application: publicApplication(rows[0]), tutor: publicTutor(rows[0]) });
  });

  r.get('/slots', async (req, res) => {
    const t = await myTutor(req.user!.id);
    const { rows } = await db.query(
      `SELECT s.id, s.starts_at, s.duration_min,
              EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status <> 'cancelled') AS booked
         FROM tutor_slots s WHERE s.tutor_id = $1 AND s.starts_at > now() ORDER BY s.starts_at`,
      [t.id],
    );
    res.json({ slots: rows.map((s) => ({ id: s.id, startsAt: s.starts_at, durationMin: s.duration_min, booked: s.booked })) });
  });

  r.post('/slots', async (req, res) => {
    const body = slotsSchema.parse(req.body);
    const t = await myTutor(req.user!.id);
    const now = Date.now();
    const times = body.startsAt.map((s) => new Date(s));
    if (times.some((d) => d.getTime() <= now || d.getTime() > now + MAX_DAYS_AHEAD * 86_400_000)) {
      throw new HttpError(400, `Слоты можно добавлять на ближайшие ${MAX_DAYS_AHEAD} дней`);
    }
    const { rowCount } = await db.query(
      `INSERT INTO tutor_slots (tutor_id, starts_at, duration_min)
       SELECT $1, unnest($2::timestamptz[]), $3 ON CONFLICT DO NOTHING`,
      [t.id, times, body.durationMin],
    );
    res.status(201).json({ added: rowCount });
  });

  r.delete('/slots/:id', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Слот не найден');
    const t = await myTutor(req.user!.id);
    const { rowCount } = await db.query(
      `DELETE FROM tutor_slots s WHERE s.id = $1 AND s.tutor_id = $2
         AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status <> 'cancelled')`,
      [req.params.id, t.id],
    );
    if (!rowCount) throw new HttpError(400, 'На это время уже есть запись, сначала отмените урок');
    res.status(204).end();
  });

  return r;
}

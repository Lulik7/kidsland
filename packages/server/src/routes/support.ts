import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { notifyAdmins } from '../notify';
import { isUuid } from '../tutors';

const messageSchema = z.object({ body: z.string().trim().min(1, 'Напишите сообщение').max(2000) });

const AUTO_REPLY =
  'Здравствуйте! Мы получили ваше сообщение и ответим в течение дня. Если вопрос об уроке, напишите, пожалуйста, имя наставника и дату.';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicMessage = (m: any) => ({ id: m.id, body: m.body, isStaff: m.is_staff, createdAt: m.created_at });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicThread = (t: any) => ({
  id: t.id,
  status: t.status,
  userUnread: t.user_unread,
  staffUnread: t.staff_unread,
  updatedAt: t.updated_at,
  ...(t.email !== undefined ? { user: { id: t.user_id, email: t.email, role: t.role }, lastMessage: t.last_body ?? '' } : {}),
});

async function messagesOf(db: Db, threadId: string) {
  const { rows } = await db.query('SELECT * FROM support_messages WHERE thread_id = $1 ORDER BY created_at, id', [threadId]);
  return rows.map(publicMessage);
}

/** Support chat: every signed-in user has one conversation with the Kidsland team. */
export function supportRouter(db: Db) {
  const r = Router();
  r.use(requireAuth);

  r.get('/', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM support_threads WHERE user_id = $1', [req.user!.id]);
    if (!rows[0]) return res.json({ thread: null, messages: [] });
    if (rows[0].user_unread) await db.query('UPDATE support_threads SET user_unread = false WHERE id = $1', [rows[0].id]);
    res.json({ thread: publicThread(rows[0]), messages: await messagesOf(db, rows[0].id) });
  });

  r.post('/messages', async (req, res) => {
    const { body } = messageSchema.parse(req.body);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows: created } = await client.query(
        `INSERT INTO support_threads (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING id`,
        [req.user!.id],
      );
      const { rows } = await client.query(
        `UPDATE support_threads SET status = 'open', staff_unread = true, updated_at = now() WHERE user_id = $1 RETURNING *`,
        [req.user!.id],
      );
      const thread = rows[0];
      await client.query('INSERT INTO support_messages (thread_id, author_id, body) VALUES ($1, $2, $3)', [
        thread.id,
        req.user!.id,
        body,
      ]);
      if (created[0]) {
        // A short automatic answer, so the first message never hangs in silence.
        await client.query(
          "INSERT INTO support_messages (thread_id, is_staff, body, created_at) VALUES ($1, true, $2, now() + interval '1 millisecond')",
          [thread.id, AUTO_REPLY],
        );
      }
      await client.query('COMMIT');
      const { rows: who } = await db.query('SELECT email, role FROM users WHERE id = $1', [req.user!.id]);
      const roleName = { parent: 'родителя', tutor: 'наставника', admin: 'админа' }[who[0]?.role as string] ?? 'пользователя';
      await notifyAdmins(db, 'support', `Новое сообщение от ${roleName} ${who[0]?.email ?? ''}`, body, `support:${thread.id}`);
      res.status(201).json({ thread: publicThread(thread), messages: await messagesOf(db, thread.id) });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });

  // ---- Staff side ----
  const admin = Router();
  admin.use(requireRole('admin'));

  admin.get('/threads', async (_req, res) => {
    const { rows } = await db.query(
      `SELECT t.*, u.email, u.role,
              (SELECT body FROM support_messages m WHERE m.thread_id = t.id ORDER BY created_at DESC, id DESC LIMIT 1) AS last_body
         FROM support_threads t JOIN users u ON u.id = t.user_id
        ORDER BY (t.status = 'open') DESC, t.staff_unread DESC, t.updated_at DESC
        LIMIT 200`,
    );
    res.json({ threads: rows.map(publicThread) });
  });

  const loadThread = async (id: string) => {
    if (!isUuid(id)) throw new HttpError(404, 'Обращение не найдено');
    const { rows } = await db.query(
      `SELECT t.*, u.email, u.role FROM support_threads t JOIN users u ON u.id = t.user_id WHERE t.id = $1`,
      [id],
    );
    if (!rows[0]) throw new HttpError(404, 'Обращение не найдено');
    return rows[0];
  };

  admin.get('/threads/:id', async (req, res) => {
    const t = await loadThread(req.params.id);
    await db.query('UPDATE support_threads SET staff_unread = false WHERE id = $1', [t.id]);
    res.json({ thread: publicThread({ ...t, staff_unread: false }), messages: await messagesOf(db, t.id) });
  });

  admin.post('/threads/:id/messages', async (req, res) => {
    const { body } = messageSchema.parse(req.body);
    const t = await loadThread(req.params.id);
    await db.query('INSERT INTO support_messages (thread_id, author_id, is_staff, body) VALUES ($1, $2, true, $3)', [
      t.id,
      req.user!.id,
      body,
    ]);
    const { rows } = await db.query(
      `UPDATE support_threads SET user_unread = true, staff_unread = false, updated_at = now() WHERE id = $1 RETURNING *`,
      [t.id],
    );
    res.status(201).json({ thread: publicThread({ ...rows[0], email: t.email, role: t.role }), messages: await messagesOf(db, t.id) });
  });

  admin.post('/threads/:id/status', async (req, res) => {
    const { status } = z.object({ status: z.enum(['open', 'closed']) }).parse(req.body);
    const t = await loadThread(req.params.id);
    await db.query('UPDATE support_threads SET status = $2 WHERE id = $1', [t.id, status]);
    res.json({ thread: publicThread({ ...t, status }) });
  });

  admin.get('/safety-flags', async (_req, res) => {
    const { rows } = await db.query(
      `SELECT f.*, u.email, u.role FROM safety_flags f LEFT JOIN users u ON u.id = f.user_id ORDER BY f.created_at DESC LIMIT 100`,
    );
    res.json({
      flags: rows.map((f) => ({
        id: f.id,
        context: f.context,
        body: f.body,
        reason: f.reason,
        createdAt: f.created_at,
        user: f.user_id ? { id: f.user_id, email: f.email, role: f.role } : null,
      })),
    });
  });

  r.use('/admin', admin);
  return r;
}

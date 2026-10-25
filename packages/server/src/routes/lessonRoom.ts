import { findUnsafeContent } from '@kidsland/shared';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { notifyAdmins } from '../notify';
import { isUuid } from '../tutors';

const MAX_STROKES = 3000;

const messageSchema = z.object({ body: z.string().trim().min(1, 'Напишите сообщение').max(1000) });
const strokeSchema = z.object({
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  width: z.number().min(1).max(40),
  tool: z.enum(['pen', 'eraser']).default('pen'),
  // Normalised 0..1 coordinates, so the board looks the same at any size.
  points: z.array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])).min(1).max(1000),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicMessage = (m: any) => ({ id: m.id, body: m.body, isTutor: m.is_tutor, createdAt: m.created_at });

/** Records a blocked message so moderators can see who tried to ask for personal data. */
export async function flagUnsafe(db: Db, userId: string, context: string, body: string, reason: string) {
  await db.query('INSERT INTO safety_flags (user_id, context, body, reason) VALUES ($1, $2, $3, $4)', [
    userId,
    context,
    body.slice(0, 2000),
    reason,
  ]);
  await notifyAdmins(db, 'safety', `Заблокировано сообщение: ${reason}`, body, 'safety');
}

/** Chat and whiteboard of one lesson. Only the booking's parent and its tutor get in. */
export function lessonRoomRouter(db: Db) {
  const r = Router();
  r.use(requireAuth);

  const access = async (bookingId: string, userId: string) => {
    if (!isUuid(bookingId)) throw new HttpError(404, 'Урок не найден');
    const { rows } = await db.query(
      `SELECT b.id, b.status, t.user_id = $2 AS is_tutor
         FROM bookings b JOIN tutor_profiles t ON t.id = b.tutor_id
        WHERE b.id = $1 AND (b.parent_id = $2 OR t.user_id = $2)`,
      [bookingId, userId],
    );
    if (!rows[0]) throw new HttpError(404, 'Урок не найден');
    return rows[0] as { id: string; status: string; is_tutor: boolean };
  };

  /** Polled by the room. Returns messages since `after` and the board when its version changed. */
  r.get('/:id/room', async (req, res) => {
    const b = await access(req.params.id, req.user!.id);
    const after = typeof req.query.after === 'string' && !Number.isNaN(Date.parse(req.query.after)) ? req.query.after : null;
    const known = Number(req.query.board ?? -1);
    const { rows: messages } = await db.query(
      `SELECT * FROM lesson_messages WHERE booking_id = $1 AND ($2::timestamptz IS NULL OR created_at >= $2)
        ORDER BY created_at, id LIMIT 500`,
      [b.id, after],
    );
    const { rows: boards } = await db.query('SELECT version, strokes FROM lesson_boards WHERE booking_id = $1', [b.id]);
    const version = boards[0]?.version ?? 0;
    res.json({
      messages: messages.map(publicMessage),
      board: version === known ? null : { version, strokes: boards[0]?.strokes ?? [] },
      youAreTutor: b.is_tutor,
    });
  });

  r.post('/:id/messages', async (req, res) => {
    const { body } = messageSchema.parse(req.body);
    const b = await access(req.params.id, req.user!.id);
    const unsafe = findUnsafeContent(body);
    if (unsafe) {
      await flagUnsafe(db, req.user!.id, `lesson:${b.id}`, body, unsafe);
      throw new HttpError(422, `${unsafe}. Сообщение не отправлено, модератор получил уведомление.`);
    }
    const { rows } = await db.query(
      'INSERT INTO lesson_messages (booking_id, author_id, is_tutor, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [b.id, req.user!.id, b.is_tutor, body],
    );
    res.status(201).json({ message: publicMessage(rows[0]) });
  });

  r.post('/:id/board', async (req, res) => {
    const stroke = strokeSchema.parse(req.body.stroke);
    const b = await access(req.params.id, req.user!.id);
    const { rows } = await db.query(
      `INSERT INTO lesson_boards (booking_id, strokes, version) VALUES ($1, jsonb_build_array($2::jsonb), 1)
       ON CONFLICT (booking_id) DO UPDATE SET
         strokes = CASE WHEN jsonb_array_length(lesson_boards.strokes) >= $3 THEN lesson_boards.strokes
                        ELSE lesson_boards.strokes || jsonb_build_array($2::jsonb) END,
         version = lesson_boards.version + 1, updated_at = now()
       RETURNING version`,
      [b.id, JSON.stringify(stroke), MAX_STROKES],
    );
    res.status(201).json({ version: rows[0].version });
  });

  r.post('/:id/board/clear', async (req, res) => {
    const b = await access(req.params.id, req.user!.id);
    const { rows } = await db.query(
      `INSERT INTO lesson_boards (booking_id, strokes, version) VALUES ($1, '[]', 1)
       ON CONFLICT (booking_id) DO UPDATE SET strokes = '[]', version = lesson_boards.version + 1, updated_at = now()
       RETURNING version`,
      [b.id],
    );
    res.json({ version: rows[0].version });
  });

  return r;
}

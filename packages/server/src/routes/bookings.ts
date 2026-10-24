import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import { config } from '../config';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { getChildForUser } from '../levels';
import { isUuid } from '../tutors';

const createSchema = z.object({
  slotId: z.string().refine(isUuid, 'Некорректный слот'),
  childId: z.string().refine(isUuid, 'Некорректный профиль ребёнка'),
});

const BOOKING_SELECT = `
  SELECT b.*, t.display_name AS tutor_name, t.avatar AS tutor_avatar, t.user_id AS tutor_user_id, s.duration_min,
         c.nickname AS child_name, c.avatar_url AS child_avatar
    FROM bookings b
    JOIN tutor_profiles t ON t.id = b.tutor_id
    JOIN tutor_slots s ON s.id = b.slot_id
    JOIN child_profiles c ON c.id = b.child_id`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicBooking = (b: any) => ({
  id: b.id,
  status: b.status,
  startsAt: b.slot_time,
  durationMin: b.duration_min,
  isTrial: b.is_trial,
  price: b.price,
  meetingLink: b.meeting_link,
  tutor: { id: b.tutor_id, displayName: b.tutor_name, avatar: b.tutor_avatar },
  child: { id: b.child_id, nickname: b.child_name, avatarUrl: b.child_avatar },
  createdAt: b.created_at,
});

export function bookingsRouter(db: Db) {
  const r = Router();
  r.use(requireAuth);

  /** Lists the caller's lessons: a parent sees their bookings, a tutor sees bookings with them. */
  r.get('/', async (req, res) => {
    const where = req.user!.role === 'tutor' ? 't.user_id = $1' : 'b.parent_id = $1';
    const { rows } = await db.query(`${BOOKING_SELECT} WHERE ${where} ORDER BY b.slot_time`, [req.user!.id]);
    res.json({ bookings: rows.map(publicBooking) });
  });

  r.get('/:id', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Урок не найден');
    const { rows } = await db.query(`${BOOKING_SELECT} WHERE b.id = $1 AND (b.parent_id = $2 OR t.user_id = $2)`, [
      req.params.id,
      req.user!.id,
    ]);
    if (!rows[0]) throw new HttpError(404, 'Урок не найден');
    res.json({ booking: publicBooking(rows[0]) });
  });

  /** Books a free slot for one of the parent's children. The family's first lesson is a free trial. */
  r.post('/', requireRole('parent'), async (req, res) => {
    const body = createSchema.parse(req.body);
    const child = await getChildForUser(db, body.childId, req.user!.id);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows: slots } = await client.query(
        `SELECT s.*, t.hourly_rate FROM tutor_slots s JOIN tutor_profiles t ON t.id = s.tutor_id
          WHERE s.id = $1 AND t.is_published FOR UPDATE OF s`,
        [body.slotId],
      );
      const slot = slots[0];
      if (!slot) throw new HttpError(404, 'Это время больше недоступно');
      if (new Date(slot.starts_at).getTime() < Date.now() + 30 * 60_000) {
        throw new HttpError(400, 'Записаться можно не позже чем за 30 минут до начала');
      }
      const { rows: taken } = await client.query(
        "SELECT 1 FROM bookings WHERE slot_id = $1 AND status <> 'cancelled'",
        [slot.id],
      );
      if (taken[0]) throw new HttpError(409, 'Это время уже заняли. Выберите другое');
      const { rows: trials } = await client.query(
        "SELECT 1 FROM bookings WHERE parent_id = $1 AND is_trial AND status <> 'cancelled'",
        [req.user!.id],
      );
      const isTrial = !trials[0];
      const id = randomUUID();
      const { rows } = await client.query(
        `INSERT INTO bookings (id, parent_id, child_id, tutor_id, slot_id, slot_time, is_trial, price, meeting_link)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          id,
          req.user!.id,
          child.id,
          slot.tutor_id,
          slot.id,
          slot.starts_at,
          isTrial,
          isTrial ? 0 : slot.hourly_rate,
          `https://${config.jitsiDomain}/kidsland-${id.replaceAll('-', '')}`,
        ],
      );
      await client.query('COMMIT');
      const { rows: full } = await db.query(`${BOOKING_SELECT} WHERE b.id = $1`, [rows[0].id]);
      res.status(201).json({ booking: publicBooking(full[0]) });
    } catch (e) {
      await client.query('ROLLBACK');
      // The partial unique index is the last line of defence against two parents booking at once.
      if ((e as { code?: string }).code === '23505') throw new HttpError(409, 'Это время уже заняли. Выберите другое');
      throw e;
    } finally {
      client.release();
    }
  });

  r.post('/:id/cancel', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Урок не найден');
    const { rows } = await db.query(
      `UPDATE bookings b SET status = 'cancelled'
         FROM tutor_profiles t
        WHERE b.id = $1 AND t.id = b.tutor_id AND (b.parent_id = $2 OR t.user_id = $2)
          AND b.status = 'scheduled' AND b.slot_time > now()
        RETURNING b.id`,
      [req.params.id, req.user!.id],
    );
    if (!rows[0]) throw new HttpError(400, 'Этот урок нельзя отменить');
    const { rows: full } = await db.query(`${BOOKING_SELECT} WHERE b.id = $1`, [rows[0].id]);
    res.json({ booking: publicBooking(full[0]) });
  });

  return r;
}

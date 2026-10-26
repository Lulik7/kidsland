import { findUnsafeContent, LANGUAGE_IDS, SECTION_IDS, TOPIC_IDS, topicsOfSection } from '@kidsland/shared';
import { requireAuth, requireRole } from '../auth';
import { flagUnsafe } from './lessonRoom';
import { Router } from 'express';
import { z } from 'zod';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { FREE_SLOT_SQL, isUuid, publicTutor, TUTOR_EXTRA_SQL, type TutorRow } from '../tutors';

const filterSchema = z.object({
  // Checked against the live list: tutors and the admin add topics while the server runs.
  subject: z
    .string()
    .refine((id) => TOPIC_IDS.includes(id))
    .optional(),
  section: z.enum(SECTION_IDS as [string, ...string[]]).optional(),
  language: z.enum(LANGUAGE_IDS as [string, ...string[]]).optional(),
  age: z.coerce.number().int().min(3).max(18).optional(),
  sort: z.enum(['rating', 'price', 'soonest']).catch('rating').default('rating'),
});

const ORDER = {
  rating: 'rating DESC, reviews_count DESC',
  price: 'students ASC',
  soonest: 'next_slot ASC NULLS LAST',
};

/** Public catalogue: anyone can browse tutors before signing up. */
export function tutorsRouter(db: Db) {
  const r = Router();

  r.get('/', async (req, res) => {
    const f = filterSchema.parse(req.query);
    const { rows } = await db.query<TutorRow & { next_slot: Date | null; free_slots: number }>(
      `SELECT t.*, slots.next_slot, slots.free_slots, ${TUTOR_EXTRA_SQL}
         FROM tutor_profiles t
         LEFT JOIN LATERAL (
           SELECT min(s.starts_at) AS next_slot, count(*)::int AS free_slots
             FROM tutor_slots s WHERE s.tutor_id = t.id AND ${FREE_SLOT_SQL}
         ) slots ON true
        WHERE t.is_published
          AND ($1::text IS NULL OR $1 = ANY(t.subjects))
          AND ($2::text IS NULL OR $2 = ANY(t.languages))
          AND ($3::int IS NULL OR $3 BETWEEN t.age_min AND t.age_max)
          AND ($4::text[] IS NULL OR t.subjects && $4)
        ORDER BY ${ORDER[f.sort]}`,
      [f.subject ?? null, f.language ?? null, f.age ?? null, f.section ? topicsOfSection(f.section) : null],
    );
    res.json({ tutors: rows.map(publicTutor) });
  });

  r.get('/:id', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Наставник не найден');
    const { rows } = await db.query<TutorRow>(`SELECT t.*, ${TUTOR_EXTRA_SQL} FROM tutor_profiles t WHERE t.id = $1 AND t.is_published`, [req.params.id]);
    if (!rows[0]) throw new HttpError(404, 'Наставник не найден');
    const { rows: slots } = await db.query(
      `SELECT s.id, s.starts_at, s.duration_min FROM tutor_slots s
        WHERE s.tutor_id = $1 AND ${FREE_SLOT_SQL} AND s.starts_at < now() + interval '30 days'
        ORDER BY s.starts_at`,
      [rows[0].id],
    );
    res.json({
      tutor: publicTutor(rows[0]),
      slots: slots.map((s) => ({ id: s.id, startsAt: s.starts_at, durationMin: s.duration_min })),
    });
  });

  r.get('/:id/reviews', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Наставник не найден');
    const { rows } = await db.query(
      'SELECT id, author_name, rating, body, created_at, parent_id FROM tutor_reviews WHERE tutor_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.params.id],
    );
    res.json({ reviews: rows.map((x) => ({ id: x.id, author: x.author_name, rating: x.rating, body: x.body, createdAt: x.created_at })) });
  });

  /** A parent whose child already had a lesson with the tutor can leave one review (and change it). */
  r.post('/:id/reviews', requireAuth, requireRole('parent'), async (req, res) => {
    const id = String(req.params.id);
    if (!isUuid(id)) throw new HttpError(404, 'Наставник не найден');
    const body = z
      .object({ rating: z.number().int().min(1).max(5), body: z.string().trim().min(10, 'Напишите хотя бы пару слов').max(1000), author: z.string().trim().min(2).max(40) })
      .parse(req.body);
    const { rows: had } = await db.query(
      "SELECT 1 FROM bookings WHERE parent_id = $1 AND tutor_id = $2 AND status <> 'cancelled' AND slot_time < now() LIMIT 1",
      [req.user!.id, id],
    );
    if (!had[0]) throw new HttpError(403, 'Отзыв можно оставить после первого урока с этим наставником');
    const unsafe = findUnsafeContent(`${body.author} ${body.body}`);
    if (unsafe) {
      await flagUnsafe(db, req.user!.id, `review:${id}`, body.body, unsafe);
      throw new HttpError(422, `${unsafe}. Отзыв не опубликован.`);
    }
    const { rows: old } = await db.query('SELECT rating FROM tutor_reviews WHERE tutor_id = $1 AND parent_id = $2', [id, req.user!.id]);
    await db.query(
      `INSERT INTO tutor_reviews (tutor_id, parent_id, author_name, rating, body) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tutor_id, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET author_name = $3, rating = $4, body = $5, created_at = now()`,
      [id, req.user!.id, body.author, body.rating, body.body],
    );
    // Keep the card's average rating in step with the reviews.
    if (old[0])
      await db.query('UPDATE tutor_profiles SET rating = LEAST(5, GREATEST(1, round((rating * reviews_count - $2 + $3) / GREATEST(reviews_count, 1), 1))) WHERE id = $1', [id, old[0].rating, body.rating]);
    else await db.query('UPDATE tutor_profiles SET rating = round((rating * reviews_count + $2) / (reviews_count + 1), 1), reviews_count = reviews_count + 1 WHERE id = $1', [id, body.rating]);
    res.status(201).json({ ok: true });
  });

  return r;
}

import { LANGUAGE_IDS, SECTION_IDS, TOPIC_IDS, topicsOfSection } from '@kidsland/shared';
import { Router } from 'express';
import { z } from 'zod';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { FREE_SLOT_SQL, isUuid, publicTutor, type TutorRow } from '../tutors';

const filterSchema = z.object({
  subject: z.enum(TOPIC_IDS as [string, ...string[]]).optional(),
  section: z.enum(SECTION_IDS as [string, ...string[]]).optional(),
  language: z.enum(LANGUAGE_IDS as [string, ...string[]]).optional(),
  age: z.coerce.number().int().min(3).max(18).optional(),
  sort: z.enum(['rating', 'price', 'soonest']).default('rating'),
});

const ORDER = {
  rating: 'rating DESC, reviews_count DESC',
  price: 'hourly_rate ASC',
  soonest: 'next_slot ASC NULLS LAST',
};

/** Public catalogue: anyone can browse tutors before signing up. */
export function tutorsRouter(db: Db) {
  const r = Router();

  r.get('/', async (req, res) => {
    const f = filterSchema.parse(req.query);
    const { rows } = await db.query<TutorRow & { next_slot: Date | null; free_slots: number }>(
      `SELECT t.*, slots.next_slot, slots.free_slots
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
    const { rows } = await db.query<TutorRow>('SELECT * FROM tutor_profiles WHERE id = $1 AND is_published', [req.params.id]);
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

  return r;
}

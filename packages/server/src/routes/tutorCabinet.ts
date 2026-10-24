import { LANGUAGE_IDS, SUBJECT_IDS } from '@kidsland/shared';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { isUuid, publicTutor, tutorForUser } from '../tutors';

const profileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(60),
    headline: z.string().trim().max(120),
    bio: z.string().trim().max(2000),
    videoUrl: z.union([z.string().trim().url().max(300), z.literal('')]).optional(),
    avatar: z.string().max(40).optional(),
    subjects: z.array(z.enum(SUBJECT_IDS as [string, ...string[]])).min(1, 'Выберите хотя бы один предмет'),
    languages: z.array(z.enum(LANGUAGE_IDS as [string, ...string[]])).min(1, 'Выберите хотя бы один язык'),
    ageMin: z.number().int().min(4).max(18),
    ageMax: z.number().int().min(4).max(18),
    hourlyRate: z.number().int().min(0).max(50000),
    isPublished: z.boolean(),
  })
  .refine((p) => p.ageMin <= p.ageMax, { message: 'Минимальный возраст больше максимального', path: ['ageMin'] });

const MAX_DAYS_AHEAD = 60;
const slotsSchema = z.object({
  startsAt: z.array(z.string().datetime({ offset: true })).min(1).max(50),
  durationMin: z.number().int().min(15).max(120).default(45),
});

/** A tutor's own profile, schedule and lessons. */
export function tutorCabinetRouter(db: Db) {
  const r = Router();
  r.use(requireAuth, requireRole('tutor'));

  const myTutor = async (userId: string) => {
    const t = await tutorForUser(db, userId);
    if (!t) throw new HttpError(404, 'Профиль наставника не найден');
    return t;
  };

  r.get('/profile', async (req, res) => {
    res.json({ tutor: publicTutor(await myTutor(req.user!.id)) });
  });

  r.put('/profile', async (req, res) => {
    const p = profileSchema.parse(req.body);
    const t = await myTutor(req.user!.id);
    const { rows } = await db.query(
      `UPDATE tutor_profiles SET display_name = $2, headline = $3, bio = $4, video_url = $5, avatar = $6,
         subjects = $7, languages = $8, age_min = $9, age_max = $10, hourly_rate = $11, is_published = $12
       WHERE id = $1 RETURNING *`,
      [t.id, p.displayName, p.headline, p.bio, p.videoUrl || null, p.avatar ?? t.avatar, p.subjects, p.languages, p.ageMin, p.ageMax, p.hourlyRate, p.isPublished],
    );
    res.json({ tutor: publicTutor(rows[0]) });
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

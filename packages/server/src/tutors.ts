import { tutorPrice } from '@kidsland/shared';
import type { Db } from './db/pool';

export interface TutorRow {
  id: string;
  user_id: string;
  display_name: string;
  headline: string;
  bio: string;
  video_url: string | null;
  avatar: string | null;
  subjects: string[];
  languages: string[];
  country: string | null;
  age_min: number;
  age_max: number;
  hourly_rate: number;
  rating: string;
  reviews_count: number;
  is_published: boolean;
  verification: 'draft' | 'pending' | 'approved' | 'rejected';
  verification_note: string | null;
  submitted_at: Date | null;
  reviewed_at: Date | null;
  education: EducationItem[];
  experience: ExperienceItem[];
}

export interface EducationItem {
  institution: string;
  specialty: string;
  yearFrom: number;
  yearTo: number | null;
}
export interface ExperienceItem {
  place: string;
  position: string;
  yearFrom: number;
  yearTo: number | null;
}

/**
 * Extra columns for a tutor row `t`: pupils (demo base + children who booked), whether the tutor is online
 * (seen in the last 5 minutes; demo tutors take turns by the hour).
 */
export const TUTOR_EXTRA_SQL = `
  t.students_base + (SELECT count(DISTINCT b.child_id) FROM bookings b WHERE b.tutor_id = t.id AND b.status <> 'cancelled')::int AS students,
  (t.last_seen_at > now() - interval '5 minutes'
    OR ((SELECT password_hash FROM users WHERE id = t.user_id) = '!demo'
        AND (abs(hashtext(t.id::text)) + extract(hour from now())::int) % 3 = 0)) AS online`;

export const publicTutor = (t: TutorRow & { next_slot?: Date | null; free_slots?: number; students?: number; online?: boolean }) => ({
  id: t.id,
  displayName: t.display_name,
  headline: t.headline,
  bio: t.bio,
  videoUrl: t.video_url,
  avatar: t.avatar,
  subjects: t.subjects,
  languages: t.languages,
  country: t.country ?? null,
  ageMin: t.age_min,
  ageMax: t.age_max,
  students: t.students ?? 0,
  price: tutorPrice(t.students ?? 0),
  online: !!t.online,
  isNew: t.reviews_count < 10,
  rating: Number(t.rating),
  reviewsCount: t.reviews_count,
  isPublished: t.is_published,
  verification: t.verification,
  ...(t.next_slot !== undefined ? { nextSlot: t.next_slot, freeSlots: t.free_slots ?? 0 } : {}),
});

/** Slots in the future with no live booking. */
export const FREE_SLOT_SQL = `
  s.starts_at > now()
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status <> 'cancelled')`;

/** The tutor's lesson price now, from the number of pupils. */
export async function priceOfTutor(db: { query: Db['query'] }, tutorId: string): Promise<{ price: number; name: string } | null> {
  const { rows } = await db.query(`SELECT t.display_name, ${TUTOR_EXTRA_SQL} FROM tutor_profiles t WHERE t.id = $1 AND t.is_published`, [tutorId]);
  return rows[0] ? { price: tutorPrice(rows[0].students), name: rows[0].display_name } : null;
}

export async function tutorForUser(db: Db, userId: string): Promise<TutorRow | null> {
  const { rows } = await db.query<TutorRow>('SELECT * FROM tutor_profiles WHERE user_id = $1', [userId]);
  return rows[0] ?? null;
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

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
  age_min: number;
  age_max: number;
  hourly_rate: number;
  rating: string;
  reviews_count: number;
  is_published: boolean;
}

export const publicTutor = (t: TutorRow & { next_slot?: Date | null; free_slots?: number }) => ({
  id: t.id,
  displayName: t.display_name,
  headline: t.headline,
  bio: t.bio,
  videoUrl: t.video_url,
  avatar: t.avatar,
  subjects: t.subjects,
  languages: t.languages,
  ageMin: t.age_min,
  ageMax: t.age_max,
  hourlyRate: t.hourly_rate,
  rating: Number(t.rating),
  reviewsCount: t.reviews_count,
  isPublished: t.is_published,
  ...(t.next_slot !== undefined ? { nextSlot: t.next_slot, freeSlots: t.free_slots ?? 0 } : {}),
});

/** Slots in the future with no live booking. */
export const FREE_SLOT_SQL = `
  s.starts_at > now()
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status <> 'cancelled')`;

export async function tutorForUser(db: Db, userId: string): Promise<TutorRow | null> {
  const { rows } = await db.query<TutorRow>('SELECT * FROM tutor_profiles WHERE user_id = $1', [userId]);
  return rows[0] ?? null;
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

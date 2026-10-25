import type { Db } from './db/pool';

export type NotificationKind = 'support' | 'tutor-application' | 'post' | 'safety';

/** Leaves a note in the admin's notification list. Never fails the request that caused it. */
export async function notifyAdmins(db: Db, kind: NotificationKind, title: string, body = '', link: string | null = null) {
  await db
    .query('INSERT INTO admin_notifications (kind, title, body, link) VALUES ($1, $2, $3, $4)', [kind, title, body.slice(0, 500), link])
    .catch(() => {});
}

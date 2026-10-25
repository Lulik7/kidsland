import { config } from './config';
import type { Db } from './db/pool';
import { queueMail } from './mail';

/** Time zone for people who have not chosen one yet: most families are in Israel. */
const DEFAULT_TZ = 'Asia/Jerusalem';
/** The "lesson today" letter goes out at this local hour (or right away when the lesson is booked later that day). */
const MORNING = '08:00';

const fmt = (d: Date, tz: string) =>
  d.toLocaleString('ru-RU', { timeZone: tz, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const time = (d: Date, tz: string) => d.toLocaleTimeString('ru-RU', { timeZone: tz, hour: '2-digit', minute: '2-digit' });

const LESSONS = `
  SELECT b.id, b.slot_time, s.duration_min, c.nickname AS child_name, t.display_name AS tutor_name,
         p.email AS parent_email, COALESCE(p.timezone, '${DEFAULT_TZ}') AS parent_tz,
         tu.email AS tutor_email, COALESCE(tu.timezone, '${DEFAULT_TZ}') AS tutor_tz
    FROM bookings b
    JOIN tutor_slots s ON s.id = b.slot_id
    JOIN child_profiles c ON c.id = b.child_id
    JOIN tutor_profiles t ON t.id = b.tutor_id
    JOIN users p ON p.id = b.parent_id
    JOIN users tu ON tu.id = t.user_id
   WHERE b.status = 'scheduled'`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function letter(b: Row, who: 'parent' | 'tutor', soon: boolean) {
  const tz = who === 'parent' ? b.parent_tz : b.tutor_tz;
  const start = new Date(b.slot_time);
  const link = `${config.appUrl}/lessons/${b.id}`;
  const withWhom = who === 'parent' ? `${b.child_name} занимается с наставником ${b.tutor_name}` : `Урок с учеником ${b.child_name}`;
  const subject = soon
    ? `Kidsland: урок начнётся через 30 минут (${time(start, tz)})`
    : `Kidsland: сегодня урок в ${time(start, tz)}`;
  const body = [
    soon ? 'Через 30 минут начинается урок.' : 'Напоминаем: сегодня урок.',
    '',
    withWhom + '.',
    `Начало: ${fmt(start, tz)}, ${b.duration_min} мин.`,
    `Войти в урок: ${link}`,
    '',
    'Если не получается прийти, отмените урок в личном кабинете заранее.',
    'Команда Kidsland',
  ].join('\n');
  return { subject, body };
}

/**
 * Sends lesson reminders to the parent and the tutor: one on the lesson day (from 8:00 their time)
 * and one 30 minutes before the start. Each letter goes out once; flags on the booking remember it.
 */
export async function sendLessonReminders(db: Db) {
  // 30 minutes before: one pass for both sides.
  const soon = await db.query(
    `${LESSONS} AND b.reminded_soon_at IS NULL AND b.slot_time > now() AND b.slot_time <= now() + interval '30 minutes'`,
  );
  for (const b of soon.rows) {
    const claimed = await db.query('UPDATE bookings SET reminded_soon_at = now() WHERE id = $1 AND reminded_soon_at IS NULL', [b.id]);
    if (!claimed.rowCount) continue;
    for (const who of ['parent', 'tutor'] as const) {
      const m = letter(b, who, true);
      await queueMail(db, who === 'parent' ? b.parent_email : b.tutor_email, m.subject, m.body);
    }
  }

  // Lesson day: each side by their own clock, skipped when the 30-minute letter is already due.
  for (const who of ['parent', 'tutor'] as const) {
    const col = who === 'parent' ? 'reminded_day_parent_at' : 'reminded_day_tutor_at';
    const tz = who === 'parent' ? `COALESCE(p.timezone, '${DEFAULT_TZ}')` : `COALESCE(tu.timezone, '${DEFAULT_TZ}')`;
    const day = await db.query(
      `${LESSONS} AND b.${col} IS NULL AND b.reminded_soon_at IS NULL
         AND b.slot_time > now() + interval '30 minutes'
         AND now() >= (((b.slot_time AT TIME ZONE ${tz})::date + time '${MORNING}') AT TIME ZONE ${tz})`,
    );
    for (const b of day.rows) {
      const claimed = await db.query(`UPDATE bookings SET ${col} = now() WHERE id = $1 AND ${col} IS NULL`, [b.id]);
      if (!claimed.rowCount) continue;
      const m = letter(b, who, false);
      await queueMail(db, who === 'parent' ? b.parent_email : b.tutor_email, m.subject, m.body);
    }
  }
}

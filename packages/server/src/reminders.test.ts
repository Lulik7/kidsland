import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { migrate } from './db/migrate';
import { createPool } from './db/pool';
import { sendLessonReminders } from './reminders';

const url = process.env.TEST_DATABASE_URL;
const db = url ? createPool(url) : null;
const app = db ? createApp(db) : null;

describe.skipIf(!url)('lesson reminders', () => {
  const stamp = Date.now();
  const parentEmail = `rem-parent-${stamp}@example.com`;
  const tutorEmail = `rem-tutor-${stamp}@example.com`;
  let childId = '';
  let tutorId = '';

  beforeAll(async () => {
    await migrate(db!);
    const reg = async (email: string, extra = {}) =>
      (await request(app!).post('/api/auth/register').send({ email, password: 'secret123', ...extra })).body.token;
    const parent = await reg(parentEmail);
    await reg(tutorEmail, { role: 'tutor', displayName: 'Напоминающий Наставник' });
    childId = (await request(app!).post('/api/children').set({ Authorization: `Bearer ${parent}` }).send({ nickname: 'Ника' })).body.child.id;
    tutorId = (await db!.query('SELECT t.id FROM tutor_profiles t JOIN users u ON u.id = t.user_id WHERE u.email = $1', [tutorEmail])).rows[0].id;
    // UTC clocks make "lesson day from 8:00" easy to reason about in the test.
    await db!.query("UPDATE users SET timezone = 'UTC' WHERE email = ANY($1)", [[parentEmail, tutorEmail]]);
  });
  afterAll(async () => {
    await db!.query('DELETE FROM email_outbox WHERE to_email = ANY($1)', [[parentEmail, tutorEmail]]);
    await db!.query('DELETE FROM users WHERE email = ANY($1)', [[parentEmail, tutorEmail]]);
    await db!.end();
  });

  const book = async (startsIn: string) => {
    const slot = (await db!.query(`INSERT INTO tutor_slots (tutor_id, starts_at) VALUES ($1, now() + $2::interval) RETURNING id, starts_at`, [tutorId, startsIn])).rows[0];
    const parentId = (await db!.query('SELECT id FROM users WHERE email = $1', [parentEmail])).rows[0].id;
    return (
      await db!.query(
        `INSERT INTO bookings (parent_id, child_id, tutor_id, slot_id, slot_time, meeting_link) VALUES ($1, $2, $3, $4, $5, 'x') RETURNING id`,
        [parentId, childId, tutorId, slot.id, slot.starts_at],
      )
    ).rows[0].id as string;
  };
  const letters = async () =>
    (await db!.query('SELECT to_email, subject FROM email_outbox WHERE to_email = ANY($1) ORDER BY id', [[parentEmail, tutorEmail]])).rows;

  it('sends the 30-minute reminder once to the parent and the tutor', async () => {
    await book('20 minutes');
    await sendLessonReminders(db!);
    await sendLessonReminders(db!);
    const sent = (await letters()).filter((l) => l.subject.includes('30 минут'));
    expect(sent.map((l) => l.to_email).sort()).toEqual([parentEmail, tutorEmail].sort());
  });

  it('sends the lesson-day reminder when the lesson is later today', async () => {
    const hour = new Date().getUTCHours();
    if (hour < 8 || hour > 21) return; // the "today" letter starts at 8:00 and needs room for a lesson later the same day
    await book('90 minutes');
    await sendLessonReminders(db!);
    const today = (await letters()).filter((l) => l.subject.includes('сегодня урок'));
    expect(today.map((l) => l.to_email).sort()).toEqual([parentEmail, tutorEmail].sort());
  });
});

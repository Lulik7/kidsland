import { findLesson } from '@kidsland/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { DEMO_ADMIN, migrate } from './db/migrate';
import { createPool } from './db/pool';

const url = process.env.TEST_DATABASE_URL;
const db = url ? createPool(url) : null;
const app = db ? createApp(db) : null;

describe.skipIf(!url)('courses, support, lesson room, tutor video', () => {
  const stamp = Date.now();
  const parentEmail = `ft-parent-${stamp}@example.com`;
  const tutorEmail = `ft-tutor-${stamp}@example.com`;
  let parent = '';
  let tutor = '';
  let admin = '';
  let childId = '';
  let bookingId = '';
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  const perfectAnswers = (lessonId: string) => {
    const { lesson } = findLesson(lessonId)!;
    return Object.fromEntries(
      [...lesson.practice, ...lesson.quiz].map((q) => [q.id, q.kind === 'order' ? q.items : q.kind === 'text' ? q.answer[0] : q.answer]),
    );
  };

  beforeAll(async () => {
    await migrate(db!, { demoAdmin: true });
    const reg = async (email: string, extra = {}) =>
      (await request(app!).post('/api/auth/register').send({ email, password: 'secret123', ...extra })).body.token;
    parent = await reg(parentEmail);
    tutor = await reg(tutorEmail, { role: 'tutor', displayName: 'Видео Наставник' });
    admin = (await request(app!).post('/api/auth/login').send(DEMO_ADMIN)).body.token;
    childId = (await request(app!).post('/api/children').set(auth(parent)).send({ nickname: 'Ника' })).body.child.id;

    await request(app!).put('/api/tutor/profile').set(auth(tutor)).send({
      displayName: 'Видео Наставник', headline: 'Scratch', bio: 'Учу детей.', videoUrl: '',
      subjects: ['scratch'], languages: ['ru'], ageMin: 6, ageMax: 12, hourlyRate: 1000, isPublished: true,
    });
    const at = new Date(Date.now() + 2 * 86_400_000);
    at.setUTCMinutes(0, 0, 0);
    await request(app!).post('/api/tutor/slots').set(auth(tutor)).send({ startsAt: [at.toISOString()] });
    const slots = await request(app!).get('/api/tutor/slots').set(auth(tutor));
    bookingId = (await request(app!).post('/api/bookings').set(auth(parent)).send({ slotId: slots.body.slots[0].id, childId })).body
      .booking.id;
  });
  afterAll(async () => {
    await db!.query('DELETE FROM users WHERE email = ANY($1)', [[parentEmail, tutorEmail]]);
    await db!.end();
  });

  it('grades lessons on the server, rewards the first pass once and keeps lessons in order', async () => {
    const locked = await request(app!).post(`/api/children/${childId}/lessons/scratch-2/submit`).set(auth(parent)).send({ answers: {} });
    expect(locked.status).toBe(403);

    const fail = await request(app!).post(`/api/children/${childId}/lessons/scratch-1/submit`).set(auth(parent)).send({ answers: {} });
    expect(fail.body).toMatchObject({ score: 0, passed: false, rewards: { xp: 0, coins: 0 } });

    const pass = await request(app!)
      .post(`/api/children/${childId}/lessons/scratch-1/submit`)
      .set(auth(parent))
      .send({ answers: perfectAnswers('scratch-1') });
    expect(pass.body).toMatchObject({ passed: true, rewards: { xp: 15, coins: 10 } });
    expect(pass.body.score).toBe(pass.body.max);

    const again = await request(app!)
      .post(`/api/children/${childId}/lessons/scratch-1/submit`)
      .set(auth(parent))
      .send({ answers: perfectAnswers('scratch-1') });
    expect(again.body.rewards).toEqual({ xp: 0, coins: 0 });

    const next = await request(app!).post(`/api/children/${childId}/lessons/scratch-2/submit`).set(auth(parent)).send({ answers: {} });
    expect(next.status).toBe(200);

    const courses = await request(app!).get(`/api/children/${childId}/courses`).set(auth(parent));
    expect(courses.body.progress).toHaveLength(2);
    expect(courses.body.courses.find((c: { courseId: string }) => c.courseId === 'scratch')).toMatchObject({ completed: 1, lessons: 4 });

    const report = await request(app!).get(`/api/children/${childId}/report`).set(auth(parent));
    expect(report.body.courses).toEqual([expect.objectContaining({ courseId: 'scratch', completed: 1 })]);
    expect(report.body.child.xp).toBe(15);
  });

  it('runs a support conversation between a user and the admin', async () => {
    expect((await request(app!).get('/api/support').set(auth(parent))).body.thread).toBeNull();
    const sent = await request(app!).post('/api/support/messages').set(auth(parent)).send({ body: 'Как отменить урок?' });
    expect(sent.status).toBe(201);
    expect(sent.body.messages.map((m: { isStaff: boolean }) => m.isStaff)).toEqual([false, true]);

    expect((await request(app!).get('/api/support/admin/threads').set(auth(parent))).status).toBe(403);
    const threads = await request(app!).get('/api/support/admin/threads').set(auth(admin));
    const thread = threads.body.threads.find((t: { user: { email: string } }) => t.user.email === parentEmail);
    expect(thread).toMatchObject({ staffUnread: true, lastMessage: expect.stringContaining('Здравствуйте') });

    const reply = await request(app!).post(`/api/support/admin/threads/${thread.id}/messages`).set(auth(admin)).send({ body: 'В кабинете, кнопка «Отменить».' });
    expect(reply.status).toBe(201);
    const mine = await request(app!).get('/api/support').set(auth(parent));
    expect(mine.body.messages.at(-1).body).toContain('Отменить');
    expect(mine.body.thread.userUnread).toBe(true);
  });

  it('shares chat and whiteboard in the lesson room and blocks personal data', async () => {
    const hello = await request(app!).post(`/api/bookings/${bookingId}/messages`).set(auth(tutor)).send({ body: 'Привет! Начинаем урок' });
    expect(hello.status).toBe(201);
    expect(hello.body.message.isTutor).toBe(true);

    const phone = await request(app!).post(`/api/bookings/${bookingId}/messages`).set(auth(tutor)).send({ body: 'Напиши свой номер телефона' });
    expect(phone.status).toBe(422);
    const photo = await request(app!).post(`/api/bookings/${bookingId}/messages`).set(auth(parent)).send({ body: 'вот моё фото' });
    expect(photo.status).toBe(422);

    const stroke = { color: '#ff6b3d', width: 4, points: [[0.1, 0.1], [0.5, 0.5]] };
    expect((await request(app!).post(`/api/bookings/${bookingId}/board`).set(auth(parent)).send({ stroke })).status).toBe(201);
    const room = await request(app!).get(`/api/bookings/${bookingId}/room`).set(auth(parent));
    expect(room.body.messages.map((m: { body: string }) => m.body)).toEqual(['Привет! Начинаем урок']);
    expect(room.body.board.strokes).toHaveLength(1);
    const same = await request(app!).get(`/api/bookings/${bookingId}/room?board=${room.body.board.version}`).set(auth(tutor));
    expect(same.body.board).toBeNull();
    expect(same.body.youAreTutor).toBe(true);

    const flags = await request(app!).get('/api/support/admin/safety-flags').set(auth(admin));
    expect(flags.body.flags.filter((f: { context: string }) => f.context === `lesson:${bookingId}`)).toHaveLength(2);
  });

  it('keeps contacts out of tutor profiles and accepts a video upload', async () => {
    const bad = await request(app!).put('/api/tutor/profile').set(auth(tutor)).send({
      displayName: 'Видео Наставник', headline: 'Scratch', bio: 'Пишите в телеграм', videoUrl: '',
      subjects: ['scratch'], languages: ['ru'], ageMin: 6, ageMax: 12, hourlyRate: 1000, isPublished: true,
    });
    expect(bad.status).toBe(400);

    const up = await request(app!).post('/api/tutor/video').set(auth(tutor)).set('Content-Type', 'video/mp4').send(Buffer.from('fake-mp4'));
    expect(up.status).toBe(201);
    expect(up.body.tutor.videoUrl).toMatch(/^\/api\/uploads\/videos\/.+\.mp4$/);
    const file = await request(app!).get(up.body.tutor.videoUrl);
    expect(file.status).toBe(200);
    const wrong = await request(app!).post('/api/tutor/video').set(auth(tutor)).set('Content-Type', 'text/plain').send('x');
    expect(wrong.status).toBe(400);
    const del = await request(app!).delete('/api/tutor/video').set(auth(tutor));
    expect(del.body.tutor.videoUrl).toBeNull();
    expect((await request(app!).get(up.body.tutor.videoUrl)).status).toBe(404);
  });
});

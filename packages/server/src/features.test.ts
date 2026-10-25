import { findLesson, homeworkFor } from '@kidsland/shared';
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
    await db!.query(
      "UPDATE tutor_profiles SET verification = 'approved' WHERE user_id = (SELECT id FROM users WHERE email = $1)",
      [tutorEmail],
    );

    await request(app!).put('/api/tutor/profile').set(auth(tutor)).send({
      displayName: 'Видео Наставник', headline: 'Scratch', bio: 'Учу детей.', videoUrl: '',
      subjects: ['scratch'], languages: ['ru'], ageMin: 6, ageMax: 12, hourlyRate: 1000, isPublished: true,
    });
    const at = new Date(Date.now() + 2 * 86_400_000);
    at.setUTCMinutes(0, 0, 0);
    await request(app!).post('/api/tutor/slots').set(auth(tutor)).send({ startsAt: [at.toISOString()] });
    const slots = await request(app!).get('/api/tutor/slots').set(auth(tutor));
    const { rows: tp } = await db!.query('SELECT t.id FROM tutor_profiles t JOIN users u ON u.id = t.user_id WHERE u.email = $1', [tutorEmail]);
    await request(app!).post('/api/billing/buy').set(auth(parent)).send({ plan: 'trial', tutorId: tp[0].id });
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

    // Reading the theory is enough to open the next lesson; tasks and the quiz are optional.
    const read = await request(app!).post(`/api/children/${childId}/lessons/scratch-2/complete`).set(auth(parent));
    expect(read.body.progress.completed).toBe(true);
    const quizOnly = await request(app!)
      .post(`/api/children/${childId}/lessons/scratch-3/submit`)
      .set(auth(parent))
      .send({ part: 'quiz', answers: perfectAnswers('scratch-3') });
    expect(quizOnly.body).toMatchObject({ max: 3, score: 3, passed: true, rewards: { xp: 15, coins: 10 } });
    const practiceToo = await request(app!)
      .post(`/api/children/${childId}/lessons/scratch-3/submit`)
      .set(auth(parent))
      .send({ part: 'practice', answers: perfectAnswers('scratch-3') });
    expect(practiceToo.body.rewards).toEqual({ xp: 0, coins: 0 });
    expect(practiceToo.body.progress).toMatchObject({ bestScore: 5, maxScore: 5 });

    const courses = await request(app!).get(`/api/children/${childId}/courses`).set(auth(parent));
    expect(courses.body.progress).toHaveLength(3);
    expect(courses.body.courses.find((c: { courseId: string }) => c.courseId === 'scratch')).toMatchObject({ completed: 3, lessons: 4 });

    const report = await request(app!).get(`/api/children/${childId}/report`).set(auth(parent));
    expect(report.body.courses).toEqual([expect.objectContaining({ courseId: 'scratch', completed: 3 })]);
    expect(report.body.child.xp).toBe(30);
  });

  it('gives homework after a read lesson and bonuses that buy a half-price lesson', async () => {
    const { course, index } = findLesson('scratch-2')!;
    const hw = homeworkFor(course, index);
    expect(hw.length).toBeGreaterThan(1);
    const right = Object.fromEntries(hw.map((q) => [q.id, q.kind === 'order' ? q.items : q.kind === 'text' ? q.answer[0] : q.answer]));
    const locked = await request(app!).post(`/api/children/${childId}/homework/scratch-4`).set(auth(parent)).send({ answers: right });
    expect(locked.status).toBe(403);
    const [firstId] = Object.keys(right);
    const once = await request(app!).post(`/api/children/${childId}/homework/scratch-2`).set(auth(parent)).send({ answers: { [firstId]: right[firstId] } });
    expect(once.body).toMatchObject({ score: 1, earned: 5, bonus: 5 });
    const all = await request(app!).post(`/api/children/${childId}/homework/scratch-2`).set(auth(parent)).send({ answers: right });
    expect(all.body.earned).toBe((hw.length - 1) * 5);
    const again = await request(app!).post(`/api/children/${childId}/homework/scratch-2`).set(auth(parent)).send({ answers: right });
    expect(again.body.earned).toBe(0);

    const tutorId = (await request(app!).get('/api/tutors')).body.tutors[0].id;
    expect((await request(app!).post('/api/billing/bonus').set(auth(parent)).send({ childId, tutorId })).status).toBe(400);
    await db!.query('UPDATE child_profiles SET bonus = 100 WHERE id = $1', [childId]);
    const before = (await request(app!).get('/api/billing').set(auth(parent))).body.lessonsLeft;
    const bought = await request(app!).post('/api/billing/bonus').set(auth(parent)).send({ childId, tutorId });
    expect(bought.status).toBe(201);
    expect(bought.body.lessonsLeft).toBe(before + 1);
    expect(bought.body.children[0].bonus).toBe(0);
  });

  it('sends "be an admin" posts to a real admin before showing them', async () => {
    expect((await request(app!).post('/api/posts').send({ authorName: 'Маша', title: 'Привет', body: 'Мой первый пост на сайте!' })).status).toBe(401);
    const blocked = await request(app!).post('/api/posts').set(auth(parent)).send({ authorName: 'Маша', title: 'Пишите мне', body: 'Мой номер +7 999 123-45-67, звоните' });
    expect(blocked.status).toBe(422);
    const created = await request(app!).post('/api/posts').set(auth(parent)).send({ authorName: 'Маша, 9 лет', title: 'Мой вулкан', body: "Сделала вулкан из соды и уксуса, было очень весело!" });
    expect(created.status).toBe(201);
    expect(created.body.post.status).toBe('pending');
    const isPublic = async () => (await request(app!).get('/api/posts')).body.posts.some((p: { id: string }) => p.id === created.body.post.id);
    expect(await isPublic()).toBe(false);
    expect((await request(app!).get('/api/posts/admin').set(auth(parent))).status).toBe(403);
    const queue = await request(app!).get('/api/posts/admin?status=pending').set(auth(admin));
    expect(queue.body.posts.some((p: { id: string }) => p.id === created.body.post.id)).toBe(true);
    const ok = await request(app!).post(`/api/posts/admin/${created.body.post.id}/review`).set(auth(admin)).send({ decision: 'approve' });
    expect(ok.body.post.status).toBe('approved');
    expect(await isPublic()).toBe(true);
    const mine = await request(app!).get('/api/posts/mine').set(auth(parent));
    expect(mine.body.posts[0].status).toBe('approved');
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

  it('sends a tutor application with documents to the admin and publishes after approval', async () => {
    const newbie = (
      await request(app!).post('/api/auth/register').send({
        email: `ft-new-${stamp}@example.com`, password: 'secret123', role: 'tutor', displayName: 'Новый Наставник',
      })
    ).body.token;
    const profile = {
      displayName: 'Новый Наставник', headline: 'Рисование для малышей', bio: 'Десять лет учу детей рисовать акварелью и гуашью.',
      videoUrl: '', subjects: ['scratch'], languages: ['ru'], ageMin: 5, ageMax: 10, hourlyRate: 900,
    };
    expect((await request(app!).put('/api/tutor/profile').set(auth(newbie)).send({ ...profile, isPublished: true })).status).toBe(400);
    expect((await request(app!).put('/api/tutor/profile').set(auth(newbie)).send({ ...profile, isPublished: false })).status).toBe(200);

    expect((await request(app!).post('/api/tutor/application/submit').set(auth(newbie))).status).toBe(400);
    const app1 = await request(app!).put('/api/tutor/application').set(auth(newbie)).send({
      education: [{ institution: 'Художественное училище', specialty: 'Живопись', yearFrom: 2008, yearTo: 2012 }],
      experience: [{ place: 'Детская студия', position: 'Педагог', yearFrom: 2013, yearTo: null }],
    });
    expect(app1.status).toBe(200);
    const doc = await request(app!)
      .post('/api/tutor/documents?kind=diploma&title=' + encodeURIComponent('Диплом училища'))
      .set(auth(newbie)).set('Content-Type', 'application/pdf').send(Buffer.from('%PDF-1.4 fake'));
    expect(doc.status).toBe(201);
    const noId = await request(app!).post('/api/tutor/application/submit').set(auth(newbie));
    expect(noId.status).toBe(400);
    expect(noId.body.error).toMatch(/паспорт/);
    const id = await request(app!)
      .post('/api/tutor/documents?kind=identity&title=' + encodeURIComponent('Паспорт'))
      .set(auth(newbie)).set('Content-Type', 'image/png').send(Buffer.from('fake png'));
    expect(id.status).toBe(201);
    const sent = await request(app!).post('/api/tutor/application/submit').set(auth(newbie));
    expect(sent.status).toBe(200);
    expect(sent.body.application.status).toBe('pending');

    const notes = await request(app!).get('/api/admin/notifications').set(auth(admin));
    expect(notes.body.notifications.some((n: { kind: string }) => n.kind === 'tutor-application')).toBe(true);
    expect((await request(app!).get('/api/admin/notifications').set(auth(parent))).status).toBe(403);

    const list = await request(app!).get('/api/admin/tutor-applications?status=pending').set(auth(admin));
    const mine = list.body.applications.find((a: { tutor: { displayName: string } }) => a.tutor.displayName === 'Новый Наставник');
    expect(mine.application.education).toHaveLength(1);
    expect(mine.documents).toHaveLength(2);
    const file = await request(app!).get(`/api/admin/tutor-applications/${mine.tutor.id}/documents/${mine.documents.find((d: { kind: string }) => d.kind === 'diploma').id}`).set(auth(admin));
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toMatch(/pdf/);
    expect((await request(app!).get(`/api/admin/tutor-applications/${mine.tutor.id}/documents/${mine.documents[0].id}`).set(auth(parent))).status).toBe(403);

    const ok = await request(app!).post(`/api/admin/tutor-applications/${mine.tutor.id}/review`).set(auth(admin)).send({ decision: 'approve' });
    expect(ok.body.application.status).toBe('approved');
    expect(ok.body.tutor.isPublished).toBe(true);
  });

  it('lets the admin add topics, articles and edit lesson texts', async () => {
    const topic = await request(app!).post('/api/admin/content/topics').set(auth(admin)).send({ section: 'art', name: `Лепка ${stamp}` });
    expect(topic.status).toBe(201);
    const t = topic.body.topics.find((x: { name: string }) => x.name === `Лепка ${stamp}`);
    const art = await request(app!).post('/api/admin/content/articles').set(auth(admin)).send({
      section: 'art', topic: t.id, title: 'Пластилиновый ёжик', summary: 'Лепим ёжика', minutes: 3,
      sections: [{ title: 'Начало', text: 'Скатай шарик.' }],
    });
    expect(art.status).toBe(201);
    const pub = await request(app!).get('/api/content');
    expect(pub.body.articles.some((a: { id: string }) => a.id === art.body.id)).toBe(true);

    const lesson = await request(app!).put('/api/admin/content/lessons/computer-1').set(auth(admin)).send({
      title: 'Новый первый урок', sections: [{ title: '', text: 'Новый текст урока.' }],
    });
    expect(lesson.status).toBe(200);
    expect(findLesson('computer-1')!.lesson.title).toBe('Новый первый урок');
    await request(app!).delete('/api/admin/content/lessons/computer-1').set(auth(admin));
    expect(findLesson('computer-1')!.lesson.title).not.toBe('Новый первый урок');
    await request(app!).delete(`/api/admin/content/topics/${t.id}`).set(auth(admin));
  });
});

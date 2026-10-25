import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { migrate } from './db/migrate';
import { createPool } from './db/pool';

const url = process.env.TEST_DATABASE_URL;
const db = url ? createPool(url) : null;
const app = db ? createApp(db) : null;

describe.skipIf(!url)('marketplace', () => {
  const stamp = Date.now();
  const parentEmail = `mp-parent-${stamp}@example.com`;
  const otherEmail = `mp-other-${stamp}@example.com`;
  const tutorEmail = `mp-tutor-${stamp}@example.com`;
  let parent = '';
  let other = '';
  let tutor = '';
  let childId = '';
  let otherChildId = '';
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    await migrate(db!);
    const reg = async (email: string, extra = {}) =>
      (await request(app!).post('/api/auth/register').send({ email, password: 'secret123', ...extra })).body.token;
    parent = await reg(parentEmail);
    other = await reg(otherEmail);
    tutor = await reg(tutorEmail, { role: 'tutor', displayName: 'Тест Наставник' });
    childId = (await request(app!).post('/api/children').set(auth(parent)).send({ nickname: 'Лиза' })).body.child.id;
    await db!.query(
      "UPDATE tutor_profiles SET verification = 'approved' WHERE user_id = (SELECT id FROM users WHERE email = $1)",
      [tutorEmail],
    );
    otherChildId = (await request(app!).post('/api/children').set(auth(other)).send({ nickname: 'Петя' })).body.child.id;
  });
  afterAll(async () => {
    await db!.query('DELETE FROM users WHERE email = ANY($1)', [[parentEmail, otherEmail, tutorEmail]]);
    await db!.end();
  });

  it('lists published demo tutors with filters', async () => {
    const all = await request(app!).get('/api/tutors');
    expect(all.body.tutors.length).toBeGreaterThanOrEqual(6);
    expect(all.body.tutors.every((t: { isPublished: boolean }) => t.isPublished)).toBe(true);

    const py = await request(app!).get('/api/tutors?subject=python&age=13');
    expect(py.body.tutors.length).toBeGreaterThan(0);
    for (const t of py.body.tutors) {
      expect(t.subjects).toContain('python');
      expect(t.ageMin).toBeLessThanOrEqual(13);
      expect(t.ageMax).toBeGreaterThanOrEqual(13);
    }
    expect((await request(app!).get('/api/tutors?subject=skydiving')).status).toBe(400);
    const music = await request(app!).get('/api/tutors?section=music');
    expect(music.body.tutors.length).toBeGreaterThan(0);
    for (const t of music.body.tutors) expect(t.subjects.some((s: string) => ['guitar', 'piano', 'violin', 'drums', 'flute', 'saxophone', 'ukulele', 'accordion', 'cello', 'vocal'].includes(s))).toBe(true);
    const guitar = await request(app!).get('/api/tutors?subject=guitar');
    expect(guitar.body.tutors.map((t: { displayName: string }) => t.displayName)).toContain('София Белова');
  });

  it('hides unpublished tutors until they publish', async () => {
    const all = await request(app!).get('/api/tutors');
    expect(all.body.tutors.some((t: { displayName: string }) => t.displayName === 'Тест Наставник')).toBe(false);
  });

  it('books a free trial, then a paid lesson, and blocks double booking', async () => {
    const list = await request(app!).get('/api/tutors?sort=soonest');
    const tutorId = list.body.tutors[0].id;
    const detail = await request(app!).get(`/api/tutors/${tutorId}`);
    const [s1, s2] = detail.body.slots;
    expect(s1).toBeDefined();

    const first = await request(app!).post('/api/bookings').set(auth(parent)).send({ slotId: s1.id, childId });
    expect(first.status).toBe(201);
    expect(first.body.booking.isTrial).toBe(true);
    expect(first.body.booking.price).toBe(0);
    expect(first.body.booking.meetingLink).toMatch(/^https:\/\/.+\/kidsland-/);

    const clash = await request(app!).post('/api/bookings').set(auth(other)).send({ slotId: s1.id, childId: otherChildId });
    expect(clash.status).toBe(409);

    const second = await request(app!).post('/api/bookings').set(auth(parent)).send({ slotId: s2.id, childId });
    expect(second.body.booking.isTrial).toBe(false);
    expect(second.body.booking.price).toBeGreaterThan(0);

    const after = await request(app!).get(`/api/tutors/${tutorId}`);
    expect(after.body.slots.map((s: { id: string }) => s.id)).not.toContain(s1.id);

    const mine = await request(app!).get('/api/bookings').set(auth(parent));
    expect(mine.body.bookings).toHaveLength(2);

    // Someone else cannot open or cancel the lesson.
    expect((await request(app!).get(`/api/bookings/${first.body.booking.id}`).set(auth(other))).status).toBe(404);
    expect((await request(app!).post(`/api/bookings/${first.body.booking.id}/cancel`).set(auth(other))).status).toBe(400);

    const blocked = await request(app!)
      .post(`/api/bookings/${second.body.booking.id}/cancel`)
      .set(auth(parent))
      .send({ reason: 'sick', note: 'Позвоните мне 8 900 123 45 67' });
    expect(blocked.status).toBe(422);
    const cancel = await request(app!)
      .post(`/api/bookings/${second.body.booking.id}/cancel`)
      .set(auth(parent))
      .send({ reason: 'sick', note: 'Давайте перенесём на четверг' });
    expect(cancel.body.booking.status).toBe('cancelled');
    expect(cancel.body.booking.cancellation).toEqual({ by: 'parent', reason: 'sick', label: 'Ребёнок заболел', note: 'Давайте перенесём на четверг' });
    const freed = await request(app!).get(`/api/tutors/${tutorId}`);
    expect(freed.body.slots.map((s: { id: string }) => s.id)).toContain(s2.id);
  });

  it("will not book another family's child", async () => {
    const list = await request(app!).get('/api/tutors');
    let slotId = '';
    for (const t of list.body.tutors as { id: string }[]) {
      const detail = await request(app!).get(`/api/tutors/${t.id}`);
      if (detail.body.slots.length) { slotId = detail.body.slots[0].id; break; }
    }
    expect(slotId).not.toBe('');
    const res = await request(app!).post('/api/bookings').set(auth(parent)).send({ slotId, childId: otherChildId });
    expect(res.status).toBe(404);
  });

  it('lets a tutor edit the profile, publish and manage slots', async () => {
    expect((await request(app!).get('/api/tutor/profile').set(auth(parent))).status).toBe(403);
    const profile = await request(app!).put('/api/tutor/profile').set(auth(tutor)).send({
      displayName: 'Тест Наставник',
      headline: 'Python для подростков',
      bio: 'Учу программировать.',
      videoUrl: '',
      subjects: ['python'],
      languages: ['ru'],
      ageMin: 10,
      ageMax: 14,
      hourlyRate: 2000,
      isPublished: true,
    });
    expect(profile.status).toBe(200);
    expect(profile.body.tutor.isPublished).toBe(true);

    const tomorrow = new Date(Date.now() + 86_400_000);
    tomorrow.setUTCMinutes(0, 0, 0);
    const add = await request(app!).post('/api/tutor/slots').set(auth(tutor)).send({ startsAt: [tomorrow.toISOString()] });
    expect(add.body.added).toBe(1);
    const past = await request(app!).post('/api/tutor/slots').set(auth(tutor)).send({ startsAt: ['2020-01-01T10:00:00Z'] });
    expect(past.status).toBe(400);

    const slots = await request(app!).get('/api/tutor/slots').set(auth(tutor));
    expect(slots.body.slots).toHaveLength(1);
    const listed = await request(app!).get('/api/tutors?subject=python&age=12');
    const me = listed.body.tutors.find((t: { displayName: string }) => t.displayName === 'Тест Наставник');
    expect(me.freeSlots).toBe(1);

    // Booked slots cannot be deleted; the tutor sees the booking.
    const booking = await request(app!).post('/api/bookings').set(auth(other)).send({ slotId: slots.body.slots[0].id, childId: otherChildId });
    expect(booking.status).toBe(201);
    expect((await request(app!).delete(`/api/tutor/slots/${slots.body.slots[0].id}`).set(auth(tutor))).status).toBe(400);
    const lessons = await request(app!).get('/api/bookings').set(auth(tutor));
    expect(lessons.body.bookings[0].child.nickname).toBe('Петя');
  });

  it('reports child progress for the parent dashboard', async () => {
    const res = await request(app!).get(`/api/children/${childId}/report`).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.totals.completed).toBe(0);
    expect(res.body.baseCourseCompleted).toBe(false);
    expect(Object.keys(res.body.concepts)).toEqual(expect.arrayContaining(['sequence', 'loops', 'conditions']));
  });
});

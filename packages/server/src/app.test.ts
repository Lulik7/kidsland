import { LEVELS } from '@kidsland/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { migrate } from './db/migrate';
import { createPool } from './db/pool';

// Integration tests need a real database: TEST_DATABASE_URL, e.g. the docker-compose Postgres.
const url = process.env.TEST_DATABASE_URL;
const db = url ? createPool(url) : null;
const app = db ? createApp(db) : null;

describe.skipIf(!url)('API', () => {
  let token = '';
  let childId = '';
  const email = `parent-${Date.now()}@example.com`;

  beforeAll(async () => {
    await migrate(db!);
    await migrate(db!); // idempotent
  });
  afterAll(async () => {
    await db!.query('DELETE FROM users WHERE email = $1', [email]);
    await db!.end();
  });

  it('registers and logs in', async () => {
    const reg = await request(app!).post('/api/auth/register').send({ email, password: 'secret123' });
    expect(reg.status).toBe(201);
    expect(reg.body.user.role).toBe('parent');

    const dup = await request(app!).post('/api/auth/register').send({ email, password: 'secret123' });
    expect(dup.status).toBe(409);

    const bad = await request(app!).post('/api/auth/login').send({ email, password: 'wrong-pass' });
    expect(bad.status).toBe(401);

    const login = await request(app!).post('/api/auth/login').send({ email, password: 'secret123' });
    expect(login.status).toBe(200);
    token = login.body.token;

    const me = await request(app!).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.user.email).toBe(email);
  });

  it('rejects requests without a token', async () => {
    expect((await request(app!).get('/api/children')).status).toBe(401);
  });

  it('creates a child and lists locked levels', async () => {
    const res = await request(app!)
      .post('/api/children')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'Маша' });
    expect(res.status).toBe(201);
    childId = res.body.child.id;

    const levels = await request(app!).get(`/api/children/${childId}/levels`).set('Authorization', `Bearer ${token}`);
    expect(levels.body.levels).toHaveLength(LEVELS.length);
    expect(levels.body.levels[0].unlocked).toBe(true);
    expect(levels.body.levels[1].unlocked).toBe(false);
    expect(levels.body.levels[0].config).toBeUndefined();
  });

  it('blocks a level until the previous one is done', async () => {
    const res = await request(app!)
      .get(`/api/children/${childId}/levels/${LEVELS[1].slug}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('scores a failed attempt with no rewards', async () => {
    const res = await request(app!)
      .post(`/api/children/${childId}/attempts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ levelSlug: LEVELS[0].slug, program: [{ type: 'move' }] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.rewards).toEqual({ xp: 0, coins: 0 });
  });

  it('awards XP once for a solved level and unlocks the next', async () => {
    const send = () =>
      request(app!)
        .post(`/api/children/${childId}/attempts`)
        .set('Authorization', `Bearer ${token}`)
        .send({ levelSlug: LEVELS[0].slug, program: LEVELS[0].solution });
    const first = await send();
    expect(first.body.success).toBe(true);
    expect(first.body.stars).toBe(3);
    expect(first.body.rewards.xp).toBe(LEVELS[0].xpReward);

    const again = await send();
    expect(again.body.rewards).toEqual({ xp: 0, coins: 0 });
    expect(again.body.child.xp).toBe(LEVELS[0].xpReward);

    const next = await request(app!)
      .get(`/api/children/${childId}/levels/${LEVELS[1].slug}`)
      .set('Authorization', `Bearer ${token}`);
    expect(next.status).toBe(200);
    expect(next.body.level.config.width).toBeGreaterThan(0);

    const kids = await request(app!).get('/api/children').set('Authorization', `Bearer ${token}`);
    expect(kids.body.children[0].completedLevels).toEqual([LEVELS[0].slug]);
  });

  it('rejects malformed programs', async () => {
    const res = await request(app!)
      .post(`/api/children/${childId}/attempts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ levelSlug: LEVELS[0].slug, program: [{ type: 'teleport' }] });
    expect(res.status).toBe(400);
  });

  it('paywalls premium levels', async () => {
    const premium = LEVELS.find((l) => l.isPremium)!;
    const res = await request(app!)
      .get(`/api/children/${childId}/levels/${premium.slug}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(402);
  });

  it("hides other parents' children", async () => {
    const other = await request(app!)
      .post('/api/auth/register')
      .send({ email: `other-${email}`, password: 'secret123' });
    const res = await request(app!)
      .get(`/api/children/${childId}/levels`)
      .set('Authorization', `Bearer ${other.body.token}`);
    expect(res.status).toBe(404);
    await db!.query('DELETE FROM users WHERE email = $1', [`other-${email}`]);
  });
});

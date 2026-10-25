import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { migrate } from './db/migrate';
import { createPool } from './db/pool';
import { cleanPhone } from './sms';

const url = process.env.TEST_DATABASE_URL;
const db = url ? createPool(url) : null;
const app = db ? createApp(db) : null;

describe.skipIf(!url)('reminder channels and admin pages', () => {
  const email = `notify-${Date.now()}@example.com`;
  let token = '';
  let admin = '';

  beforeAll(async () => {
    await migrate(db!);
    token = (await request(app!).post('/api/auth/register').send({ email, password: 'secret123', phone: '+972 50 123 4567' })).body.token;
    admin = (await request(app!).post('/api/auth/login').send({ email: 'admin@kidsland.local', password: 'admin12345' })).body.token;
  });
  afterAll(async () => {
    await db!.query('DELETE FROM users WHERE email = $1', [email]);
    await db!.end();
  });

  it('keeps the phone from sign-up and lets the user change it', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    expect((await request(app!).get('/api/auth/me').set(auth)).body.user.phone).toBe('+972 50 123 4567');
    const r = await request(app!).patch('/api/auth/me').set(auth).send({ phone: '+7 (999) 111-22-33' });
    expect(r.body.user.phone).toBe('+7 (999) 111-22-33');
    expect((await request(app!).patch('/api/auth/me').set(auth).send({ phone: 'call me' })).status).toBe(400);
    expect(cleanPhone('+7 (999) 111-22-33')).toBe('+79991112233');
  });

  it('gives a push key and stores a device subscription', async () => {
    const key = await request(app!).get('/api/push/key');
    expect(key.body.publicKey.length).toBeGreaterThan(40);
    const sub = { endpoint: `https://push.example.com/${Date.now()}`, keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' } };
    expect((await request(app!).post('/api/push/subscribe').set({ Authorization: `Bearer ${token}` }).send(sub)).status).toBe(201);
    const { rows } = await db!.query('SELECT u.email FROM push_subscriptions s JOIN users u ON u.id = s.user_id WHERE s.endpoint = $1', [sub.endpoint]);
    expect(rows[0].email).toBe(email);
  });

  it('shows letters and payments to the admin only', async () => {
    expect((await request(app!).get('/api/admin/mail').set({ Authorization: `Bearer ${token}` })).status).toBe(403);
    const mail = await request(app!).get('/api/admin/mail').set({ Authorization: `Bearer ${admin}` });
    expect(mail.status).toBe(200);
    expect(Array.isArray(mail.body.letters)).toBe(true);
    const pay = await request(app!).get('/api/admin/payments').set({ Authorization: `Bearer ${admin}` });
    expect(pay.status).toBe(200);
    expect(typeof pay.body.month).toBe('number');
  });
});

import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { migrate } from './db/migrate';
import { createPool } from './db/pool';
import { queueMail } from './mail';

const url = process.env.TEST_DATABASE_URL;
const db = url ? createPool(url) : null;

describe.skipIf(!url)('mail outbox', () => {
  afterAll(async () => {
    await db!.end();
  });

  it('never queues letters for admins', async () => {
    await migrate(db!);
    const stamp = Date.now();
    const admin = `mail-admin-${stamp}@example.com`;
    const parent = `mail-parent-${stamp}@example.com`;
    await request(createApp(db!)).post('/api/auth/register').send({ email: admin, password: 'secret123' });
    await db!.query("UPDATE users SET role = 'admin' WHERE email = $1", [admin]);
    await queueMail(db!, [admin, parent], 'Kidsland: сегодня урок', 'Напоминаем: сегодня урок.');
    const { rows } = await db!.query('SELECT to_email FROM email_outbox WHERE to_email = ANY($1)', [[admin, parent]]);
    expect(rows.map((r) => r.to_email)).toEqual([parent]);
  });
});

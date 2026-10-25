import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db/pool';
import { sendPush, vapidKeys } from '../push';

const subSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

/** Browser notifications: the public key, and turning them on or off on this device. */
export function pushRouter(db: Db) {
  const r = Router();

  r.get('/key', async (_req, res) => {
    res.json({ publicKey: (await vapidKeys(db)).publicKey });
  });

  r.post('/subscribe', requireAuth, async (req, res) => {
    const s = subSchema.parse(req.body);
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [req.user!.id, s.endpoint, s.keys.p256dh, s.keys.auth],
    );
    res.status(201).json({ ok: true });
  });

  r.post('/unsubscribe', requireAuth, async (req, res) => {
    const { endpoint } = z.object({ endpoint: z.string().max(1000) }).parse(req.body);
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2', [endpoint, req.user!.id]);
    res.json({ ok: true });
  });

  // A test notification, so people can see that it works on their device.
  r.post('/test', requireAuth, async (req, res) => {
    const sent = await sendPush(db, req.user!.id, { title: 'Kidsland', body: 'Уведомления включены: напомним о каждом уроке.', url: '/' });
    res.json({ sent });
  });

  return r;
}

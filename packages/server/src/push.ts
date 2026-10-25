import webpush from 'web-push';
import { config } from './config';
import type { Db } from './db/pool';

let keys: { publicKey: string; privateKey: string } | undefined;

/** The Web Push key pair: from VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY, or made once and kept in the database. */
export async function vapidKeys(db: Db) {
  if (keys) return keys;
  if (config.vapidPublicKey && config.vapidPrivateKey) {
    keys = { publicKey: config.vapidPublicKey, privateKey: config.vapidPrivateKey };
  } else {
    const fresh = webpush.generateVAPIDKeys();
    await db.query("INSERT INTO app_settings (key, value) VALUES ('vapid', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(fresh)]);
    const { rows } = await db.query("SELECT value FROM app_settings WHERE key = 'vapid'");
    keys = JSON.parse(rows[0].value);
  }
  return keys!;
}

/** Shows a notification on every device where the user turned notifications on. Gone devices are forgotten. */
export async function sendPush(db: Db, userId: string, msg: { title: string; body: string; url?: string }) {
  const { rows } = await db.query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1', [userId]);
  if (!rows.length) return 0;
  const k = await vapidKeys(db);
  let sent = 0;
  for (const s of rows) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg), {
        vapidDetails: { subject: `mailto:${config.notifyEmails[0] ?? 'admin@kidsland.local'}`, publicKey: k.publicKey, privateKey: k.privateKey },
        TTL: 60 * 60,
      });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.query('DELETE FROM push_subscriptions WHERE id = $1', [s.id]);
      else console.warn('push failed', code ?? e);
    }
  }
  return sent;
}

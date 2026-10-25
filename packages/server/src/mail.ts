import nodemailer, { type Transporter } from 'nodemailer';
import type { PoolClient } from 'pg';
import { config } from './config';
import type { Db } from './db/pool';

type Q = Db | PoolClient;

/** Puts a letter in the outbox; it is sent by deliverMail, so a mail problem never fails a payment. */
export async function queueMail(db: Q, to: string | string[], subject: string, body: string) {
  for (const addr of [to].flat()) {
    await db.query('INSERT INTO email_outbox (to_email, subject, body) VALUES ($1, $2, $3)', [addr, subject, body]);
  }
}

let transport: Transporter | null | undefined;
const getTransport = () => (transport === undefined ? (transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : null) : transport);

/** Sends waiting letters. Without SMTP_URL they stay in the outbox (the admin sees them) until mail is set up. */
export async function deliverMail(db: Db) {
  const t = getTransport();
  if (!t) return;
  const { rows } = await db.query("SELECT * FROM email_outbox WHERE status = 'pending' ORDER BY created_at LIMIT 20");
  for (const m of rows) {
    try {
      await t.sendMail({ from: config.mailFrom, to: m.to_email, subject: m.subject, text: m.body });
      await db.query("UPDATE email_outbox SET status = 'sent', sent_at = now() WHERE id = $1", [m.id]);
    } catch (e) {
      await db.query("UPDATE email_outbox SET status = 'failed', error = $2 WHERE id = $1", [m.id, String(e).slice(0, 500)]);
    }
  }
}

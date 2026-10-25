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

/**
 * Reads SMTP_URL by hand, so a login written as a plain address (user@gmail.com, not user%40gmail.com)
 * or a password with spaces still works. SMTP_USER / SMTP_PASS override the parts of the URL.
 */
export function smtpSettings() {
  const url = config.smtpUrl;
  if (!url) return null;
  const m = /^(smtps?):\/\/(?:(.*)@)?([^@:/]+)(?::(\d+))?\/?$/.exec(url);
  if (!m) return { url, user: process.env.SMTP_USER ?? '', pass: process.env.SMTP_PASS ?? '', host: '', port: 0, secure: false };
  const [, scheme, auth = '', host, port] = m;
  const cut = auth.indexOf(':');
  const dec = (v: string) => {
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const user = process.env.SMTP_USER?.trim() || dec(cut < 0 ? auth : auth.slice(0, cut));
  const pass = (process.env.SMTP_PASS ?? dec(cut < 0 ? '' : auth.slice(cut + 1))).replace(/\s+/g, '');
  const secure = scheme === 'smtps';
  return { url: '', user, pass, host, port: port ? Number(port) : secure ? 465 : 587, secure };
}

let transport: Transporter | null | undefined;
const getTransport = () => {
  if (transport !== undefined) return transport;
  const s = smtpSettings();
  if (!s) return (transport = null);
  if (s.url) return (transport = nodemailer.createTransport(s.url));
  return (transport = nodemailer.createTransport({ host: s.host, port: s.port, secure: s.secure, auth: s.user ? { user: s.user, pass: s.pass } : undefined }));
};

/** Letters go out from the mail box itself unless MAIL_FROM says otherwise (Gmail rewrites a foreign sender anyway). */
const mailFrom = () => process.env.MAIL_FROM || (smtpSettings()?.user.includes('@') ? `Kidsland <${smtpSettings()!.user}>` : config.mailFrom);

/** Sends waiting letters. Without SMTP_URL they stay in the outbox (the admin sees them) until mail is set up. */
export async function deliverMail(db: Db) {
  const t = getTransport();
  if (!t) return;
  const { rows } = await db.query("SELECT * FROM email_outbox WHERE status = 'pending' ORDER BY created_at LIMIT 20");
  for (const m of rows) {
    try {
      await t.sendMail({ from: mailFrom(), to: m.to_email, subject: m.subject, text: m.body });
      await db.query("UPDATE email_outbox SET status = 'sent', sent_at = now() WHERE id = $1", [m.id]);
    } catch (e) {
      await db.query("UPDATE email_outbox SET status = 'failed', error = $2 WHERE id = $1", [m.id, String(e).slice(0, 500)]);
    }
  }
}

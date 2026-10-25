import './envFiles';
import { fileURLToPath } from 'node:url';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL', 'postgres://kidsland:kidsland@localhost:5433/kidsland'),
  // In production a real secret is mandatory; locally a dev default keeps setup simple.
  jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-only-secret'),
  jwtExpiresIn: '7d' as const,
  // Video lessons run on Jitsi Meet; point this at a self-hosted Jitsi or 8x8 JaaS domain in production.
  jitsiDomain: process.env.JITSI_DOMAIN ?? 'meet.jit.si',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // Users with these emails become admins on sign-up or login (comma-separated).
  adminEmails: (process.env.ADMIN_EMAILS ?? (isProd ? '' : 'admin@kidsland.local'))
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  // Demo admin account with a known password, never in production.
  seedDemoAdmin: !isProd && process.env.SEED_DEMO_ADMIN !== 'false',
  // Sample tutors for showing the site; DEMO_TUTORS=false keeps them out of a new database.
  seedDemoTutors: process.env.DEMO_TUTORS !== 'false',
  uploadsDir: process.env.UPLOADS_DIR ?? fileURLToPath(new URL('../uploads', import.meta.url)),
  // Built client (npm run build) served by this server in production; empty locally, where Vite serves it.
  clientDir: process.env.CLIENT_DIR ?? (isProd ? fileURLToPath(new URL('../../client/dist', import.meta.url)) : ''),
  maxVideoMb: Number(process.env.MAX_VIDEO_MB ?? 100),
  // Tutors' diplomas and certificates. Private: never served statically, only to the tutor and admins.
  documentsDir: process.env.DOCUMENTS_DIR ?? fileURLToPath(new URL('../private-documents', import.meta.url)),
  maxDocumentMb: 10,
  // Address of the site, for links in emails.
  appUrl: process.env.APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // Outgoing mail, like smtps://user:app-password@smtp.gmail.com:465. Without it letters wait in the outbox.
  smtpUrl: process.env.SMTP_URL ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'Kidsland <no-reply@kidsland.local>',
  // Browser notifications. Without these keys the server makes its own pair once and keeps it in the database.
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? '',
  // Text messages through Twilio (optional): account SID, auth token and the sender number.
  twilio: { sid: process.env.TWILIO_ACCOUNT_SID ?? '', token: process.env.TWILIO_AUTH_TOKEN ?? '', from: process.env.TWILIO_FROM ?? '' },
  // Who gets a copy of every payment confirmation (comma-separated).
  notifyEmails: (process.env.ADMIN_NOTIFY_EMAILS ?? 'yuliaberner.dev@gmail.com')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean),
};

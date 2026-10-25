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
  uploadsDir: process.env.UPLOADS_DIR ?? fileURLToPath(new URL('../uploads', import.meta.url)),
  maxVideoMb: Number(process.env.MAX_VIDEO_MB ?? 100),
  // Tutors' diplomas and certificates. Private: never served statically, only to the tutor and admins.
  documentsDir: process.env.DOCUMENTS_DIR ?? fileURLToPath(new URL('../private-documents', import.meta.url)),
  maxDocumentMb: 10,
};

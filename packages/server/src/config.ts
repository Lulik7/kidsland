function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL', 'postgres://kidsland:kidsland@localhost:5432/kidsland'),
  // In production a real secret is mandatory; locally a dev default keeps setup simple.
  jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-only-secret'),
  jwtExpiresIn: '7d' as const,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};

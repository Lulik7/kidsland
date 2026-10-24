import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, signToken } from '../auth';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов').max(100),
  phone: z.string().trim().max(32).optional(),
  role: z.enum(['parent', 'tutor']).default('parent'),
  displayName: z.string().trim().min(2).max(60).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

interface UserRow {
  id: string;
  email: string;
  role: 'parent' | 'tutor' | 'admin';
  phone: string | null;
  is_premium: boolean;
  created_at: Date;
  password_hash: string;
}

const publicUser = (u: UserRow) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  phone: u.phone,
  isPremium: u.is_premium,
  createdAt: u.created_at,
});

export function authRouter(db: Db) {
  const r = Router();

  // Parents and tutors can sign up themselves; admins are provisioned directly in the database.
  r.post('/register', async (req, res) => {
    const body = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(body.password, 10);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<UserRow>(
        `INSERT INTO users (email, password_hash, phone, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING RETURNING *`,
        [body.email, hash, body.phone ?? null, body.role],
      );
      if (!rows[0]) throw new HttpError(409, 'Этот email уже зарегистрирован');
      if (body.role === 'tutor') {
        // Tutors start with an unpublished profile and appear in the catalogue once they publish it.
        await client.query('INSERT INTO tutor_profiles (user_id, display_name) VALUES ($1, $2)', [
          rows[0].id,
          body.displayName ?? body.email.split('@')[0],
        ]);
      }
      await client.query('COMMIT');
      res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });

  r.post('/login', async (req, res) => {
    const body = loginSchema.parse(req.body);
    const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE email = $1', [body.email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
      throw new HttpError(401, 'Неверный email или пароль');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  r.get('/me', requireAuth, async (req, res) => {
    const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [req.user!.id]);
    if (!rows[0]) throw new HttpError(401, 'Пользователь не найден');
    res.json({ user: publicUser(rows[0]) });
  });

  return r;
}

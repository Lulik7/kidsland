import { findUnsafeContent } from '@kidsland/shared';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { notifyAdmins } from '../notify';
import { isUuid } from '../tutors';
import { flagUnsafe } from './lessonRoom';

const postSchema = z.object({
  authorName: z.string().trim().min(2, 'Как подписать пост?').max(40),
  title: z.string().trim().min(3, 'Придумайте заголовок').max(100),
  body: z.string().trim().min(10, 'Напишите хотя бы пару предложений').max(3000),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicPost = (p: any, withReview = false) => ({
  id: p.id,
  authorName: p.author_name,
  title: p.title,
  body: p.body,
  createdAt: p.created_at,
  ...(withReview ? { status: p.status, reviewNote: p.review_note, reviewedAt: p.reviewed_at } : {}),
  ...(p.email !== undefined ? { author: { id: p.author_id, email: p.email, role: p.role } } : {}),
});

/** "Be an admin": users suggest posts, a real admin approves them before anyone else sees them. */
export function postsRouter(db: Db) {
  const r = Router();

  r.get('/', async (_req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM community_posts WHERE status = 'approved' ORDER BY reviewed_at DESC NULLS LAST, created_at DESC LIMIT 50`,
    );
    res.json({ posts: rows.map((p) => publicPost(p)) });
  });

  r.get('/mine', requireAuth, async (req, res) => {
    const { rows } = await db.query('SELECT * FROM community_posts WHERE author_id = $1 ORDER BY created_at DESC LIMIT 50', [
      req.user!.id,
    ]);
    res.json({ posts: rows.map((p) => publicPost(p, true)) });
  });

  r.post('/', requireAuth, async (req, res) => {
    const post = postSchema.parse(req.body);
    const text = `${post.authorName}\n${post.title}\n${post.body}`;
    const unsafe = findUnsafeContent(text);
    if (unsafe) {
      await flagUnsafe(db, req.user!.id, 'post', text, unsafe);
      throw new HttpError(422, `${unsafe}. Пост не отправлен, модератор получил уведомление.`);
    }
    const { rows: pending } = await db.query(
      "SELECT count(*)::int AS n FROM community_posts WHERE author_id = $1 AND status = 'pending'",
      [req.user!.id],
    );
    if (pending[0].n >= 5) throw new HttpError(429, 'У вас уже 5 постов на проверке. Дождитесь ответа администратора.');
    const { rows } = await db.query(
      'INSERT INTO community_posts (author_id, author_name, title, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user!.id, post.authorName, post.title, post.body],
    );
    await notifyAdmins(db, 'post', `Новый пост на проверку: ${post.title}`, post.body, 'posts');
    res.status(201).json({ post: publicPost(rows[0], true) });
  });

  // ---- Real admins review the queue ----
  const admin = Router();
  admin.use(requireAuth, requireRole('admin'));

  admin.get('/', async (req, res) => {
    const status = z.enum(['pending', 'approved', 'rejected']).catch('pending').parse(req.query.status);
    const { rows } = await db.query(
      `SELECT p.*, u.email, u.role FROM community_posts p JOIN users u ON u.id = p.author_id
        WHERE p.status = $1 ORDER BY p.created_at DESC LIMIT 200`,
      [status],
    );
    res.json({ posts: rows.map((p) => publicPost(p, true)) });
  });

  admin.post('/:id/review', async (req, res) => {
    const { decision, note } = z
      .object({ decision: z.enum(['approve', 'reject']), note: z.string().trim().max(500).optional() })
      .parse(req.body);
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Пост не найден');
    const { rows } = await db.query(
      `UPDATE community_posts SET status = $2, review_note = $3, reviewed_at = now() WHERE id = $1 RETURNING *`,
      [req.params.id, decision === 'approve' ? 'approved' : 'rejected', note || null],
    );
    if (!rows[0]) throw new HttpError(404, 'Пост не найден');
    res.json({ post: publicPost(rows[0], true) });
  });

  // The admin removes a post for good: waiting for review, published or rejected.
  admin.delete('/:id', async (req, res) => {
    if (!isUuid(req.params.id)) throw new HttpError(404, 'Пост не найден');
    const { rowCount } = await db.query('DELETE FROM community_posts WHERE id = $1', [req.params.id]);
    if (!rowCount) throw new HttpError(404, 'Пост не найден');
    res.json({ ok: true });
  });

  r.use('/admin', admin);
  return r;
}

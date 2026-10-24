import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type CommunityPost } from '../api';
import { useAuth } from '../auth';
import { fmtDateTime } from '../format';
import { tSentences, useT } from '../i18n';

const STATUS = {
  pending: { label: 'На проверке', cls: 'st-pending' },
  approved: { label: 'Опубликован', cls: 'st-approved' },
  rejected: { label: 'Не одобрен', cls: 'st-rejected' },
} as const;

/** "Be an admin": anyone signed in writes a post; it goes to a real admin and is shown after approval. */
export function BeAdminPage() {
  const t = useT();
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [mine, setMine] = useState<CommunityPost[]>([]);
  const [form, setForm] = useState({ authorName: '', title: '', body: '' });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.posts().then((r) => setPosts(r.posts)).catch(() => setPosts([]));
    if (user) api.myPosts().then((r) => setMine(r.posts)).catch(() => {});
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { post } = await api.createPost(form);
      setMine((m) => [post, ...m]);
      setForm({ ...form, title: '', body: '' });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page be-admin-page">
      <section className="courses-hero be-admin-hero">
        <span className="pill pill-dark">{t('Побудь админом')}</span>
        <h1>{t('Напиши пост для всего Kidsland')}</h1>
        <p>
          {t('Расскажи о своём проекте, опыте, рисунке или любимом уроке. Пост сначала проверит настоящий администратор, а после одобрения его увидят все.')}
        </p>
      </section>

      <div className="be-admin-layout">
        <section className="card">
          <h2 className="card-title">{t('Новый пост')}</h2>
          {!user ? (
            <p className="muted">
              {t('Чтобы написать пост, войдите или зарегистрируйтесь.')}{' '}
              <Link to="/login?next=/be-admin">{t('Войти')}</Link>
            </p>
          ) : (
            <form className="post-form" onSubmit={submit}>
              <label>
                {t('Как подписать пост')}
                <input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder={t('Например: Маша, 9 лет')} maxLength={40} required />
              </label>
              <label>
                {t('Заголовок')}
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} required />
              </label>
              <label>
                {t('Текст поста')}
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} maxLength={3000} required />
              </label>
              <p className="muted small">{t('Не пиши телефон, адрес и почту: такие посты блокируются.')}</p>
              {error && <div className="error">{tSentences(t, error)}</div>}
              {sent && <div className="success">{t('Пост отправлен на проверку администратору!')}</div>}
              <button className="btn btn-primary" disabled={busy}>
                {busy ? t('Отправляем…') : t('Отправить на проверку')}
              </button>
            </form>
          )}

          {mine.length > 0 && (
            <>
              <h3 className="card-title my-posts-title">{t('Мои посты')}</h3>
              <ul className="my-posts">
                {mine.map((p) => (
                  <li key={p.id}>
                    <b>{p.title}</b>
                    <span className={`post-status ${STATUS[p.status ?? 'pending'].cls}`}>{t(STATUS[p.status ?? 'pending'].label)}</span>
                    {p.reviewNote && <span className="muted small">{t('Комментарий администратора:')} {p.reviewNote}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
          <h2 className="track-title">{t('Посты ребят')}</h2>
          {!posts ? (
            <div className="center-note">{t('Загружаем…')}</div>
          ) : posts.length === 0 ? (
            <div className="card muted">{t('Пока нет опубликованных постов. Твой может стать первым!')}</div>
          ) : (
            <div className="post-feed">
              {posts.map((p) => (
                <article key={p.id} className="card post-card">
                  <h3>{p.title}</h3>
                  <p className="post-text">{p.body}</p>
                  <span className="muted small">
                    {p.authorName} · {fmtDateTime(p.createdAt)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

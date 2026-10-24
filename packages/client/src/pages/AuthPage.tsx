import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { homeFor, useAuth } from '../auth';
import { Sprite } from '../components/Sprite';
import { HERO } from '../game/sprites';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<'parent' | 'tutor'>(params.get('role') === 'tutor' ? 'tutor' : 'parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';
  const next = params.get('next');
  const keep = (path: string) => `${path}${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(email, password, role, role === 'tutor' ? name : undefined);
      const { user } = await api.me();
      // Only follow same-site paths from ?next=, never absolute URLs.
      navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : homeFor(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <form className="card auth-card" onSubmit={submit}>
        <div className="auth-heroes" aria-hidden>
          <Sprite svg={HERO.space('right')} size={56} className="float" />
          <Sprite svg={HERO.robot('down')} size={64} />
          <Sprite svg={HERO.ocean('right')} size={56} className="float" />
        </div>
        <h1>{isLogin ? 'С возвращением!' : 'Создать аккаунт'}</h1>
        {!isLogin && (
          <div className="segmented" role="radiogroup" aria-label="Кто вы">
            <button type="button" role="radio" aria-checked={role === 'parent'} className={role === 'parent' ? 'on' : ''} onClick={() => setRole('parent')}>
              Я родитель
            </button>
            <button type="button" role="radio" aria-checked={role === 'tutor'} className={role === 'tutor' ? 'on' : ''} onClick={() => setRole('tutor')}>
              Я наставник
            </button>
          </div>
        )}
        <p className="muted">
          {isLogin
            ? 'Войдите, чтобы продолжить.'
            : role === 'parent'
              ? 'Потом добавите профиль ребёнка, и можно играть.'
              : 'Потом заполните профиль и расписание, и родители смогут записываться.'}
        </p>
        {!isLogin && role === 'tutor' && (
          <label>
            Имя и фамилия
            <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Пароль
          <input
            type="password"
            required
            minLength={isLogin ? 1 : 8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </label>
        {!isLogin && <span className="hint">Не короче 8 символов</span>}
        {error && <div className="error">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? 'Минутку…' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
        <p className="muted switch">
          {isLogin ? (
            <>
              Нет аккаунта? <Link to={keep('/register')}>Зарегистрируйтесь</Link>
            </>
          ) : (
            <>
              Уже есть аккаунт? <Link to={keep('/login')}>Войдите</Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}

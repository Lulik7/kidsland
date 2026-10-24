import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Sprite } from '../components/Sprite';
import { HERO } from '../game/sprites';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await (isLogin ? login : register)(email, password);
      navigate('/kids');
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
        <h1>{isLogin ? 'С возвращением!' : 'Аккаунт родителя'}</h1>
        <p className="muted">
          {isLogin ? 'Войдите, чтобы продолжить игру.' : 'Создайте аккаунт, а потом добавьте профиль ребёнка.'}
        </p>
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
              Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
            </>
          ) : (
            <>
              Уже есть аккаунт? <Link to="/login">Войдите</Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}

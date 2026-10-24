import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type Child } from '../api';
import { AVATARS } from '../themes';

export function KidsPage() {
  const [kids, setKids] = useState<Child[] | null>(null);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.children().then((r) => setKids(r.children)).catch((e) => setError(e.message));
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { child } = await api.createChild(nickname, avatar);
      setKids((k) => [...(k ?? []), child]);
      setNickname('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  if (!kids) return <div className="center-note">{error ?? 'Загружаем…'}</div>;

  return (
    <main className="page">
      <h1>Кто сегодня играет?</h1>
      <div className="kids">
        {kids.map((k) => (
          <Link key={k.id} to={`/kids/${k.id}`} className="card kid">
            <div className="kid-avatar">{k.avatarUrl ?? '🙂'}</div>
            <h3>{k.nickname}</h3>
            <div className="kid-stats">
              <span>⭐ {k.xp} XP</span>
              <span>🪙 {k.coins}</span>
            </div>
            <span className="muted">Пройдено уровней: {k.completedLevels.length}</span>
          </Link>
        ))}
        <form className="card kid kid-new" onSubmit={add}>
          <h3>Новый игрок</h3>
          <div className="avatars">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                className={a === avatar ? 'avatar on' : 'avatar'}
                onClick={() => setAvatar(a)}
                aria-label={`Аватар ${a}`}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            placeholder="Имя или ник"
            required
            maxLength={30}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button className="btn btn-primary">Добавить</button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </main>
  );
}

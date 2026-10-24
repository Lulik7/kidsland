import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type Child } from '../api';
import { Sprite } from '../components/Sprite';
import { AVATAR_IDS, avatarSvg, COIN } from '../game/sprites';
import { plural } from '../plural';

export function KidsPage() {
  const [kids, setKids] = useState<Child[] | null>(null);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_IDS[0]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api
      .children()
      .then((r) => {
        setKids(r.children);
        setAdding(r.children.length === 0);
      })
      .catch((e) => setError(e.message));
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { child } = await api.createChild(nickname, avatar);
      setKids((k) => [...(k ?? []), child]);
      setNickname('');
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  if (!kids) return <div className="center-note">{error ?? 'Загружаем…'}</div>;

  return (
    <main className="page kids-page">
      <h1 className="page-title">Кто сегодня играет?</h1>
      <div className="kids">
        {kids.map((k) => (
          <Link key={k.id} to={`/kids/${k.id}`} className="kid">
            <Sprite svg={avatarSvg(k.avatarUrl)} size={110} className="kid-avatar" />
            <h3>{k.nickname}</h3>
            <div className="chips">
              <span className="chip chip-xp">{k.xp} XP</span>
              <span className="chip chip-coin">
                <Sprite svg={COIN} size={18} /> {k.coins}
              </span>
            </div>
            <span className="muted small">
              {k.completedLevels.length} {plural(k.completedLevels.length, ['уровень пройден', 'уровня пройдено', 'уровней пройдено'])}
            </span>
            <span className="btn btn-primary kid-play">Играть</span>
          </Link>
        ))}
        {adding ? (
          <form className="kid kid-new" onSubmit={add}>
            <h3>Новый игрок</h3>
            <Sprite svg={avatarSvg(avatar)} size={96} className="kid-avatar" />
            <div className="avatars">
              {AVATAR_IDS.map((a) => (
                <button
                  type="button"
                  key={a}
                  className={a === avatar ? 'avatar on' : 'avatar'}
                  onClick={() => setAvatar(a)}
                  aria-label="Выбрать аватар"
                >
                  <Sprite svg={avatarSvg(a)} size={36} />
                </button>
              ))}
            </div>
            <input placeholder="Имя или ник" required maxLength={30} value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <button className="btn btn-primary">Добавить</button>
            {error && <div className="error">{error}</div>}
          </form>
        ) : (
          <button className="kid kid-add" onClick={() => setAdding(true)}>
            <span className="plus">+</span>
            <h3>Добавить игрока</h3>
          </button>
        )}
      </div>
    </main>
  );
}

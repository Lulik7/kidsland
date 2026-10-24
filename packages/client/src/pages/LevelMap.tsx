import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Child, type LevelSummary } from '../api';
import { THEMES } from '../themes';

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} из 3 звёзд`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? 'on' : ''}>
          ★
        </span>
      ))}
    </span>
  );
}

export function LevelMap() {
  const { childId = '' } = useParams();
  const [levels, setLevels] = useState<LevelSummary[] | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    api.levels(childId).then((r) => setLevels(r.levels)).catch((e) => setError(e.message));
    api.children().then((r) => setChild(r.children.find((c) => c.id === childId) ?? null)).catch(() => {});
  }, [childId]);

  if (!levels) return <div className="center-note">{error ?? 'Загружаем карту…'}</div>;

  return (
    <main className="page">
      <div className="map-head">
        <h1>
          {child?.avatarUrl} {child ? `Привет, ${child.nickname}!` : 'Карта уровней'}
        </h1>
        {child && (
          <div className="kid-stats big">
            <span>⭐ {child.xp} XP</span>
            <span>🪙 {child.coins}</span>
          </div>
        )}
      </div>
      <div className="level-grid">
        {levels.map((l) => {
          const t = THEMES[l.theme];
          const body = (
            <>
              <div className="level-num">{l.order}</div>
              <div className="level-hero">{l.paywalled ? '👑' : l.unlocked ? t.hero : '🔒'}</div>
              <h3>{l.title}</h3>
              <Stars n={l.stars} />
              {l.isPremium && <span className="badge">Премиум</span>}
            </>
          );
          const style = { background: `linear-gradient(160deg, ${t.cell}, ${t.bg})` };
          if (l.unlocked) {
            return (
              <Link key={l.slug} to={`/kids/${childId}/play/${l.slug}`} className="level" style={style}>
                {body}
              </Link>
            );
          }
          return (
            <button
              key={l.slug}
              className="level locked"
              style={style}
              onClick={() => l.paywalled && setPaywall(true)}
              title={l.paywalled ? 'Доступно в премиум-подписке' : 'Сначала пройди предыдущий уровень'}
            >
              {body}
            </button>
          );
        })}
      </div>
      {paywall && (
        <div className="modal-bg" onClick={() => setPaywall(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">👑</div>
            <h2>Премиум-уровни</h2>
            <p>Условия, сложные циклы и лабиринты. Оформить подписку можно будет совсем скоро.</p>
            <button className="btn btn-primary" onClick={() => setPaywall(false)}>
              Понятно
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

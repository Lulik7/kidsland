import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Child, type LevelSummary } from '../api';
import { CrownIcon, LockIcon, StarIcon } from '../components/Icons';
import { KidHud } from '../components/KidHud';
import { Sprite } from '../components/Sprite';
import { avatarSvg, HERO } from '../game/sprites';
import { THEMES } from '../themes';

export function Stars({ n, size }: { n: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${n} из 3 звёзд`}>
      {[1, 2, 3].map((i) => (
        <StarIcon key={i} on={i <= n} size={size} />
      ))}
    </span>
  );
}

const ROW = 150;
/** Horizontal position (percent) of each node along the winding path. */
const xAt = (i: number) => 50 + Math.sin(i * 1.15) * 30;

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

  const current = levels.findIndex((l) => l.unlocked && !l.completed);
  const height = levels.length * ROW + 60;
  const points = levels.map((_, i) => ({ x: xAt(i), y: i * ROW + 100 }));
  const path = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midY = (prev.y + p.y) / 2;
      return `C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
    })
    .join(' ');
  const totalStars = levels.reduce((n, l) => n + l.stars, 0);

  return (
    <main className="page map-page">
      <KidHud
        childId={childId}
        child={child}
        extra={
          <span className="chip chip-star">
            <StarIcon on size={18} /> {totalStars} / {levels.length * 3}
          </span>
        }
      />

      <div className="map" style={{ height }}>
        <svg className="map-path" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
          <path d={path} className="path-base" vectorEffect="non-scaling-stroke" />
          <path d={path} className="path-dash" vectorEffect="non-scaling-stroke" />
        </svg>
        {levels.map((l, i) => {
          const t = THEMES[l.theme];
          const p = points[i];
          const isCurrent = i === current;
          const node = (
            <>
              <span className="node-num">{l.order}</span>
              <span className="node-face" style={{ background: `linear-gradient(160deg, ${t.bg2}, ${t.bg})` }}>
                {l.unlocked ? <Sprite svg={HERO[l.theme]('right')} size={58} /> : <LockIcon />}
              </span>
              {l.isPremium && (
                <span className="node-crown">
                  <CrownIcon />
                </span>
              )}
              {isCurrent && (
                <span className="node-me">
                  <Sprite svg={avatarSvg(child?.avatarUrl)} size={44} />
                  <span className="bubble">Играть!</span>
                </span>
              )}
            </>
          );
          const label = (
            <span className="node-label">
              <b>{l.title}</b>
              {l.completed ? <Stars n={l.stars} size={18} /> : <span className="node-world">{t.name}</span>}
            </span>
          );
          const style = { left: `${p.x}%`, top: p.y };
          const cls = `node${l.unlocked ? '' : ' locked'}${isCurrent ? ' current' : ''}${l.completed ? ' done' : ''}`;
          return l.unlocked ? (
            <Link key={l.slug} to={`/kids/${childId}/play/${l.slug}`} className={cls} style={style}>
              {node}
              {label}
            </Link>
          ) : (
            <button
              key={l.slug}
              className={cls}
              style={style}
              onClick={() => l.paywalled && setPaywall(true)}
              title={l.paywalled ? 'Доступно в премиум-подписке' : 'Сначала пройди предыдущий уровень'}
            >
              {node}
              {label}
            </button>
          );
        })}
      </div>

      {paywall && (
        <div className="modal-bg" onClick={() => setPaywall(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <CrownIcon size={72} />
            <h2>Премиум-уровни</h2>
            <p>Условия, вложенные циклы и лабиринты. Подписку можно будет оформить совсем скоро.</p>
            <button className="btn btn-primary" onClick={() => setPaywall(false)}>
              Понятно
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

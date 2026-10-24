import { useState } from 'react';
import type { ChildReport } from '../api';
import { useT } from '../i18n';

const H = 120;
const BAR = 22;
const GAP = 14;

/** Stars earned per level, one bar per level in play order. Single series, so a single hue. */
export function StarsChart({ levels }: { levels: ChildReport['levels'] }) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const width = levels.length * (BAR + GAP) + GAP;
  const y = (stars: number) => H - (stars / 3) * (H - 8);

  return (
    <div className="stars-chart">
      <svg viewBox={`0 0 ${width + 26} ${H + 26}`} role="img" aria-label={t('Звёзды по уровням')}>
        {[1, 2, 3].map((s) => (
          <g key={s}>
            <line x1={26} x2={width + 26} y1={y(s)} y2={y(s)} className="grid" />
            <text x={18} y={y(s) + 4} className="axis" textAnchor="end">
              {s}
            </text>
          </g>
        ))}
        <line x1={26} x2={width + 26} y1={H} y2={H} className="base" />
        {levels.map((l, i) => {
          const x = 26 + GAP + i * (BAR + GAP);
          const h = H - y(l.stars);
          return (
            <g
              key={l.slug}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
            >
              <rect x={x - GAP / 2} y={0} width={BAR + GAP} height={H + 26} fill="transparent" />
              {l.stars > 0 ? (
                <path
                  d={`M${x} ${H} V${H - h + 4} q0 -4 4 -4 h${BAR - 8} q4 0 4 4 V${H} Z`}
                  className={`bar${hover === i ? ' on' : ''}`}
                />
              ) : (
                <rect x={x} y={H - 3} width={BAR} height={3} rx={1.5} className="bar-empty" />
              )}
              <text x={x + BAR / 2} y={H + 18} className="axis" textAnchor="middle">
                {l.order}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${((26 + GAP + hover * (BAR + GAP) + BAR / 2) / (width + 26)) * 100}%` }}>
          <b>
            {levels[hover].order}. {t(levels[hover].title)}
          </b>
          <span>
            {levels[hover].completed ? `${levels[hover].stars} / 3 ★` : t('не пройден')}{' '}{t('· попыток:')}{' '}{levels[hover].attempts}
          </span>
        </div>
      )}
    </div>
  );
}

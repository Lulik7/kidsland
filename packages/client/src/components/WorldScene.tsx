import type { Theme } from '@kidsland/shared';

// Fixed pseudo-random spots so the scene looks the same on every render.
const spots = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const r = (k: number) => ((Math.sin((i + 1) * 12.9898 * k + seed) * 43758.5453) % 1 + 1) % 1;
    return { x: r(1) * 100, y: r(2) * 100, s: 0.5 + r(3) * 1.5, d: r(4) * 4 };
  });

const STARS = spots(40, 1);
const BUBBLES = spots(14, 2);

function Space() {
  return (
    <>
      {STARS.map((s, i) => (
        <i key={i} className="ws-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s * 2, height: s.s * 2, animationDelay: `${s.d}s` }} />
      ))}
      <svg className="ws-planet" viewBox="0 0 120 80" aria-hidden>
        <circle cx="60" cy="40" r="26" fill="#ff8a5c" />
        <path d="M40 30c10 4 30 2 40-4M36 44c14 6 34 4 48-2" stroke="#e8613a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="60" cy="42" rx="56" ry="12" fill="none" stroke="#ffd23f" strokeWidth="4" opacity=".85" />
      </svg>
      <svg className="ws-moon" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="16" fill="#e6e1ff" />
        <circle cx="14" cy="15" r="3.5" fill="#c8c0f0" />
        <circle cx="24" cy="25" r="4.5" fill="#c8c0f0" />
      </svg>
      <i className="ws-comet" />
      <i className="ws-comet ws-comet-2" />
    </>
  );
}

function Ocean() {
  return (
    <>
      <svg className="ws-waves" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden>
        <path d="M0 20 Q25 5 50 20 T100 20 T150 20 T200 20 T250 20 T300 20 T350 20 T400 20 V0 H0z" fill="#7fd6ff" opacity=".55" />
      </svg>
      <i className="ws-rays" />
      {BUBBLES.map((b, i) => (
        <i key={i} className="ws-bubble" style={{ left: `${b.x}%`, width: 6 + b.s * 6, height: 6 + b.s * 6, animationDelay: `${b.d}s`, animationDuration: `${3 + b.s * 2}s` }} />
      ))}
      <svg className="ws-fish" viewBox="0 0 60 30" aria-hidden>
        <path d="M10 15c8-12 30-12 38 0-8 12-30 12-38 0z" fill="#ffb02e" />
        <path d="M48 15l10-9v18z" fill="#ff7a2e" />
        <circle cx="18" cy="13" r="2.5" fill="#241d4f" />
      </svg>
      <svg className="ws-fish ws-fish-2" viewBox="0 0 60 30" aria-hidden>
        <path d="M10 15c8-12 30-12 38 0-8 12-30 12-38 0z" fill="#ff6fa5" />
        <path d="M48 15l10-9v18z" fill="#e0457f" />
        <circle cx="18" cy="13" r="2.5" fill="#241d4f" />
      </svg>
      <svg className="ws-weed" viewBox="0 0 30 90" aria-hidden>
        <path d="M15 90C5 70 25 55 15 35S20 10 15 0" stroke="#2fd08a" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="ws-weed ws-weed-2" viewBox="0 0 30 90" aria-hidden>
        <path d="M15 90C5 70 25 55 15 35S20 10 15 0" stroke="#1fb57a" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
    </>
  );
}

function Gear({ className, teeth = 8 }: { className: string; teeth?: number }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden>
      {Array.from({ length: teeth }, (_, i) => (
        <rect key={i} x="26" y="2" width="8" height="12" rx="2" fill="currentColor" transform={`rotate(${(360 / teeth) * i} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="20" fill="currentColor" />
      <circle cx="30" cy="30" r="7" fill="#3a4152" />
    </svg>
  );
}

function Factory() {
  return (
    <>
      <Gear className="ws-gear" />
      <Gear className="ws-gear ws-gear-2" teeth={10} />
      <Gear className="ws-gear ws-gear-3" teeth={6} />
      <i className="ws-lamp" />
      <i className="ws-lamp ws-lamp-2" />
      <div className="ws-belt">
        <svg className="ws-mini" viewBox="0 0 40 46" aria-hidden>
          <rect x="6" y="4" width="28" height="20" rx="6" fill="#a7a3ff" />
          <circle cx="15" cy="14" r="4" fill="#58e0c0" />
          <circle cx="25" cy="14" r="4" fill="#58e0c0" />
          <rect x="10" y="26" width="20" height="16" rx="4" fill="#7c78f0" />
        </svg>
        <svg className="ws-mini ws-mini-2" viewBox="0 0 40 46" aria-hidden>
          <rect x="4" y="12" width="32" height="30" rx="3" fill="#c98d4f" stroke="#8a5a2b" strokeWidth="3" />
          <path d="M4 12l32 30M36 12L4 42" stroke="#8a5a2b" strokeWidth="3" />
        </svg>
        <svg className="ws-mini ws-mini-3" viewBox="0 0 40 46" aria-hidden>
          <rect x="6" y="4" width="28" height="20" rx="6" fill="#ffb02e" />
          <circle cx="15" cy="14" r="4" fill="#241d4f" />
          <circle cx="25" cy="14" r="4" fill="#241d4f" />
          <rect x="10" y="26" width="20" height="16" rx="4" fill="#e8913a" />
        </svg>
      </div>
    </>
  );
}

/** Animated backdrop that comes alive when the world card is hovered or focused. */
export function WorldScene({ theme }: { theme: Theme }) {
  return (
    <div className={`world-scene ws-${theme}`} aria-hidden>
      {theme === 'space' ? <Space /> : theme === 'ocean' ? <Ocean /> : <Factory />}
    </div>
  );
}

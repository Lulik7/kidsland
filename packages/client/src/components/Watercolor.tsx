/**
 * Soft "watercolor" decorations drawn in SVG. A shared filter roughens the edges and a second
 * one adds paper grain, so flat shapes look painted with a brush.
 */
export function WatercolorDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id="wc" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.45 1.15" result="paper" />
          <feComposite in="rough" in2="paper" operator="in" result="grainy" />
          <feGaussianBlur in="grainy" stdDeviation="0.5" />
        </filter>
      </defs>
    </svg>
  );
}

type P = { className?: string; size?: number };

export function WcCloud({ className = '', size = 140, color = '#a9d3e8' }: P & { color?: string }) {
  return (
    <svg className={`wc ${className}`} width={size} height={size * 0.62} viewBox="0 0 160 100" aria-hidden>
      <g filter="url(#wc)">
        <path d="M30 80c-18 0-26-20-12-30 0-18 22-26 34-14 6-20 38-24 48-4 18-6 34 8 28 24 14 6 10 26-8 26H30z" fill={color} opacity="0.75" />
        <path d="M44 74c-10 0-14-12-6-18 2-10 16-12 22-4 6-10 22-10 26 2 10-2 18 6 14 14z" fill="#fff" opacity="0.35" />
      </g>
    </svg>
  );
}

export function WcBalloon({ className = '', size = 180 }: P) {
  const stripes = ['#bcd7ea', '#f4e6c8', '#a7c9e2', '#f4e6c8', '#bcd7ea'];
  return (
    <svg className={`wc ${className}`} width={size} height={size * 1.6} viewBox="0 0 120 192" aria-hidden>
      <defs>
        <clipPath id="wc-balloon">
          <path d="M60 4C28 4 6 28 6 58c0 30 26 50 40 74h28c14-24 40-44 40-74C114 28 92 4 60 4z" />
        </clipPath>
      </defs>
      <g filter="url(#wc)">
        <g clipPath="url(#wc-balloon)">
          {stripes.map((c, i) => (
            <rect key={i} x={6 + i * 21.6} y="0" width="21.6" height="140" fill={c} />
          ))}
        </g>
        <path d="M60 4C28 4 6 28 6 58c0 30 26 50 40 74h28c14-24 40-44 40-74C114 28 92 4 60 4z" fill="none" stroke="#7d9bb3" strokeWidth="1.5" opacity="0.6" />
        <path d="M46 132l4 32M74 132l-4 32" stroke="#8a7a68" strokeWidth="1.5" />
        <rect x="44" y="162" width="32" height="24" rx="5" fill="#a07a5a" />
        <rect x="44" y="162" width="32" height="6" rx="3" fill="#7c5a40" />
      </g>
    </svg>
  );
}

export function WcBranch({ className = '', size = 200, color = '#9fd3bf' }: P & { color?: string }) {
  const leaves: [number, number, number][] = [
    [40, 40, -30], [70, 30, 20], [95, 62, -20], [125, 52, 25], [150, 86, -15], [176, 80, 30],
  ];
  return (
    <svg className={`wc ${className}`} width={size} height={size * 0.6} viewBox="0 0 220 132" aria-hidden>
      <g filter="url(#wc)">
        <path d="M10 20C70 40 140 80 210 118" stroke="#7fb3a1" strokeWidth="3" fill="none" />
        {leaves.map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="22" ry="14" transform={`rotate(${r} ${x} ${y})`} fill={color} opacity={0.6 + (i % 3) * 0.12} />
        ))}
      </g>
    </svg>
  );
}

export function WcStar({ className = '', size = 46, color = '#f4b391' }: P & { color?: string }) {
  return (
    <svg className={`wc ${className}`} width={size} height={size} viewBox="0 0 50 50" aria-hidden>
      <g filter="url(#wc)">
        <path d="M25 4l6 14 15 1-12 10 4 15-13-8-13 8 4-15L4 19l15-1z" fill={color} opacity="0.85" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function WcBirds({ className = '' }: P) {
  return (
    <svg className={`wc ${className}`} width="110" height="120" viewBox="0 0 110 120" aria-hidden>
      <g fill="none" stroke="#2f4f75" strokeWidth="6" strokeLinecap="round">
        <path d="M10 22q14-4 22 8 8-16 26-18" />
        <path d="M20 58q16-4 24 10 10-18 30-20" />
        <path d="M14 98q18-6 28 10 12-20 34-22" />
      </g>
    </svg>
  );
}

/** Rolling green hills with round trees: closes a banner at the bottom. */
export function WcHills({ className = '' }: P) {
  const trees: [number, number, number, string][] = [
    [60, 70, 52, '#8fc2ad'], [150, 86, 40, '#6fa996'], [300, 80, 46, '#9ccbb6'], [470, 74, 54, '#7fb7a2'],
    [640, 84, 44, '#8fc2ad'], [820, 72, 56, '#6fa996'], [990, 82, 46, '#9ccbb6'], [1160, 74, 52, '#7fb7a2'], [1340, 84, 48, '#8fc2ad'],
  ];
  return (
    <svg className={`wc-hills ${className}`} viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
      <g filter="url(#wc)">
        {trees.map(([x, y, r, c], i) => (
          <g key={i}>
            <rect x={x - 3} y={y + r - 10} width="6" height="60" fill="#8a7a68" opacity="0.7" />
            <circle cx={x} cy={y + 20} r={r} fill={c} opacity="0.85" />
          </g>
        ))}
        <path d="M0 120C200 80 380 130 560 104S920 76 1100 104s260 4 340-10V160H0z" fill="#a8d2c0" opacity="0.9" />
        <path d="M0 140C260 112 520 150 760 128s480-20 680 0V160H0z" fill="var(--bg)" />
      </g>
    </svg>
  );
}

/** A little painted horse standing on the grass. */
export function WcHorse({ className = '', size = 200 }: P) {
  return (
    <svg className={`wc ${className}`} width={size} height={size * 0.9} viewBox="0 0 200 180" aria-hidden>
      <g filter="url(#wc)">
        {/* tail */}
        <path d="M40 70c-22 4-30 30-22 56 4-18 12-30 26-38z" fill="#8a5a3c" opacity="0.85" />
        {/* back legs */}
        <path d="M52 100l-6 66h12l8-58z" fill="#b98560" />
        <path d="M70 104l2 62h12l-2-60z" fill="#c99670" />
        {/* front legs */}
        <path d="M118 104l-2 62h12l4-60z" fill="#b98560" />
        <path d="M134 100l6 66h12l-6-68z" fill="#c99670" />
        {/* hooves */}
        <rect x="44" y="162" width="16" height="8" rx="3" fill="#5c4033" />
        <rect x="70" y="162" width="16" height="8" rx="3" fill="#5c4033" />
        <rect x="114" y="162" width="16" height="8" rx="3" fill="#5c4033" />
        <rect x="138" y="162" width="16" height="8" rx="3" fill="#5c4033" />
        {/* body */}
        <ellipse cx="94" cy="88" rx="58" ry="30" fill="#d9a77f" />
        <ellipse cx="94" cy="96" rx="44" ry="16" fill="#e8c29f" opacity="0.7" />
        {/* neck and head */}
        <path d="M128 80c4-26 10-44 22-54l18 8c-6 18-10 34-14 52z" fill="#d9a77f" />
        <path d="M148 24c10-8 26-6 34 4 6 8 6 18 0 22-6 4-14 2-22-4l-14-6z" fill="#d9a77f" />
        <ellipse cx="180" cy="44" rx="10" ry="8" fill="#e8c29f" />
        <path d="M150 18l4-14 8 12z" fill="#c99670" />
        {/* mane */}
        <path d="M146 22c-8 8-14 26-18 50 8-10 10-14 14-14-2-8 0-18 4-36z" fill="#8a5a3c" opacity="0.9" />
        <circle cx="166" cy="32" r="3" fill="#3b2a20" />
        <circle cx="183" cy="44" r="1.6" fill="#5c4033" />
        {/* saddle blanket */}
        <path d="M80 60h34l4 30H76z" fill="#9fc9e0" opacity="0.85" />
        <path d="M80 60h34l1 8H79z" fill="#f4b391" opacity="0.9" />
      </g>
    </svg>
  );
}

/** A tall cottage with a tiled roof, like the one from the reference picture. */
export function WcHouse({ className = '', size = 170 }: P) {
  const tiles: [number, number][] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c <= r + 1; c++) tiles.push([85 - (r + 1) * 14 + c * 28, 40 + r * 16]);
  return (
    <svg className={`wc ${className}`} width={size} height={size * 1.35} viewBox="0 0 170 230" aria-hidden>
      <g filter="url(#wc)">
        <rect x="108" y="18" width="20" height="40" fill="#b88a6a" />
        <rect x="104" y="12" width="28" height="10" fill="#8f6a52" />
        <rect x="22" y="110" width="126" height="116" fill="#f1dcb8" />
        <rect x="22" y="110" width="126" height="116" fill="#e9c99a" opacity="0.4" />
        <path d="M85 20L8 116h154z" fill="#c98d63" />
        {tiles.map(([x, y], i) => (
          <path key={i} d={`M${x - 12} ${y}q12 14 24 0`} fill="none" stroke="#9c6544" strokeWidth="2" opacity="0.7" />
        ))}
        {[
          [38, 130], [100, 130], [38, 180], [100, 180],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width="30" height="34" fill="#a7cfe0" />
            <path d={`M${x + 15} ${y}v34M${x} ${y + 17}h30`} stroke="#fff" strokeWidth="3" />
            <rect x={x - 3} y={y + 32} width="36" height="5" fill="#b88a6a" />
          </g>
        ))}
        <circle cx="85" cy="88" r="12" fill="#a7cfe0" />
        <path d="M85 76v24M73 88h24" stroke="#fff" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

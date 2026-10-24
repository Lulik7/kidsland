import { isRtl, useLang } from '../i18n';

/** SVG text on a path is laid out left to right, so right-to-left text is put into visual order by hand. */
const visualOrder = (text: string) => (text.match(/[A-Za-z0-9]+|./gu) ?? []).reverse().join('');

// Continents drawn on a strip twice the globe's width; the strip slides behind a round window, so the globe turns.
const LAND = [
  'M20 70c10-22 40-30 62-20 14 6 10 22 24 28 10 5 6 20-6 24-18 6-22 26-36 30-14 4-26-8-24-22 2-12-14-14-20-24-4-6-2-11 0-16z',
  'M96 160c12-6 26 0 30 14 6 18-2 40-10 56-6 12-20 10-22-4-2-16-10-24-8-40 2-12 2-22 10-26z',
  'M168 60c14-10 34-8 42 4 6 10-4 18 4 26 8 8 2 20-10 20-10 0-12 10-6 22 8 16 6 40-10 50-12 8-24-2-26-16-2-16-12-24-10-40 2-14-10-20-6-32 4-12 12-26 22-34z',
  'M232 50c22-14 60-12 82 2 16 10 30 4 40 18 8 12-4 26-18 26-12 0-16 12-30 12-16 0-22 16-36 12-12-4-8-20-20-24-14-4-28-10-24-26 0-10 0-14 6-20z',
  'M318 170c14-8 34-4 38 10 4 12-8 24-22 24-14 0-24-6-24-18 0-8 2-12 8-16z',
];

function Strip({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {LAND.map((d, i) => (
        <path key={i} d={d} fill="#4cc56a" stroke="#2f9e4e" strokeWidth="3" strokeLinejoin="round" />
      ))}
    </g>
  );
}

/** A turning Earth with a spinning ring of welcome text around it. */
export function Globe() {
  const { lang, t } = useLang();
  const text = t('Добро пожаловать в KidsLand!');
  const shown = isRtl(lang) ? visualOrder(text) : text;
  // The ring greets in the interface language only, repeated around the globe.
  const ring = `${shown} ★ ${shown} ★ `;
  return (
    <div className="globe" role="img" aria-label={text}>
      <svg className="globe-ring" viewBox="0 0 400 400" aria-hidden>
        <defs>
          <path id="globe-ring-path" d="M200 200m-172 0a172 172 0 1 1 344 0a172 172 0 1 1-344 0" />
        </defs>
        <text style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
          <textPath href="#globe-ring-path" xlinkHref="#globe-ring-path" textLength="1060" lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <svg className="globe-ball" viewBox="0 0 240 240" aria-hidden>
        <defs>
          <clipPath id="globe-clip">
            <circle cx="120" cy="120" r="112" />
          </clipPath>
          <radialGradient id="globe-sea" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#6fd3ff" />
            <stop offset=".6" stopColor="#2a8fe0" />
            <stop offset="1" stopColor="#1757a8" />
          </radialGradient>
          <radialGradient id="globe-shade" cx="35%" cy="30%" r="80%">
            <stop offset=".45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#0a1e4a" stopOpacity=".55" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="112" fill="url(#globe-sea)" />
        <g clipPath="url(#globe-clip)">
          <g className="globe-land">
            <Strip x={0} />
            <Strip x={380} />
          </g>
          <ellipse cx="120" cy="18" rx="70" ry="16" fill="#fff" opacity=".9" />
          <ellipse cx="120" cy="226" rx="80" ry="16" fill="#fff" opacity=".9" />
        </g>
        <circle cx="120" cy="120" r="112" fill="url(#globe-shade)" />
        <ellipse cx="84" cy="70" rx="30" ry="16" fill="#fff" opacity=".28" transform="rotate(-30 84 70)" />
        <circle cx="120" cy="120" r="112" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" />
      </svg>
      <span className="globe-orbit" aria-hidden>
        <i />
      </span>
    </div>
  );
}

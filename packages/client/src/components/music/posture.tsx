import type { ReactNode } from 'react';
import { BROWN, Figure, Kid, METAL, Num, WOOD, WOOD_DARK, type Tc } from './parts';

type Topic = 'guitar' | 'piano' | 'violin' | 'drums' | 'flute' | 'saxophone' | 'ukulele' | 'accordion' | 'cello' | 'vocal';

const TIPS: Record<Topic, string[]> = {
  guitar: ['Спина прямая, сиди на краю стула.', 'Гитара лежит на левой ноге, под ногу подставка.', 'Правая рука лежит на корпусе, пальцы над отверстием.', 'Левая рука держит гриф, большой палец за грифом.'],
  ukulele: ['Спина прямая, плечи свободны.', 'Укулеле прижата правым предплечьем к груди.', 'Правая рука бьёт по струнам над концом грифа.', 'Левая рука держит гриф, пальцы прижимают струны кончиками.'],
  piano: ['Сиди на краю банкетки, спина прямая.', 'Локти на уровне клавиш, плечи опущены.', 'Пальцы круглые, как будто держишь яблоко.', 'Ноги стоят на полу или на подставке.'],
  violin: ['Стой прямо, ноги на ширине плеч.', 'Скрипка лежит на левом плече, подбородок на подбороднике.', 'Левая рука держит гриф, запястье прямое.', 'Правая рука держит смычок мягко, большой палец согнут.'],
  cello: ['Сиди на краю стула, ноги обнимают виолончель.', 'Шпиль упирается в пол, гриф у левого плеча.', 'Левая рука на грифе, пальцы круглые.', 'Смычок ведём между подставкой и грифом.'],
  drums: ['Сиди на табурете так, чтобы колени были чуть ниже бёдер.', 'Правая нога на педали бочки, левая на педали хай-хэта.', 'Палочки держи у конца, примерно на трети длины.', 'Малый барабан стоит между коленями.'],
  flute: ['Стой или сиди прямо, плечи свободны.', 'Флейта лежит вправо, параллельно полу.', 'Губная пластина у нижней губы, дуй поперёк отверстия.', 'Левая рука ближе к лицу, правая дальше.'],
  saxophone: ['Сиди или стой прямо, ремень на шее.', 'Саксофон висит на ремне справа от тела.', 'Мундштук входит в рот на одну треть.', 'Левая рука сверху, правая снизу.'],
  accordion: ['Сиди на краю стула, спина прямая.', 'Аккордеон стоит на левой ноге, ремни на плечах.', 'Правая рука на клавишах, левая под ремнём у басов.', 'Мех раскрываем и сжимаем левой рукой плавно.'],
  vocal: ['Стой прямо, ноги на ширине плеч.', 'Плечи опущены, шея свободна.', 'Вдыхай животом: живот выходит вперёд.', 'Рот открывай свободно, подбородок не задирай.'],
};

/** A child holding the instrument, with numbered tips under the picture. */
export function Posture({ tc, topic }: { tc: Tc; topic: Topic }) {
  if (topic === 'piano') return <PianoPosture tc={tc} />;
  const sit = !['violin', 'vocal'].includes(topic);
  const tips = TIPS[topic].map((s) => tc(s));
  let instrument: ReactNode = null;
  let marks: [number, number][] = [];
  switch (topic) {
    case 'guitar':
    case 'ukulele': {
      const k = topic === 'ukulele' ? 0.7 : 1;
      instrument = (
        <g transform={`translate(190 150) rotate(-24) scale(${k})`}>
          <path d="M-60 0c0-36 24-48 48-42 12 4 18 4 26 0 24-8 46 8 46 42s-22 50-46 42c-8-4-14-4-26 0-24 6-48-6-48-42z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="3" />
          <circle cx="16" cy="0" r="12" fill={BROWN} />
          <rect x="40" y="-7" width="150" height="14" fill="#8a5a3c" />
          <rect x="190" y="-10" width="30" height="20" rx="4" fill={WOOD_DARK} />
        </g>
      );
      marks = [[150, 60], [175, 182], [180, 132], [300, 92]];
      break;
    }
    case 'violin':
      instrument = (
        <g>
          <g transform="translate(180 80) rotate(-70)">
            <path d="M-30 0c0-20 14-24 24-20 6 2 10 2 14 0 10-4 24 0 24 20s-12 26-24 22c-6-2-10-2-14 0-12 4-24-2-24-22z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2" />
            <rect x="30" y="-5" width="80" height="10" fill="#2f2a2a" />
          </g>
          <line x1="110" y1="120" x2="290" y2="40" stroke={BROWN} strokeWidth="4" />
          <path d="M196 30c30-10 60-6 70 6" stroke="#f4b391" strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
      );
      marks = [[150, 210], [176, 62], [262, 34], [120, 112]];
      break;
    case 'cello':
      instrument = (
        <g transform="translate(220 140)">
          <path d="M-40 0c-8-30 14-40 30-36 6 2 14 2 20 0 16-4 38 6 30 36-3 10-14 14-14 24s10 14 14 24c8 34-16 56-40 56s-48-22-40-56c3-10 14-14 14-24s-11-14-14-24z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="3" />
          <rect x="-5" y="-110" width="10" height="110" fill="#2f2a2a" />
          <line x1="0" y1="104" x2="0" y2="130" stroke={METAL} strokeWidth="4" />
        </g>
      );
      marks = [[150, 60], [220, 262], [224, 60], [270, 170]];
      break;
    case 'drums':
      instrument = (
        <g>
          <ellipse cx="250" cy="150" rx="40" ry="12" fill="#f6f1e6" stroke="#8a94a3" strokeWidth="3" />
          <rect x="210" y="150" width="80" height="20" fill="#e8743b" />
          <ellipse cx="330" cy="110" rx="34" ry="8" fill="#e9c97a" />
          <line x1="200" y1="110" x2="260" y2="140" stroke={BROWN} strokeWidth="5" strokeLinecap="round" />
          <circle cx="330" cy="230" r="34" fill="#e8743b" stroke="#8a94a3" strokeWidth="3" />
        </g>
      );
      marks = [[150, 200], [300, 262], [200, 98], [250, 140]];
      break;
    case 'flute':
      instrument = (
        <g>
          <rect x="150" y="62" width="200" height="10" rx="5" fill={METAL} stroke="#8a94a3" transform="rotate(4 150 62)" />
          <path d="M180 112c10-20 20-34 40-40M200 120c30-10 60-30 90-40" stroke="#f4b391" strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
      );
      marks = [[150, 120], [300, 60], [162, 66], [228, 86]];
      break;
    case 'saxophone':
      instrument = (
        <g>
          <path d="M150 50l40 0" stroke="#2f2a2a" strokeWidth="3" />
          <path d="M190 52c10 0 14 10 14 20v120c0 40 20 56 40 56s30-16 30-40v-20" stroke="#e1c27a" strokeWidth="22" fill="none" strokeLinecap="round" />
          <path d="M160 50c20-6 30 0 30 0" stroke="#8a94a3" strokeWidth="2" fill="none" />
        </g>
      );
      marks = [[150, 120], [230, 200], [168, 46], [204, 110]];
      break;
    case 'accordion':
      instrument = (
        <g>
          <rect x="140" y="80" width="40" height="110" rx="6" fill="#d94f5c" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={180 + i * 12} y="84" width="12" height="102" fill={i % 2 ? '#f6f1e6' : '#e9e1d2'} />
          ))}
          <rect x="252" y="80" width="40" height="110" rx="6" fill="#d94f5c" />
        </g>
      );
      marks = [[150, 60], [200, 196], [160, 130], [272, 120]];
      break;
    case 'vocal':
      marks = [[150, 210], [150, 40], [150, 120], [150, 0]];
      break;
  }
  return (
    <Figure title={tc('Как держать инструмент и сидеть')} h={290} notes={tips}>
      <Kid x={150} y={60} sit={sit} />
      {instrument}
      {topic === 'vocal' && <path d="M126 100c10 20 38 20 48 0" stroke="#79c7a6" strokeWidth="4" fill="none" strokeDasharray="5 5" />}
      {marks.map(([x, y], i) => (
        <Num key={i} x={x + 14} y={Math.max(14, y)} n={i + 1} />
      ))}
    </Figure>
  );
}

const SKIN = '#f6cfb2';
const SKIN_DARK = '#e4b393';
const SHIRT = '#79c7a6';
const SHIRT_DARK = '#5aa98a';
const PANTS = '#4f6d96';

/** A side view of a child at an upright piano, with guide lines for the back, the elbows and the feet. */
function PianoPosture({ tc }: { tc: Tc }) {
  const tips = TIPS.piano.map((s) => tc(s));
  return (
    <Figure title={tc('Как держать инструмент и сидеть')} h={300} notes={tips}>
      <defs>
        <linearGradient id="pp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8ee" />
          <stop offset="1" stopColor="#fdeedd" />
        </linearGradient>
        <linearGradient id="pp-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b4330" />
          <stop offset="0.5" stopColor="#5a3726" />
          <stop offset="1" stopColor="#40261a" />
        </linearGradient>
        <radialGradient id="pp-cheek">
          <stop offset="0" stopColor="#f29c8a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f29c8a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* room */}
      <rect x="0" y="0" width="460" height="300" rx="14" fill="url(#pp-wall)" />
      <rect x="0" y="270" width="460" height="30" fill="#ecd9c2" />
      <ellipse cx="190" cy="276" rx="130" ry="9" fill="#e0c6a8" />
      {/* piano */}
      <g>
        <rect x="282" y="36" width="160" height="236" rx="8" fill="url(#pp-wood)" />
        <rect x="276" y="30" width="172" height="12" rx="5" fill="#734a35" />
        <rect x="282" y="168" width="160" height="6" fill="#3a2217" opacity="0.6" />
        <rect x="292" y="182" width="140" height="78" rx="6" fill="none" stroke="#7b5440" strokeWidth="2" />
        {/* music stand with a sheet */}
        <path d="M268 112l18-4v6l-18 4z" fill="#3e2619" />
        <g transform="rotate(-8 276 88)">
          <rect x="262" y="58" width="22" height="56" rx="2" fill="#fffdf8" stroke="#d8cbb8" />
          {[68, 78, 88, 98].map((y) => (
            <line key={y} x1="265" y1={y} x2="281" y2={y} stroke="#b9ad9b" strokeWidth="1" />
          ))}
        </g>
        {/* keys from the side */}
        <rect x="236" y="150" width="50" height="16" rx="3" fill="#4a2d1f" />
        <rect x="238" y="144" width="46" height="7" rx="2" fill="#fffdf8" stroke="#cfc6b8" />
        <rect x="254" y="139" width="30" height="6" rx="2" fill="#2b2b33" />
        {/* leg and pedals */}
        <rect x="244" y="166" width="10" height="100" rx="3" fill="#5a3726" />
        <rect x="236" y="262" width="26" height="8" rx="3" fill="#4a2d1f" />
        <path d="M282 258h-16" stroke="#d9b45a" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* floating notes */}
      <g fill={SHIRT_DARK} opacity="0.75">
        <text x="350" y="22" fontSize="18">♪</text>
        <text x="392" y="16" fontSize="14">♫</text>
      </g>
      {/* bench */}
      <rect x="92" y="186" width="104" height="12" rx="5" fill="#b0855f" />
      <rect x="92" y="198" width="104" height="6" fill="#8d6646" />
      <rect x="100" y="204" width="9" height="66" rx="2" fill="#8d6646" />
      <rect x="180" y="204" width="9" height="66" rx="2" fill="#8d6646" />
      {/* far arm, behind the body */}
      <path d="M170 118l17 32" stroke={SHIRT_DARK} strokeWidth="13" strokeLinecap="round" />
      <path d="M187 148l52-6" stroke={SKIN_DARK} strokeWidth="10" strokeLinecap="round" />
      {/* legs */}
      <path d="M162 180h58" stroke={PANTS} strokeWidth="22" strokeLinecap="round" />
      <path d="M222 182l4 72" stroke={PANTS} strokeWidth="17" strokeLinecap="round" />
      <path d="M216 266h24a7 7 0 0 0 0-12h-12l-12 0z" fill="#3b3b48" />
      <rect x="218" y="248" width="16" height="7" rx="3" fill="#fff" />
      {/* body */}
      <path d="M150 112c4-8 24-8 30 0l2 40-4 30h-34l2-30z" fill={SHIRT} />
      <path d="M150 112c-3 20-5 46-4 70h6c0-24 2-48 4-68z" fill={SHIRT_DARK} opacity="0.5" />
      {/* neck and head */}
      <rect x="160" y="96" width="12" height="16" rx="5" fill={SKIN_DARK} />
      <circle cx="168" cy="80" r="23" fill={SKIN} />
      <path d="M190 82l5 5-5 2" fill={SKIN} stroke={SKIN_DARK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M145 82c-4-26 18-40 38-32 8 3 13 9 14 16-10-6-22-4-30 2-6 4-8 12-6 20-6 0-12-2-16-6z" fill="#7a4a30" />
      <circle cx="160" cy="84" r="6" fill={SKIN_DARK} />
      <ellipse cx="186" cy="78" rx="2.4" ry="3" fill="#3a3a46" />
      <circle cx="186.8" cy="77" r="0.9" fill="#fff" />
      <circle cx="183" cy="90" r="6" fill="url(#pp-cheek)" />
      <path d="M182 95q5 3 9-1" stroke="#a5523f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* near arm with a round hand on the keys */}
      <path d="M168 120l19 32" stroke={SHIRT} strokeWidth="14" strokeLinecap="round" />
      <path d="M189 152l50-5" stroke={SKIN} strokeWidth="11" strokeLinecap="round" />
      <path d="M236 142c6-8 20-9 27-1 3 3 3 6 2 9l-3-1c-3-6-14-8-21-2z" fill={SKIN} stroke={SKIN_DARK} strokeWidth="1.2" />
      <circle cx="263" cy="146" r="2.5" fill={SKIN} stroke={SKIN_DARK} strokeWidth="1" />
      {/* guide lines */}
      <path d="M140 60v124" stroke={MINT_GUIDE} strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" />
      <path d="M182 148h108" stroke="#f2a07b" strokeWidth="2.5" strokeDasharray="5 5" />
      <path d="M200 270h56" stroke={MINT_GUIDE} strokeWidth="3" strokeLinecap="round" />
      {/* inset: rounded fingers like holding an apple */}
      <g transform="translate(62 70)">
        <circle r="48" fill="#fff" stroke="#f2c6a5" strokeWidth="3" strokeDasharray="6 4" />
        <rect x="-38" y="20" width="76" height="12" rx="3" fill="#fffdf8" stroke="#cfc6b8" />
        <text x="0" y="14" textAnchor="middle" fontSize="30">🍎</text>
        <path d="M-30 18c-2-30 12-44 30-44s32 14 30 44" stroke={SKIN} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M-30 18c-2-30 12-44 30-44s32 14 30 44" stroke={SKIN_DARK} strokeWidth="1.2" fill="none" strokeDasharray="2 10" />
      </g>
      <Num x={140} y={48} n={1} />
      <Num x={300} y={148} n={2} />
      <Num x={62} y={130} n={3} />
      <Num x={270} y={270} n={4} />
    </Figure>
  );
}

const MINT_GUIDE = '#3fae84';

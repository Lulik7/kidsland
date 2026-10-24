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
    case 'piano':
      instrument = (
        <g>
          <rect x="230" y="60" width="200" height="150" rx="6" fill="#4a3a3a" />
          <rect x="216" y="128" width="228" height="14" fill="#3a2d2d" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={218 + i * 16} y="142" width="16" height="16" fill="#fffdf8" stroke="#8a94a3" />
          ))}
          <path d="M180 112c20 0 30 10 44 30" stroke="#f4b391" strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
      );
      marks = [[150, 60], [200, 118], [228, 150], [205, 262]];
      break;
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

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { Choices, INK, Say, Scene, Slider, svgPoint, useDrag, useTicker, type Tc } from './kit';

// ---------------- Easel: brush, paints and backgrounds ----------------

const PAINTS = ['#e5534b', '#f39c3d', '#f7d046', '#5cb85c', '#3fa7d6', '#3557a8', '#8e5bd0', '#8b5a2b', '#34404f', '#ffffff'];
const BACKS: Record<string, { name: string; paint: (g: CanvasRenderingContext2D, w: number, h: number) => void }> = {
  paper: { name: 'Бумага', paint: (g, w, h) => { g.fillStyle = '#fffdf6'; g.fillRect(0, 0, w, h); } },
  sky: {
    name: 'Небо',
    paint: (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#9fd3f5');
      gr.addColorStop(1, '#e9f6ff');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    },
  },
  sea: {
    name: 'Море',
    paint: (g, w, h) => {
      g.fillStyle = '#cfeafc';
      g.fillRect(0, 0, w, h * 0.55);
      g.fillStyle = '#4a9fd8';
      g.fillRect(0, h * 0.55, w, h);
      g.fillStyle = '#ffd66b';
      g.beginPath();
      g.arc(w * 0.78, h * 0.22, 26, 0, Math.PI * 2);
      g.fill();
    },
  },
  meadow: {
    name: 'Луг',
    paint: (g, w, h) => {
      g.fillStyle = '#dff1ff';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#9fd38a';
      g.beginPath();
      g.moveTo(0, h * 0.62);
      g.quadraticCurveTo(w * 0.3, h * 0.48, w * 0.6, h * 0.62);
      g.quadraticCurveTo(w * 0.85, h * 0.72, w, h * 0.58);
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.fill();
    },
  },
  night: {
    name: 'Ночь',
    paint: (g, w, h) => {
      g.fillStyle = '#1f2a4d';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) g.fillRect((i * 97) % w, (i * 53) % (h * 0.7), 2, 2);
    },
  },
};
type Brush = 'round' | 'water' | 'pencil' | 'eraser';

/** A small easel: pick a brush, a paint and a background and paint with the mouse or a finger. */
export function Easel({ tc, title = 'Мольберт: рисуй сам', back: startBack = 'paper' }: { tc: Tc; title?: string; back?: keyof typeof BACKS }) {
  const W = 460;
  const H = 280;
  const canvas = useRef<HTMLCanvasElement>(null);
  const ink = useRef<HTMLCanvasElement | null>(null);
  const history = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(PAINTS[4]);
  const [size, setSize] = useState(10);
  const [brush, setBrush] = useState<Brush>('round');
  const [back, setBack] = useState<string>(startBack);

  // The picture is kept on its own layer, so the background can be changed under it.
  const layer = () => {
    if (!ink.current) {
      ink.current = document.createElement('canvas');
      ink.current.width = W * 2;
      ink.current.height = H * 2;
    }
    return ink.current.getContext('2d')!;
  };
  const redraw = () => {
    const g = canvas.current?.getContext('2d');
    if (!g) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    BACKS[back].paint(g, W, H);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (ink.current) g.drawImage(ink.current, 0, 0);
  };
  useEffect(redraw, [back]);

  const at = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W * 2, y: ((e.clientY - r.top) / r.height) * H * 2 };
  };
  const stroke = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const g = layer();
    g.save();
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.globalCompositeOperation = brush === 'eraser' ? 'destination-out' : 'source-over';
    g.strokeStyle = brush === 'eraser' ? '#000' : color;
    g.lineWidth = (brush === 'pencil' ? Math.max(2, size / 4) : size) * 2;
    if (brush === 'water') {
      g.globalAlpha = 0.18;
      g.shadowColor = color;
      g.shadowBlur = size * 2;
    }
    if (brush === 'pencil') g.globalAlpha = 0.75;
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
    g.restore();
    redraw();
  };

  return (
    <Scene
      title={tc(title)}
      w={W}
      h={0}
      notes={[tc('Выбери кисть, краску и фон, потом рисуй мышкой или пальцем.'), tc('Акварельная кисть прозрачная: проведи по одному месту несколько раз, и цвет станет гуще.')]}
      controls={
        <>
          <canvas
            ref={canvas}
            width={W * 2}
            height={H * 2}
            className="easel-canvas"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const g = layer();
              history.current = [...history.current.slice(-15), g.getImageData(0, 0, W * 2, H * 2)];
              last.current = at(e);
              stroke(last.current, last.current);
            }}
            onPointerMove={(e) => {
              if (!last.current) return;
              const p = at(e);
              stroke(last.current, p);
              last.current = p;
            }}
            onPointerUp={() => (last.current = null)}
          />
          <div className="easel-paints">
            {PAINTS.map((c) => (
              <button key={c} type="button" aria-label={c} className={c === color && brush !== 'eraser' ? 'on' : ''} style={{ background: c }} onClick={() => { setColor(c); if (brush === 'eraser') setBrush('round'); }} />
            ))}
          </div>
          <Choices
            items={[
              ['round', `🖌 ${tc('Кисть')}`],
              ['water', `💧 ${tc('Акварель')}`],
              ['pencil', `✏️ ${tc('Карандаш')}`],
              ['eraser', `🧽 ${tc('Ластик')}`],
            ]}
            value={brush}
            onChange={setBrush}
          />
          <Slider label={tc('Толщина кисти')} value={size} min={2} max={40} onChange={setSize} />
          <Choices items={Object.entries(BACKS).map(([k, v]) => [k, tc(v.name)] as [string, string])} value={back} onChange={setBack} />
          <div className="chips-row md-choices">
            <button
              type="button"
              className="fchip"
              onClick={() => {
                const prev = history.current.pop();
                if (prev) layer().putImageData(prev, 0, 0);
                redraw();
              }}
            >
              ↶ {tc('Отменить')}
            </button>
            <button
              type="button"
              className="fchip"
              onClick={() => {
                const g = layer();
                history.current.push(g.getImageData(0, 0, W * 2, H * 2));
                g.clearRect(0, 0, W * 2, H * 2);
                redraw();
              }}
            >
              🗑 {tc('Очистить')}
            </button>
          </div>
        </>
      }
    >
      {null}
    </Scene>
  );
}

// ---------------- Pencils: hard and soft ----------------

const PENCILS = [
  { name: '2H', tone: 0.25, w: 1.2 },
  { name: 'H', tone: 0.35, w: 1.5 },
  { name: 'HB', tone: 0.5, w: 2 },
  { name: '2B', tone: 0.68, w: 2.6 },
  { name: '4B', tone: 0.82, w: 3.2 },
  { name: '6B', tone: 0.95, w: 4 },
];

/** Pencils from hard to soft, and pressing harder or lighter. */
export function PencilPressure({ tc }: { tc: Tc }) {
  const [p, setP] = useState(2);
  const [press, setPress] = useState(50);
  const pen = PENCILS[p];
  const alpha = Math.min(1, pen.tone * (0.4 + press / 80));
  return (
    <Scene
      title={tc('Твёрдый и мягкий карандаш')}
      h={200}
      notes={[tc('H значит твёрдый: линия светлая и тонкая. B значит мягкий: линия тёмная и широкая.'), tc('Сильнее нажимаешь, темнее линия. Начинай рисунок с лёгких линий.')]}
      controls={
        <>
          <Choices items={PENCILS.map((x, i) => [String(i), x.name] as [string, string])} value={String(p)} onChange={(v) => setP(Number(v))} />
          <Slider label={tc('Нажим')} value={press} min={5} max={100} onChange={setPress} />
        </>
      }
    >
      <rect x="20" y="20" width="420" height="160" rx="16" fill="#fffdf6" stroke="#f2d9cc" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M50 ${60 + i * 40} C 130 ${30 + i * 40}, 210 ${90 + i * 40}, 290 ${60 + i * 40} S 380 ${40 + i * 40}, 410 ${62 + i * 40}`} fill="none" stroke={INK} strokeOpacity={alpha} strokeWidth={pen.w * (0.6 + press / 120)} strokeLinecap="round" />
      ))}
      <g transform={`translate(360 ${150 - press / 3}) rotate(-35)`}>
        <rect x="-6" y="-70" width="12" height="62" rx="2" fill="#f7c948" stroke={INK} />
        <path d="M-6 -8 L0 8 L6 -8z" fill="#f4dcb5" stroke={INK} />
        <path d="M-2 2 L0 8 L2 2z" fill={INK} />
        <text y="-40" textAnchor="middle" fontSize="8" fontWeight="800" fill={INK} transform="rotate(90 0 -40)">
          {pen.name}
        </text>
      </g>
    </Scene>
  );
}

// ---------------- Simple shapes ----------------

/** Build a cat from a circle, triangles and a square: drag the shapes onto the outline. */
export function ShapeBuilder({ tc }: { tc: Tc }) {
  const slots = {
    body: { x: 300, y: 160 },
    head: { x: 300, y: 92 },
    ear1: { x: 280, y: 58 },
    ear2: { x: 320, y: 58 },
    tail: { x: 362, y: 170 },
  };
  type Id = keyof typeof slots;
  const start: Record<Id, { x: number; y: number }> = { body: { x: 70, y: 180 }, head: { x: 70, y: 80 }, ear1: { x: 150, y: 60 }, ear2: { x: 190, y: 60 }, tail: { x: 160, y: 170 } };
  const { pos, setPos, get } = useDrag<Id>(start, (id, p) => {
    const s = slots[id];
    return Math.hypot(s.x - p.x, s.y - p.y) < 30 ? s : undefined;
  });
  const done = (Object.keys(slots) as Id[]).every((k) => pos[k].x === slots[k].x && pos[k].y === slots[k].y);
  return (
    <Scene
      title={tc('Собери кота из простых фигур')}
      h={240}
      notes={[tc('Любой рисунок начинается с простых форм: круга, квадрата и треугольника.'), tc('Перетащи фигуры на пунктир.')]}
      controls={
        <>
          {done && <Say>🐱 {tc('Получился кот! Так же рисуют любых животных и предметы.')}</Say>}
          <button type="button" className="fchip" onClick={() => setPos(start)}>
            ↻ {tc('Ещё раз')}
          </button>
        </>
      }
    >
      <g stroke="#c4cdd8" strokeDasharray="5 4" fill="none" strokeWidth="2">
        <rect x="260" y="125" width="80" height="70" rx="10" />
        <circle cx="300" cy="92" r="34" />
        <path d="M266 72 L280 38 L294 72z" />
        <path d="M306 72 L320 38 L334 72z" />
        <rect x="350" y="140" width="24" height="60" rx="12" />
      </g>
      <g {...get('body')}>
        <rect x="-40" y="-35" width="80" height="70" rx="10" fill="#f39c3d" stroke={INK} strokeWidth="2" />
      </g>
      <g {...get('tail')}>
        <rect x="-12" y="-30" width="24" height="60" rx="12" fill="#e98a2c" stroke={INK} strokeWidth="2" />
      </g>
      <g {...get('head')}>
        <circle r="34" fill="#f7b267" stroke={INK} strokeWidth="2" />
        {done && (
          <g>
            <circle cx="-12" cy="-4" r="4" fill={INK} />
            <circle cx="12" cy="-4" r="4" fill={INK} />
            <path d="M-6 10 Q0 16 6 10" stroke={INK} fill="none" strokeWidth="2" />
          </g>
        )}
      </g>
      <g {...get('ear1')}>
        <path d="M-14 14 L0 -20 L14 14z" fill="#f39c3d" stroke={INK} strokeWidth="2" />
      </g>
      <g {...get('ear2')}>
        <path d="M-14 14 L0 -20 L14 14z" fill="#f39c3d" stroke={INK} strokeWidth="2" />
      </g>
    </Scene>
  );
}

// ---------------- Mixing colours ----------------

const BASE = { red: { c: '#e5534b', n: 'красный' }, yellow: { c: '#f7d046', n: 'жёлтый' }, blue: { c: '#3557a8', n: 'синий' }, white: { c: '#ffffff', n: 'белый' }, black: { c: '#2b2b2b', n: 'чёрный' } } as const;
type Base = keyof typeof BASE;
const MIX: Record<string, { c: string; n: string }> = {
  'red+yellow': { c: '#f08a2c', n: 'оранжевый' },
  'blue+yellow': { c: '#4fae4a', n: 'зелёный' },
  'blue+red': { c: '#7b4fa8', n: 'фиолетовый' },
  'red+white': { c: '#f4a3a0', n: 'розовый' },
  'blue+white': { c: '#9cc2ef', n: 'голубой' },
  'white+yellow': { c: '#fbe9a6', n: 'светло-жёлтый' },
  'black+red': { c: '#7a2420', n: 'тёмно-красный, бордовый' },
  'black+blue': { c: '#1d2a50', n: 'тёмно-синий' },
  'black+yellow': { c: '#7d7a2a', n: 'оливковый' },
  'black+white': { c: '#9a9a9a', n: 'серый' },
};

/** Put two paints on the palette and see what colour they make. */
export function ColorMixer({ tc }: { tc: Tc }) {
  const [pick, setPick] = useState<Base[]>([]);
  const key = [...pick].sort().join('+');
  const res = pick.length === 2 ? (pick[0] === pick[1] ? BASE[pick[0]] : MIX[key]) : null;
  const add = (b: Base) => setPick((s) => (s.length >= 2 ? [b] : [...s, b]));
  return (
    <Scene
      title={tc('Смешиваем краски')}
      h={220}
      notes={[tc('Нажми на две баночки, и краски смешаются на палитре.'), tc('Из красного, жёлтого и синего можно получить почти все цвета.')]}
      controls={
        <>
          {res && (
            <Say>
              {tc(BASE[pick[0]].n)} + {tc(BASE[pick[1]].n)} = <b>{tc(res.n)}</b>
            </Say>
          )}
        </>
      }
    >
      {(Object.keys(BASE) as Base[]).map((b, i) => (
        <g key={b} transform={`translate(${50 + i * 46} 50)`} onClick={() => add(b)} style={{ cursor: 'pointer' }}>
          <rect x="-17" y="-22" width="34" height="44" rx="8" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <rect x="-14" y="-6" width="28" height="25" rx="5" fill={BASE[b].c} stroke={b === 'white' ? '#ccc' : 'none'} />
          <rect x="-19" y="-28" width="38" height="9" rx="3" fill="#cfd6df" stroke={INK} strokeWidth="1" />
        </g>
      ))}
      <path d="M40 150 C 40 100, 160 92, 230 110 C 300 128, 300 200, 230 200 C 190 200, 200 176, 170 176 C 140 176, 120 205, 80 200 C 50 196, 40 175, 40 150z" fill="#f4dcb5" stroke={INK} strokeWidth="2" />
      <circle cx="90" cy="168" r="10" fill="#fff" stroke={INK} strokeWidth="1.5" />
      {pick.map((b, i) => (
        <circle key={i} cx={130 + i * 40} cy={135} r="17" fill={BASE[b].c} stroke={b === 'white' ? '#ccc' : 'none'} />
      ))}
      {res && <circle cx={230} cy={160} r="26" fill={res.c} className="mix-pop" />}
      <text x="360" y="110" textAnchor="middle" fontSize="44">
        {res ? '🖌️' : '🎨'}
      </text>
    </Scene>
  );
}

// ---------------- Colour wheel ----------------

const WHEEL = [
  { c: '#e5534b', n: 'красный', warm: true },
  { c: '#f08a2c', n: 'оранжевый', warm: true },
  { c: '#f7d046', n: 'жёлтый', warm: true },
  { c: '#8cc63f', n: 'жёлто-зелёный', warm: true },
  { c: '#4fae4a', n: 'зелёный', warm: false },
  { c: '#2bb0a8', n: 'бирюзовый', warm: false },
  { c: '#3fa7d6', n: 'голубой', warm: false },
  { c: '#3557a8', n: 'синий', warm: false },
  { c: '#7b4fa8', n: 'фиолетовый', warm: false },
  { c: '#b5479b', n: 'пурпурный', warm: true },
];

/** The colour circle: warm and cold halves and the opposite (complementary) colour. */
export function ColorWheel({ tc, mode: startMode = 'pair' }: { tc: Tc; mode?: 'pair' | 'warm' }) {
  const [sel, setSel] = useState(0);
  const [mode, setMode] = useState(startMode);
  const n = WHEEL.length;
  const opp = (sel + n / 2) % n;
  const seg = (i: number) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const [r0, r1] = [45, 100];
    const pt = (r: number, a: number) => `${130 + r * Math.cos(a)} ${120 + r * Math.sin(a)}`;
    return `M${pt(r0, a0)} L${pt(r1, a0)} A${r1} ${r1} 0 0 1 ${pt(r1, a1)} L${pt(r0, a1)} A${r0} ${r0} 0 0 0 ${pt(r0, a0)}z`;
  };
  return (
    <Scene
      title={tc('Цветовой круг')}
      h={240}
      notes={
        mode === 'pair'
          ? [tc('Нажми на цвет. Напротив него в круге стоит дополнительный цвет.'), tc('Рядом дополнительные цвета спорят и делают друг друга ярче.')]
          : [tc('Тёплые цвета похожи на огонь и солнце, холодные на лёд и воду.'), tc('Тёплые цвета кажутся ближе, холодные уходят вдаль.')]
      }
      controls={
        <Choices
          items={[
            ['pair', tc('Пары цветов')],
            ['warm', tc('Тёплые и холодные')],
          ]}
          value={mode}
          onChange={setMode}
        />
      }
    >
      {WHEEL.map((w, i) => (
        <path
          key={i}
          d={seg(i)}
          fill={w.c}
          stroke="#fff"
          strokeWidth={i === sel || (mode === 'pair' && i === opp) ? 4 : 1.5}
          opacity={mode === 'warm' ? 1 : i === sel || i === opp ? 1 : 0.45}
          onClick={() => setSel(i)}
          style={{ cursor: 'pointer' }}
        />
      ))}
      {mode === 'warm' && (
        <g fontSize="13" fontWeight="800" fill={INK}>
          <text x="130" y="116" textAnchor="middle">
            🔥 / ❄️
          </text>
          <path d="M60 30 A 110 110 0 0 1 220 50" stroke="#f08a2c" strokeWidth="3" fill="none" strokeDasharray="4 4" />
        </g>
      )}
      {mode === 'pair' ? (
        <g>
          <rect x="270" y="60" width="70" height="120" rx="12" fill={WHEEL[sel].c} />
          <rect x="340" y="60" width="70" height="120" rx="12" fill={WHEEL[opp].c} />
          <circle cx="305" cy="120" r="14" fill={WHEEL[opp].c} />
          <circle cx="375" cy="120" r="14" fill={WHEEL[sel].c} />
          <text x="340" y="205" textAnchor="middle" fontSize="14" fontWeight="700" fill={INK}>
            {tc(WHEEL[sel].n)} ↔ {tc(WHEEL[opp].n)}
          </text>
        </g>
      ) : (
        <g>
          <text x="340" y="90" textAnchor="middle" fontSize="40">
            {WHEEL[sel].warm ? '☀️' : '🧊'}
          </text>
          <text x="340" y="140" textAnchor="middle" fontSize="18" fontWeight="800" fill={WHEEL[sel].c}>
            {tc(WHEEL[sel].n)}
          </text>
          <text x="340" y="170" textAnchor="middle" fontSize="15" fontWeight="700" fill={INK}>
            {WHEEL[sel].warm ? tc('тёплый цвет') : tc('холодный цвет')}
          </text>
        </g>
      )}
    </Scene>
  );
}

// ---------------- Light and shadow ----------------

/** Move the lamp: the ball gets its own shadow on the far side and drops a shadow on the table. */
export function LightShadow({ tc, cube = false }: { tc: Tc; cube?: boolean }) {
  const { pos, get } = useDrag<'lamp'>({ lamp: { x: 90, y: 50 } });
  const L = pos.lamp;
  const C = { x: 260, y: 140 };
  const dx = C.x - L.x;
  const dy = C.y - L.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  // light spot on the ball faces the lamp
  const hx = 50 - ux * 30;
  const hy = 50 - uy * 30;
  const shadowLen = Math.max(30, 160 * (1 - Math.min(1, (190 - L.y) / 190)) + 40);
  const sx = C.x + ux * shadowLen * 0.8;
  return (
    <Scene
      title={tc(cube ? 'Свет и тень на кубе' : 'Свет и тень')}
      h={240}
      notes={[tc('Перетащи лампу. Сторона к свету светлая, от света тёмная: это собственная тень.'), tc('На столе появляется падающая тень. Чем ниже лампа, тем длиннее тень.')]}
    >
      <defs>
        <radialGradient id="ball-light" cx={`${hx}%`} cy={`${hy}%`} r="75%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.45" stopColor="#c9a7e8" />
          <stop offset="0.85" stopColor="#5b3d82" />
          <stop offset="1" stopColor="#7d5aa6" />
        </radialGradient>
      </defs>
      <rect x="0" y="180" width="460" height="60" fill="#f4e6d7" />
      <ellipse cx={(C.x + sx) / 2 + 10} cy="186" rx={Math.abs(sx - C.x) / 2 + 40} ry="10" fill="#34404f" opacity="0.22" />
      {cube ? (
        <g>
          <path d="M215 95 L265 80 L305 95 L255 110z" fill={uy < 0.2 ? '#cbb6e3' : '#e9e0f5'} stroke={INK} />
          <path d="M215 95 L255 110 L255 182 L215 165z" fill={ux > 0 ? '#e9e0f5' : '#7d5aa6'} stroke={INK} />
          <path d="M255 110 L305 95 L305 165 L255 182z" fill={ux > 0 ? '#7d5aa6' : '#e9e0f5'} stroke={INK} />
        </g>
      ) : (
        <circle cx={C.x} cy={C.y} r="42" fill="url(#ball-light)" />
      )}
      <line x1={L.x} y1={L.y} x2={C.x} y2={C.y} stroke="#f7d046" strokeWidth="2" strokeDasharray="4 6" opacity="0.7" />
      <g {...get('lamp')}>
        <circle r="26" fill="#fff6c9" opacity="0.6" />
        <text y="10" textAnchor="middle" fontSize="30">
          💡
        </text>
      </g>
    </Scene>
  );
}

// ---------------- Hatching ----------------

/** Hatching: lines close or far apart, at an angle, crossed for darker tone. */
export function Hatching({ tc }: { tc: Tc }) {
  const [gap, setGap] = useState(10);
  const [angle, setAngle] = useState(45);
  const [cross, setCross] = useState(false);
  const lines = (a: number) => {
    const out = [];
    for (let i = -300; i < 300; i += gap) out.push(<line key={`${a}${i}`} x1={i} y1={-300} x2={i} y2={300} transform={`rotate(${a})`} />);
    return out;
  };
  return (
    <Scene
      title={tc('Штриховка')}
      h={220}
      notes={[tc('Чем ближе штрихи, тем темнее. Перекрёстная штриховка ещё темнее.'), tc('Штрихи кладут по форме предмета и в одну сторону.')]}
      controls={
        <>
          <Slider label={tc('Расстояние между штрихами')} value={gap} min={4} max={24} onChange={setGap} />
          <Slider label={tc('Наклон')} value={angle} min={0} max={180} onChange={setAngle} />
          <Choices
            items={[
              ['one', tc('Обычная')],
              ['cross', tc('Перекрёстная')],
            ]}
            value={cross ? 'cross' : 'one'}
            onChange={(v) => setCross(v === 'cross')}
          />
        </>
      }
    >
      <defs>
        <clipPath id="hatch-clip">
          <rect x="40" y="30" width="170" height="160" rx="14" />
        </clipPath>
        <clipPath id="hatch-ball">
          <circle cx="330" cy="110" r="72" />
        </clipPath>
      </defs>
      <rect x="40" y="30" width="170" height="160" rx="14" fill="#fffdf6" stroke="#f2d9cc" />
      <g clipPath="url(#hatch-clip)" stroke={INK} strokeWidth="1.3" transform="translate(125 110)">
        {lines(angle)}
        {cross && lines(angle + 90)}
      </g>
      <circle cx="330" cy="110" r="72" fill="#fffdf6" stroke={INK} strokeWidth="1.5" />
      <g clipPath="url(#hatch-ball)" stroke={INK} strokeWidth="1.3">
        <g transform="translate(370 140)" opacity="0.9">
          {lines(angle)}
          {cross && lines(angle + 90)}
        </g>
        <circle cx="305" cy="85" r="34" fill="#fffdf6" stroke="none" />
      </g>
    </Scene>
  );
}

// ---------------- Perspective ----------------

/** Drag the horizon and the vanishing point: the road and the poles follow it. */
export function Perspective({ tc, two = false }: { tc: Tc; two?: boolean }) {
  const { pos, get } = useDrag<'vp' | 'vp2'>({ vp: { x: two ? 60 : 230, y: 100 }, vp2: { x: 400, y: 100 } }, (id, p) => ({ x: Math.max(20, Math.min(440, p.x)), y: Math.max(40, Math.min(170, p.y)) }));
  const V = pos.vp;
  const hy = V.y;
  if (two) {
    const V2 = { x: pos.vp2.x, y: hy };
    const cx = 230;
    const top = hy - 70;
    const bot = hy + 70;
    const toward = (P: { x: number; y: number }, y: number, t: number) => ({ x: cx + (P.x - cx) * t, y: y + (P.y - y) * t });
    const l1 = toward(V, top, 0.45);
    const l2 = toward(V, bot, 0.45);
    const r1 = toward(V2, top, 0.4);
    const r2 = toward(V2, bot, 0.4);
    return (
      <Scene title={tc('Перспектива с двумя точками')} h={240} notes={[tc('Угол дома ближе всего к нам. Его стены уходят к двум точкам на линии горизонта.'), tc('Перетащи точки схода и посмотри, как меняется дом.')]}>
        <rect width="460" height={hy} fill="#e3f2fc" />
        <rect y={hy} width="460" height={240 - hy} fill="#e8f3df" />
        <line x1="0" x2="460" y1={hy} y2={hy} stroke="#e07a3f" strokeWidth="1.5" strokeDasharray="6 4" />
        <g stroke="#9aa7b5" strokeDasharray="3 4">
          {[top, bot].map((y) => (
            <g key={y}>
              <line x1={cx} y1={y} x2={V.x} y2={hy} />
              <line x1={cx} y1={y} x2={V2.x} y2={hy} />
            </g>
          ))}
        </g>
        <path d={`M${cx} ${top} L${l1.x} ${l1.y} L${l2.x} ${l2.y} L${cx} ${bot}z`} fill="#f4b391" stroke={INK} strokeWidth="2" />
        <path d={`M${cx} ${top} L${r1.x} ${r1.y} L${r2.x} ${r2.y} L${cx} ${bot}z`} fill="#f7cdb4" stroke={INK} strokeWidth="2" />
        {[V, V2].map((P, i) => (
          <g key={i} {...get(i ? 'vp2' : 'vp')}>
            <circle r="10" fill="#e07a3f" stroke="#fff" strokeWidth="2" />
          </g>
        ))}
      </Scene>
    );
  }
  const poles = [0.15, 0.3, 0.5, 0.75, 1];
  return (
    <Scene
      title={tc('Перспектива: даль меньше')}
      h={240}
      notes={[tc('Все линии дороги сходятся в одну точку на линии горизонта.'), tc('Перетащи оранжевую точку: горизонт поднимется или опустится, столбы изменятся.')]}
    >
      <rect width="460" height={hy} fill="#e3f2fc" />
      <rect y={hy} width="460" height={240 - hy} fill="#e8f3df" />
      <path d={`M${V.x} ${hy} L130 240 L330 240z`} fill="#c9ccd3" />
      <path d={`M${V.x} ${hy} L230 240`} stroke="#fff" strokeWidth="3" strokeDasharray="10 10" />
      <line x1="0" x2="460" y1={hy} y2={hy} stroke="#e07a3f" strokeWidth="1.5" strokeDasharray="6 4" />
      {poles.map((t) => {
        const x = V.x + (360 - V.x) * t;
        const yb = hy + (240 - hy) * t - 4;
        const h = 90 * t;
        return (
          <g key={t}>
            <line x1={x} y1={yb} x2={x} y2={yb - h} stroke="#8b5a2b" strokeWidth={Math.max(1, 5 * t)} />
            <circle cx={x} cy={yb - h} r={Math.max(1.5, 6 * t)} fill="#f7d046" />
          </g>
        );
      })}
      {poles.map((t) => {
        const x = V.x + (80 - V.x) * t;
        const yb = hy + (240 - hy) * t - 4;
        return <text key={t} x={x} y={yb} fontSize={40 * t + 4} textAnchor="middle">🌳</text>;
      })}
      <g {...get('vp')}>
        <circle r="10" fill="#e07a3f" stroke="#fff" strokeWidth="2" />
      </g>
    </Scene>
  );
}

// ---------------- Composition: rule of thirds ----------------

/** Move the sun and the tree: on the crossings of the thirds lines the picture looks lively. */
export function ThirdsGrid({ tc }: { tc: Tc }) {
  const W = 420;
  const H = 230;
  const pts = [1, 2].flatMap((i) => [1, 2].map((j) => ({ x: 20 + (W / 3) * i, y: 5 + (H / 3) * j })));
  const snap = (p: { x: number; y: number }) => pts.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 24) ?? p;
  const { pos, get } = useDrag<'tree' | 'sun'>({ tree: { x: 230, y: 120 }, sun: { x: 120, y: 60 } }, (_, p) => snap(p));
  const on = (p: { x: number; y: number }) => pts.some((q) => q.x === p.x && q.y === p.y);
  return (
    <Scene
      title={tc('Правило третей')}
      w={460}
      h={240}
      notes={[tc('Раздели картинку на три части по ширине и высоте.'), tc('Перетащи дерево и солнце на пересечения линий: так картина живее, чем когда всё в середине.')]}
      controls={on(pos.tree) && on(pos.sun) ? <Say>✨ {tc('Отлично! Главное стоит на сильных точках.')}</Say> : undefined}
    >
      <rect x="20" y="5" width={W} height={H} rx="10" fill="#e9f6ff" />
      <rect x="20" y={5 + H * 0.66} width={W} height={H * 0.34} fill="#cfe8bd" />
      <g stroke="#e07a3f" strokeDasharray="5 5" strokeWidth="1.2">
        {[1, 2].map((i) => (
          <g key={i}>
            <line x1={20 + (W / 3) * i} x2={20 + (W / 3) * i} y1="5" y2={5 + H} />
            <line y1={5 + (H / 3) * i} y2={5 + (H / 3) * i} x1="20" x2={20 + W} />
          </g>
        ))}
      </g>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="7" fill="none" stroke="#e07a3f" strokeWidth="2" />
      ))}
      <g {...get('sun')}>
        <circle r="22" fill="#f7d046" />
      </g>
      <g {...get('tree')}>
        <rect x="-6" y="0" width="12" height="44" fill="#8b5a2b" />
        <circle r="30" cy="-6" fill="#5cb85c" />
      </g>
    </Scene>
  );
}

// ---------------- Mood with colour ----------------

const MOODS = {
  joy: { name: 'Радость', sky: ['#ffd66b', '#ffb37a'], hill: '#9fd38a', sun: '#ff7a3d' },
  calm: { name: 'Спокойствие', sky: ['#bfe3f7', '#e9f6ff'], hill: '#8fc9b4', sun: '#fff3b0' },
  sad: { name: 'Грусть', sky: ['#9aa7b5', '#c9d1db'], hill: '#7c8a8a', sun: '#d7dbe0' },
  storm: { name: 'Тревога', sky: ['#3b3f5c', '#6d5a7a'], hill: '#4b5d4b', sun: '#f2f2f2' },
  sunset: { name: 'Закат', sky: ['#7b4fa8', '#f39c7e'], hill: '#5b3d5a', sun: '#ffcf6b' },
} as const;

/** One landscape, different palettes: colour changes the mood of a picture. */
export function MoodPalette({ tc }: { tc: Tc }) {
  const [m, setM] = useState<keyof typeof MOODS>('joy');
  const p = MOODS[m];
  return (
    <Scene
      title={tc('Настроение цветом')}
      h={220}
      notes={[tc('Один и тот же пейзаж, но разные краски.'), tc('Яркие тёплые цвета радуют, серые грустят, тёмные тревожат.')]}
      controls={<Choices items={Object.entries(MOODS).map(([k, v]) => [k, tc(v.name)] as [string, string])} value={m} onChange={(v) => setM(v as keyof typeof MOODS)} />}
    >
      <defs>
        <linearGradient id="mood-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="460" height="220" rx="14" fill="url(#mood-sky)" style={{ transition: 'all .6s' }} />
      <circle cx="340" cy={m === 'sunset' ? 150 : 60} r="30" fill={p.sun} style={{ transition: 'all .6s' }} />
      <path d="M0 160 Q110 110 220 150 T460 140 V220 H0z" fill={p.hill} style={{ transition: 'all .6s' }} />
      <path d="M0 190 Q140 160 260 190 T460 185 V220 H0z" fill={p.hill} opacity="0.7" style={{ transition: 'all .6s' }} />
      {m === 'storm' && <path d="M120 40 L105 80 L122 80 L110 115" stroke="#f7d046" strokeWidth="4" fill="none" />}
      {m === 'sad' && [60, 140, 220, 300, 380].map((x) => <line key={x} x1={x} y1="20" x2={x - 10} y2="60" stroke="#6b7a90" strokeWidth="2" />)}
    </Scene>
  );
}

// ---------------- Watercolour: wet and dry ----------------

/** Drop paint on wet or dry paper: on wet paper the colour spreads softly. */
export function WatercolorWash({ tc }: { tc: Tc }) {
  const [wet, setWet] = useState(true);
  const [color, setColor] = useState(PAINTS[4]);
  const [drops, setDrops] = useState<{ x: number; y: number; c: string; wet: boolean; t: number }[]>([]);
  useTicker(drops.some((d) => d.t < 1), (dt) => setDrops((s) => s.map((d) => ({ ...d, t: Math.min(1, d.t + dt * 0.8) }))));
  return (
    <Scene
      title={tc('Акварель: по-мокрому и по-сухому')}
      h={220}
      notes={[tc('Нажми на бумагу, чтобы капнуть краской.'), tc('По мокрой бумаге краска растекается мягко, по сухой оставляет чёткий край.')]}
      controls={
        <>
          <Choices
            items={[
              ['wet', `💧 ${tc('Мокрая бумага')}`],
              ['dry', `📄 ${tc('Сухая бумага')}`],
            ]}
            value={wet ? 'wet' : 'dry'}
            onChange={(v) => setWet(v === 'wet')}
          />
          <div className="easel-paints">
            {PAINTS.slice(0, 8).map((c) => (
              <button key={c} type="button" aria-label={c} className={c === color ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
          <button type="button" className="fchip" onClick={() => setDrops([])}>
            🗑 {tc('Новый лист')}
          </button>
        </>
      }
    >
      <defs>
        <filter id="wet-bleed" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="18" />
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="dry-edge">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
      </defs>
      <rect
        x="20"
        y="10"
        width="420"
        height="200"
        rx="10"
        fill={wet ? '#eef6fb' : '#fffdf6'}
        stroke="#e5e0d8"
        style={{ cursor: 'crosshair' }}
        onPointerDown={(e) => {
          const p = svgPoint(e);
          setDrops((s) => [...s.slice(-30), { x: p.x, y: p.y, c: color, wet, t: 0 }]);
        }}
      />
      {drops.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.wet ? 14 + 26 * d.t : 18}
          fill={d.c}
          opacity={d.wet ? 0.55 - 0.15 * d.t : 0.7}
          filter={d.wet ? 'url(#wet-bleed)' : 'url(#dry-edge)'}
          pointerEvents="none"
        />
      ))}
    </Scene>
  );
}

// ---------------- Face and emotions ----------------

const EMO = {
  joy: { name: 'Радость', brow: -2, mouth: 14, eye: 1 },
  sad: { name: 'Грусть', brow: 6, mouth: -10, eye: 0.8 },
  angry: { name: 'Злость', brow: -8, mouth: -4, eye: 0.7 },
  wow: { name: 'Удивление', brow: -10, mouth: 0, eye: 1.3 },
  calm: { name: 'Спокойствие', brow: 0, mouth: 4, eye: 0.6 },
} as const;

/** A face with proportion lines; brows and mouth change the emotion. */
export function FaceBuilder({ tc }: { tc: Tc }) {
  const [e, setE] = useState<keyof typeof EMO>('joy');
  const [guides, setGuides] = useState(true);
  const f = EMO[e];
  const tilt = e === 'angry' ? 1 : e === 'sad' ? -1 : 0;
  return (
    <Scene
      title={tc('Лицо: пропорции и эмоции')}
      h={240}
      notes={[tc('Глаза стоят посередине головы, нос посередине между глазами и подбородком, рот чуть выше середины между носом и подбородком.'), tc('Брови и рот сильнее всего меняют эмоцию.')]}
      controls={
        <>
          <Choices items={Object.entries(EMO).map(([k, v]) => [k, tc(v.name)] as [string, string])} value={e} onChange={(v) => setE(v as keyof typeof EMO)} />
          <Choices
            items={[
              ['on', tc('С линиями')],
              ['off', tc('Без линий')],
            ]}
            value={guides ? 'on' : 'off'}
            onChange={(v) => setGuides(v === 'on')}
          />
        </>
      }
    >
      <g transform="translate(230 125)">
        <ellipse rx="80" ry="100" fill="#f7d2b4" stroke={INK} strokeWidth="2" />
        <path d="M-80 -20 C -90 -110, 90 -110, 80 -20 C 70 -70, -70 -70, -80 -20z" fill="#8b5a2b" />
        <ellipse cx="-82" cy="8" rx="9" ry="18" fill="#f7d2b4" stroke={INK} strokeWidth="1.5" />
        <ellipse cx="82" cy="8" rx="9" ry="18" fill="#f7d2b4" stroke={INK} strokeWidth="1.5" />
        {guides && (
          <g stroke="#e07a3f" strokeDasharray="4 4" strokeWidth="1">
            <line x1="-95" x2="95" y1="0" y2="0" />
            <line x1="-80" x2="80" y1="50" y2="50" />
            <line x1="-70" x2="70" y1="72" y2="72" />
            <line x1="0" x2="0" y1="-100" y2="100" />
          </g>
        )}
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={s * 32} cy="0" rx="13" ry={9 * f.eye} fill="#fff" stroke={INK} strokeWidth="1.5" />
            <circle cx={s * 32} cy="0" r={5 * Math.min(1, f.eye)} fill={INK} />
            <line x1={s * 20} x2={s * 46} y1={-18 + f.brow * tilt * s * 0.5 + (tilt === 0 ? f.brow : 0)} y2={-18 - f.brow * tilt * s * 0.5 + (tilt === 0 ? f.brow : 0) + (e === 'sad' ? -6 : 0)} stroke={INK} strokeWidth="4" strokeLinecap="round" style={{ transition: 'all .3s' }} />
          </g>
        ))}
        <path d="M0 12 L-8 46 L8 46" fill="none" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        {e === 'wow' ? <ellipse cx="0" cy="72" rx="12" ry="15" fill="#b2433d" stroke={INK} /> : <path d={`M-26 70 Q0 ${70 + f.mouth * 1.6} 26 70`} stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" style={{ transition: 'all .3s' }} />}
      </g>
    </Scene>
  );
}

// ---------------- Figure in motion ----------------

type Joint = 'head' | 'hand1' | 'hand2' | 'foot1' | 'foot2' | 'hip';

/** A wooden mannequin: drag hands, feet, head and hips to make a pose. */
export function FigurePose({ tc }: { tc: Tc }) {
  const start: Record<Joint, { x: number; y: number }> = { head: { x: 230, y: 45 }, hip: { x: 230, y: 140 }, hand1: { x: 180, y: 130 }, hand2: { x: 280, y: 130 }, foot1: { x: 205, y: 220 }, foot2: { x: 255, y: 220 } };
  const { pos, setPos, get } = useDrag<Joint>(start);
  const neck = { x: (pos.head.x * 2 + pos.hip.x) / 3, y: pos.head.y + 22 };
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }, bend: number) => ({ x: (a.x + b.x) / 2 + bend, y: (a.y + b.y) / 2 });
  const limbs: [{ x: number; y: number }, Joint, number][] = [
    [neck, 'hand1', -10],
    [neck, 'hand2', 10],
    [pos.hip, 'foot1', -6],
    [pos.hip, 'foot2', 6],
  ];
  const POSES: Record<string, Record<Joint, { x: number; y: number }>> = {
    run: { head: { x: 250, y: 45 }, hip: { x: 230, y: 140 }, hand1: { x: 175, y: 100 }, hand2: { x: 300, y: 145 }, foot1: { x: 170, y: 200 }, foot2: { x: 290, y: 215 } },
    jump: { head: { x: 230, y: 30 }, hip: { x: 230, y: 120 }, hand1: { x: 170, y: 20 }, hand2: { x: 290, y: 20 }, foot1: { x: 190, y: 190 }, foot2: { x: 270, y: 190 } },
    dance: { head: { x: 215, y: 50 }, hip: { x: 240, y: 140 }, hand1: { x: 160, y: 50 }, hand2: { x: 300, y: 110 }, foot1: { x: 230, y: 225 }, foot2: { x: 310, y: 180 } },
  };
  return (
    <Scene
      title={tc('Фигура в движении')}
      h={240}
      notes={[tc('Перетащи голову, руки, ноги и бёдра, чтобы человечек двигался.'), tc('Красная линия действия показывает главное движение позы.')]}
      controls={
        <div className="chips-row md-choices">
          {Object.keys(POSES).map((k) => (
            <button key={k} type="button" className="fchip" onClick={() => setPos(POSES[k])}>
              {k === 'run' ? `🏃 ${tc('Бег')}` : k === 'jump' ? `🤸 ${tc('Прыжок')}` : `💃 ${tc('Танец')}`}
            </button>
          ))}
          <button type="button" className="fchip" onClick={() => setPos(start)}>
            ↻ {tc('Стоя')}
          </button>
        </div>
      }
    >
      <line x1="0" x2="460" y1="232" y2="232" stroke="#cfe8bd" strokeWidth="6" />
      <path d={`M${pos.head.x} ${pos.head.y} Q${neck.x} ${(neck.y + pos.hip.y) / 2} ${pos.hip.x} ${pos.hip.y} T ${pos.foot1.x} ${pos.foot1.y}`} stroke="#e5534b" strokeWidth="3" fill="none" strokeDasharray="6 5" opacity="0.7" />
      <line x1={neck.x} y1={neck.y} x2={pos.hip.x} y2={pos.hip.y} stroke="#d6a66b" strokeWidth="14" strokeLinecap="round" />
      {limbs.map(([from, j, b]) => {
        const m = mid(from, pos[j], b);
        return <path key={j} d={`M${from.x} ${from.y} L${m.x} ${m.y} L${pos[j].x} ${pos[j].y}`} stroke="#e2b783" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
      })}
      {(Object.keys(start) as Joint[]).map((j) => (
        <g key={j} {...get(j)}>
          <circle r={j === 'head' ? 20 : j === 'hip' ? 10 : 8} fill={j === 'head' ? '#f0c99a' : '#e07a3f'} stroke={INK} strokeWidth="1.5" />
        </g>
      ))}
    </Scene>
  );
}

// ---------------- Character maker ----------------

/** Pick a silhouette, colours and eyes: shapes tell the character (round kind, square strong, triangle sly). */
export function CharacterMaker({ tc }: { tc: Tc }) {
  const [shape, setShape] = useState<'round' | 'square' | 'tri'>('round');
  const [color, setColor] = useState(PAINTS[6]);
  const [eyes, setEyes] = useState<'big' | 'calm' | 'sly'>('big');
  const body = shape === 'round' ? <circle cx="230" cy="125" r="70" fill={color} stroke={INK} strokeWidth="3" /> : shape === 'square' ? <rect x="160" y="55" width="140" height="140" rx="18" fill={color} stroke={INK} strokeWidth="3" /> : <path d="M230 40 L310 200 L150 200z" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />;
  const ey = shape === 'tri' ? 140 : 110;
  const say = shape === 'round' ? 'Круглый персонаж кажется добрым и милым.' : shape === 'square' ? 'Квадратный персонаж кажется сильным и надёжным.' : 'Треугольный персонаж кажется хитрым или опасным.';
  return (
    <Scene
      title={tc('Придумай персонажа')}
      h={230}
      notes={[tc(say), tc('Узнаваемый персонаж понятен даже по чёрному силуэту.')]}
      controls={
        <>
          <Choices
            items={[
              ['round', `⚪ ${tc('Круг')}`],
              ['square', `⬜ ${tc('Квадрат')}`],
              ['tri', `🔺 ${tc('Треугольник')}`],
            ]}
            value={shape}
            onChange={setShape}
          />
          <Choices
            items={[
              ['big', tc('Большие глаза')],
              ['calm', tc('Спокойные глаза')],
              ['sly', tc('Хитрые глаза')],
            ]}
            value={eyes}
            onChange={setEyes}
          />
          <div className="easel-paints">
            {PAINTS.slice(0, 9).map((c) => (
              <button key={c} type="button" aria-label={c} className={c === color ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </>
      }
    >
      {body}
      {[-1, 1].map((s) =>
        eyes === 'big' ? (
          <g key={s}>
            <circle cx={230 + s * 24} cy={ey} r="17" fill="#fff" stroke={INK} strokeWidth="2" />
            <circle cx={230 + s * 24 + 3} cy={ey + 3} r="8" fill={INK} />
            <circle cx={230 + s * 24 + 6} cy={ey} r="3" fill="#fff" />
          </g>
        ) : eyes === 'calm' ? (
          <path key={s} d={`M${230 + s * 24 - 10} ${ey} Q${230 + s * 24} ${ey + 8} ${230 + s * 24 + 10} ${ey}`} stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <g key={s}>
            <path d={`M${230 + s * 24 - 12} ${ey} L${230 + s * 24 + 12} ${ey}`} stroke={INK} strokeWidth="3" />
            <path d={`M${230 + s * 24 - 12} ${ey - 10} L${230 + s * 24 + 12} ${ey - 4 * s * -1 - 6}`} stroke={INK} strokeWidth="3" />
            <circle cx={230 + s * 24 + 4} cy={ey + 4} r="4" fill={INK} />
          </g>
        ),
      )}
      <path d={`M210 ${ey + 34} Q230 ${ey + (eyes === 'sly' ? 38 : 50)} 250 ${ey + 34}`} stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <g transform="translate(400 80) scale(0.4) translate(-230 -125)" opacity="0.9">
        {shape === 'round' ? <circle cx="230" cy="125" r="70" fill={INK} /> : shape === 'square' ? <rect x="160" y="55" width="140" height="140" rx="18" fill={INK} /> : <path d="M230 40 L310 200 L150 200z" fill={INK} />}
      </g>
      <text x="400" y="150" textAnchor="middle" fontSize="12" fill={INK}>
        {tc('силуэт')}
      </text>
    </Scene>
  );
}

// ---------------- Comics ----------------

/** A comic page: choose a layout and drag the speech bubbles to the heroes. */
export function ComicPanel({ tc }: { tc: Tc }) {
  const [layout, setLayout] = useState<'3' | '4'>('3');
  const { pos, get } = useDrag<'b1' | 'b2'>({ b1: { x: 90, y: 40 }, b2: { x: 370, y: 40 } });
  const frames = layout === '3' ? [[20, 20, 130, 190], [160, 20, 140, 190], [310, 20, 130, 190]] : [[20, 20, 205, 90], [235, 20, 205, 90], [20, 120, 205, 90], [235, 120, 205, 90]];
  return (
    <Scene
      title={tc('Комикс: кадры и пузыри')}
      h={230}
      notes={[tc('Комикс читают слева направо и сверху вниз.'), tc('Перетащи пузыри к героям: хвостик пузыря показывает, кто говорит.')]}
      controls={
        <Choices
          items={[
            ['3', tc('3 кадра')],
            ['4', tc('4 кадра')],
          ]}
          value={layout}
          onChange={setLayout}
        />
      }
    >
      {frames.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={['#fff6e6', '#eef8f3', '#e9f6ff', '#f6efff'][i]} stroke={INK} strokeWidth="3" />
          <text x={x + 8} y={y + 18} fontSize="12" fontWeight="800" fill={INK}>
            {i + 1}
          </text>
          <text x={x + w / 2} y={y + h - 14} textAnchor="middle" fontSize={layout === '3' ? 44 : 34}>
            {['🐶', '🐱', '🎉', '🍰'][i]}
          </text>
        </g>
      ))}
      {(['b1', 'b2'] as const).map((b, i) => (
        <g key={b} {...get(b)}>
          <ellipse rx="52" ry="22" fill="#fff" stroke={INK} strokeWidth="2" />
          <path d="M-10 18 L-18 40 L6 20" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <rect x="-12" y="14" width="22" height="8" fill="#fff" />
          <text y="5" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
            {i === 0 ? tc('Привет!') : tc('Мяу!')}
          </text>
        </g>
      ))}
    </Scene>
  );
}

// ---------------- Animation: flipbook ----------------

/** A bouncing ball in frames: play it or step frame by frame. */
export function Flipbook({ tc }: { tc: Tc }) {
  const N = 12;
  const [f, setF] = useState(0);
  const [play, setPlay] = useState(false);
  const [onion, setOnion] = useState(true);
  const acc = useRef(0);
  useTicker(play, (dt) => {
    acc.current += dt;
    if (acc.current > 1 / 10) {
      acc.current = 0;
      setF((x) => (x + 1) % N);
    }
  });
  const ball = (i: number) => {
    const t = i / N;
    const y = 190 - 150 * Math.abs(Math.sin(Math.PI * t));
    const squash = y > 180 ? 1.3 : 1;
    return { x: 60 + t * 340, y, sx: squash, sy: 1 / squash };
  };
  const b = ball(f);
  return (
    <Scene
      title={tc('Мультфильм из кадров')}
      h={230}
      notes={[tc('Мультик это много рисунков, которые быстро сменяют друг друга.'), tc('Когда мяч ударяется о землю, он сплющивается: так движение живее.')]}
      controls={
        <>
          <div className="chips-row md-choices">
            <button type="button" className="fchip" onClick={() => setPlay(!play)}>
              {play ? `⏸ ${tc('Стоп')}` : `▶ ${tc('Запустить')}`}
            </button>
            <button type="button" className="fchip" onClick={() => setF((x) => (x + 1) % N)}>
              {tc('Следующий кадр')} →
            </button>
            <button type="button" className={`fchip${onion ? ' on' : ''}`} onClick={() => setOnion(!onion)}>
              {tc('Показать прошлые кадры')}
            </button>
          </div>
          <Slider label={`${tc('Кадр')} ${f + 1} / ${N}`} value={f} min={0} max={N - 1} onChange={(v) => { setPlay(false); setF(v); }} />
        </>
      }
    >
      <rect x="20" y="10" width="420" height="200" rx="10" fill="#fffdf6" stroke="#f2d9cc" />
      <line x1="20" x2="440" y1="212" y2="212" stroke={INK} strokeWidth="3" />
      {onion &&
        [1, 2, 3].map((k) => {
          const o = ball((f - k + N) % N);
          return <circle key={k} cx={o.x} cy={o.y} r="18" fill="#e5534b" opacity={0.25 - k * 0.06} />;
        })}
      <ellipse cx={b.x} cy={b.y + (b.sx > 1 ? 4 : 0)} rx={18 * b.sx} ry={18 * b.sy} fill="#e5534b" stroke={INK} strokeWidth="2" />
    </Scene>
  );
}

// ---------------- Pixel art ----------------

/** Paint squares on a small grid, like in old video games. */
export function PixelArt({ tc }: { tc: Tc }) {
  const N = 12;
  const heart = ['............', '..xx....xx..', '.xxxx..xxxx.', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', '.xxxxxxxxxx.', '..xxxxxxxx..', '...xxxxxx...', '....xxxx....', '.....xx.....', '............'];
  const [cells, setCells] = useState<string[]>(() => Array(N * N).fill(''));
  const [color, setColor] = useState(PAINTS[0]);
  const down = useRef(false);
  const paint = (i: number) => setCells((s) => s.map((c, k) => (k === i ? (color === 'erase' ? '' : color) : c)));
  return (
    <Scene
      title={tc('Пиксель-арт')}
      h={250}
      notes={[tc('Каждый квадратик это пиксель. Нажимай и закрашивай.'), tc('Мало пикселей и мало цветов: так рисовали первые компьютерные игры.')]}
      controls={
        <>
          <div className="easel-paints">
            {PAINTS.slice(0, 9).map((c) => (
              <button key={c} type="button" aria-label={c} className={c === color ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
            <button type="button" className={color === 'erase' ? 'on' : ''} onClick={() => setColor('erase')} aria-label={tc('Ластик')}>
              🧽
            </button>
          </div>
          <div className="chips-row md-choices">
            <button type="button" className="fchip" onClick={() => setCells(heart.join('').split('').map((x) => (x === 'x' ? '#e5534b' : '')))}>
              ❤️ {tc('Пример')}
            </button>
            <button type="button" className="fchip" onClick={() => setCells(Array(N * N).fill(''))}>
              🗑 {tc('Очистить')}
            </button>
          </div>
        </>
      }
    >
      <g transform="translate(110 5)" onPointerLeave={() => (down.current = false)}>
        {cells.map((c, i) => (
          <rect
            key={i}
            x={(i % N) * 20}
            y={Math.floor(i / N) * 20}
            width="20"
            height="20"
            fill={c || ((i + Math.floor(i / N)) % 2 ? '#f6f6f6' : '#fff')}
            stroke="#e3e3e3"
            onPointerDown={(e) => {
              (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
              down.current = true;
              paint(i);
            }}
            onPointerEnter={() => down.current && paint(i)}
            onPointerUp={() => (down.current = false)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </g>
    </Scene>
  );
}

// ---------------- Folk painting ----------------

const FOLK = {
  khokhloma: { name: 'Хохлома', bg: '#1d1d1d', colors: ['#d7261e', '#f2b31c', '#2f7d32'], motif: 'berry' },
  gzhel: { name: 'Гжель', bg: '#ffffff', colors: ['#1f4fa3', '#3b6fc4', '#8fb1e6'], motif: 'rose' },
  gorodets: { name: 'Городец', bg: '#f3c46b', colors: ['#c9302c', '#2a5ea8', '#ffffff'], motif: 'bud' },
} as const;

/** Stamp the motifs of a folk painting on a board. */
export function FolkPattern({ tc }: { tc: Tc }) {
  const [style, setStyle] = useState<keyof typeof FOLK>('khokhloma');
  const [marks, setMarks] = useState<{ x: number; y: number; k: number }[]>([]);
  const st = FOLK[style];
  const motif = (x: number, y: number, k: number) => {
    const c = st.colors[k % st.colors.length];
    if (st.motif === 'berry')
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d="M-20 10 Q0 -10 20 10" stroke={st.colors[2]} strokeWidth="3" fill="none" />
          <ellipse cx="-14" cy="12" rx="8" ry="5" fill={st.colors[2]} transform="rotate(-30 -14 12)" />
          <circle cx="0" cy="-4" r="7" fill={st.colors[0]} />
          <circle cx="9" cy="2" r="6" fill={st.colors[0]} />
          <circle cx="-2" cy="-6" r="2" fill="#fff" opacity="0.7" />
          <path d="M14 -10 q4 6 0 12" stroke={st.colors[1]} strokeWidth="2.5" fill="none" />
        </g>
      );
    if (st.motif === 'rose')
      return (
        <g transform={`translate(${x} ${y})`}>
          <circle r="16" fill={st.colors[2]} />
          <path d="M-12 0 Q0 -18 12 0 Q0 14 -12 0" fill={c} />
          <circle r="5" fill={st.colors[0]} />
          <path d="M16 6 q10 4 14 -4" stroke={st.colors[0]} strokeWidth="2" fill="none" />
        </g>
      );
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r="16" fill={c === '#ffffff' ? st.colors[0] : c} />
        <path d="M-10 -2 Q0 -12 10 -2" stroke="#fff" strokeWidth="2.5" fill="none" />
        <path d="M-7 4 Q0 -4 7 4" stroke="#fff" strokeWidth="2" fill="none" />
        <circle r="3" fill="#1d1d1d" cy="6" />
        <ellipse cx="-22" cy="8" rx="9" ry="4" fill="#2f7d32" />
      </g>
    );
  };
  return (
    <Scene
      title={tc('Народная роспись')}
      h={230}
      notes={[tc('Выбери роспись и нажимай на доску, чтобы ставить узор.'), tc('Хохлома: красное и золото на чёрном. Гжель: синее на белом. Городец: яркие бутоны на жёлтом.')]}
      controls={
        <>
          <Choices
            items={Object.entries(FOLK).map(([k, v]) => [k, tc(v.name)] as [string, string])}
            value={style}
            onChange={(v) => {
              setStyle(v as keyof typeof FOLK);
              setMarks([]);
            }}
          />
          <button type="button" className="fchip" onClick={() => setMarks([])}>
            🗑 {tc('Очистить')}
          </button>
        </>
      }
    >
      <path
        d="M40 20 H420 Q440 20 440 40 V190 Q440 210 420 210 H40 Q20 210 20 190 V40 Q20 20 40 20z"
        fill={st.bg}
        stroke={INK}
        strokeWidth="2"
        style={{ cursor: 'copy' }}
        onPointerDown={(e) => {
          const p = svgPoint(e);
          setMarks((s) => [...s.slice(-40), { x: p.x, y: p.y, k: s.length }]);
        }}
      />
      <rect x="28" y="28" width="404" height="174" rx="16" fill="none" stroke={st.colors[1]} strokeWidth="3" strokeDasharray="10 6" pointerEvents="none" />
      <g pointerEvents="none">{marks.map((m, i) => <g key={i}>{motif(m.x, m.y, m.k)}</g>)}</g>
      {!marks.length && (
        <g pointerEvents="none" opacity="0.9">
          {motif(130, 110, 0)}
          {motif(230, 110, 1)}
          {motif(330, 110, 2)}
        </g>
      )}
    </Scene>
  );
}

// ---------------- Layers in digital drawing ----------------

/** Layers: switch them on and off and change their order. */
export function Layers({ tc }: { tc: Tc }) {
  const ALL = { sky: 'Небо', hills: 'Холмы', house: 'Домик', shadow: 'Тень', sun: 'Солнце' } as const;
  type L = keyof typeof ALL;
  const [order, setOrder] = useState<L[]>(['sky', 'sun', 'hills', 'house', 'shadow']);
  const [hidden, setHidden] = useState<L[]>([]);
  const draw: Record<L, ReactNode> = {
    sky: <rect width="300" height="220" fill="#bfe3f7" />,
    sun: <circle cx="230" cy="60" r="30" fill="#f7d046" />,
    hills: <path d="M0 150 Q80 100 160 150 T300 140 V220 H0z" fill="#9fd38a" />,
    house: (
      <g>
        <rect x="90" y="110" width="80" height="60" fill="#f4b391" stroke={INK} strokeWidth="2" />
        <path d="M80 112 L130 70 L180 112z" fill="#c9302c" stroke={INK} strokeWidth="2" />
        <rect x="120" y="135" width="20" height="35" fill="#8b5a2b" />
      </g>
    ),
    shadow: <path d="M90 170 L170 170 L230 190 L140 192z" fill="#34404f" opacity="0.25" />,
  };
  const move = (i: number, d: number) =>
    setOrder((o) => {
      const j = i + d;
      if (j < 0 || j >= o.length) return o;
      const n = [...o];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  return (
    <Scene
      title={tc('Слои')}
      w={460}
      h={220}
      notes={[tc('В цифровом рисунке каждая часть может лежать на своём слое, как прозрачные плёнки.'), tc('Выключи слой глазиком или подними его выше. Верхний слой закрывает нижние.')]}
    >
      <g transform="translate(0 0)">{order.map((l) => !hidden.includes(l) && <g key={l}>{draw[l]}</g>)}</g>
      <g transform="translate(310 6)">
        {[...order].reverse().map((l, ri) => {
          const i = order.length - 1 - ri;
          const off = hidden.includes(l);
          return (
            <g key={l} transform={`translate(0 ${ri * 42})`}>
              <rect width="145" height="36" rx="8" fill={off ? '#f2f2f2' : '#fff'} stroke="#d9d2ec" />
              <text x="10" y="23" fontSize="15" style={{ cursor: 'pointer' }} onClick={() => setHidden((h) => (off ? h.filter((x) => x !== l) : [...h, l]))}>
                {off ? '🚫' : '👁'}
              </text>
              <text x="36" y="23" fontSize="13" fontWeight="700" fill={INK}>
                {tc(ALL[l])}
              </text>
              <text x="112" y="16" fontSize="12" style={{ cursor: 'pointer' }} onClick={() => move(i, 1)}>
                ▲
              </text>
              <text x="112" y="31" fontSize="12" style={{ cursor: 'pointer' }} onClick={() => move(i, -1)}>
                ▼
              </text>
            </g>
          );
        })}
      </g>
    </Scene>
  );
}

// ---------------- Landscape planes ----------------

/** Near, middle and far planes: the farther, the lighter, bluer and smaller. */
export function LandscapePlanes({ tc }: { tc: Tc }) {
  const [air, setAir] = useState(60);
  const fog = air / 100;
  const mix = (c: string, k: number) => `color-mix(in srgb, ${c} ${Math.round(100 - k * 100)}%, #cfe3f2)`;
  return (
    <Scene
      title={tc('Планы в пейзаже')}
      h={220}
      notes={[tc('Передний план ближе всего: он яркий и подробный. Дальний план светлее и голубее.'), tc('Двигай ползунок: так воздух делает даль светлой.')]}
      controls={<Slider label={tc('Воздух и даль')} value={air} min={0} max={90} onChange={setAir} />}
    >
      <rect width="460" height="220" rx="14" fill="#e3f2fc" />
      <path d="M0 110 L60 70 L120 100 L190 55 L260 95 L330 60 L400 92 L460 75 V220 H0z" fill={mix('#5b6c8f', fog * 0.9)} />
      <path d="M0 140 Q90 105 180 135 T360 130 T460 125 V220 H0z" fill={mix('#4f8a5b', fog * 0.5)} />
      {[60, 150, 330, 410].map((x) => (
        <text key={x} x={x} y="140" fontSize="22" textAnchor="middle" opacity={1 - fog * 0.4}>
          🌲
        </text>
      ))}
      <path d="M0 175 Q120 150 240 175 T460 170 V220 H0z" fill="#6dbb5a" />
      <text x="90" y="205" fontSize="48" textAnchor="middle">
        🌳
      </text>
      <text x="380" y="210" fontSize="36" textAnchor="middle">
        🌼
      </text>
      <g fontSize="11" fontWeight="800" fill={INK}>
        <text x="440" y="66" textAnchor="end">{tc('дальний')}</text>
        <text x="440" y="120" textAnchor="end">{tc('средний')}</text>
        <text x="300" y="214">{tc('передний')}</text>
      </g>
    </Scene>
  );
}

// ---------------- Painters ----------------

/** Three painters' styles on the same theme. */
export function PainterStyles({ tc }: { tc: Tc }) {
  const [p, setP] = useState<'vangogh' | 'shishkin' | 'monet'>('vangogh');
  const swirl = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 1 ${r * 2} 0 a${r * 0.6} ${r * 0.6} 0 1 1 ${-r * 1.2} 0`;
  return (
    <Scene
      title={tc('Знаменитые художники')}
      h={220}
      notes={
        p === 'vangogh'
          ? [tc('Ван Гог рисовал крупными закрученными мазками. Небо у него живое и движется.')]
          : p === 'shishkin'
            ? [tc('Шишкин рисовал лес очень подробно и точно, каждую ветку и иголку.')]
            : [tc('Моне рисовал свет и воздух короткими мазками. Вблизи пятна, издали пейзаж.')]
      }
      controls={
        <Choices
          items={[
            ['vangogh', 'Ван Гог'],
            ['shishkin', 'Шишкин'],
            ['monet', 'Моне'],
          ]}
          value={p}
          onChange={setP}
        />
      }
    >
      {p === 'vangogh' && (
        <g>
          <rect width="460" height="220" rx="14" fill="#1f3c88" />
          {[[80, 60, 26], [190, 45, 20], [300, 70, 30], [390, 40, 18]].map(([x, y, r], i) => (
            <path key={i} d={swirl(x, y, r)} stroke={i % 2 ? '#f7d046' : '#8fb7ff'} strokeWidth="6" fill="none" strokeLinecap="round" />
          ))}
          <circle cx="400" cy="45" r="16" fill="#f7d046" />
          <path d="M0 170 Q100 140 200 165 T460 160 V220 H0z" fill="#22355f" />
          <path d="M70 220 C 60 150, 100 110, 80 60 C 110 110, 105 160, 115 220z" fill="#14301f" />
        </g>
      )}
      {p === 'shishkin' && (
        <g>
          <rect width="460" height="220" rx="14" fill="#dfeccf" />
          {[60, 130, 210, 300, 380].map((x, i) => (
            <g key={x}>
              <rect x={x - 5} y="60" width="10" height="150" fill="#7a4e2a" />
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <path key={k} d={`M${x - 30 + k * 2} ${80 + k * 18} L${x} ${60 + k * 18} L${x + 30 - k * 2} ${80 + k * 18}`} stroke="#2f5d32" strokeWidth="3" fill="#3d7a40" />
              ))}
              <text x={x + 12} y="210" fontSize={i === 2 ? 26 : 0}>
                🐻
              </text>
            </g>
          ))}
          <rect y="205" width="460" height="15" fill="#8aa35c" />
        </g>
      )}
      {p === 'monet' && (
        <g>
          <rect width="460" height="220" rx="14" fill="#cfe6f2" />
          {Array.from({ length: 160 }, (_, i) => (
            <ellipse key={i} cx={(i * 47) % 460} cy={110 + ((i * 29) % 110)} rx="9" ry="3" fill={['#7fb0d6', '#a6cfa1', '#e9b7c9', '#f5e19a', '#5d8fc4'][i % 5]} opacity="0.75" />
          ))}
          {[[120, 150], [260, 175], [360, 140]].map(([x, y]) => (
            <g key={x}>
              <ellipse cx={x} cy={y} rx="26" ry="9" fill="#5a9a55" />
              <circle cx={x + 4} cy={y - 4} r="6" fill="#f3a6c0" />
            </g>
          ))}
          <path d="M40 70 Q230 10 420 70" stroke="#6e8f6a" strokeWidth="10" fill="none" />
        </g>
      )}
    </Scene>
  );
}

// ---------------- Water reflections ----------------

/** Reflections in water: calm water mirrors, waves break the reflection into stripes. */
export function WaterReflect({ tc }: { tc: Tc }) {
  const [waves, setWaves] = useState(20);
  const [t, setT] = useState(0);
  useTicker(true, (dt) => setT((x) => x + dt));
  const k = waves / 100;
  return (
    <Scene
      title={tc('Рисуем воду')}
      h={230}
      notes={[tc('Вода отражает то, что над ней, вверх ногами.'), tc('Чем сильнее волны, тем сильнее отражение рвётся на полоски.')]}
      controls={<Slider label={tc('Волны')} value={waves} min={0} max={100} onChange={setWaves} />}
    >
      <rect width="460" height="115" fill="#ffd9a8" />
      <circle cx="320" cy="70" r="26" fill="#ff8c42" />
      <path d="M60 115 L110 60 L160 115z" fill="#5b6c8f" />
      <rect x="200" y="75" width="50" height="40" fill="#f4b391" />
      <path d="M195 77 L225 55 L255 77z" fill="#c9302c" />
      <rect y="115" width="460" height="115" fill="#3f7fb5" />
      {Array.from({ length: 23 }, (_, i) => {
        const y = 118 + i * 5;
        const dx = Math.sin(t * 2 + i * 0.9) * 14 * k;
        return (
          <g key={i} transform={`translate(${dx} 0)`} opacity={0.75 - i * 0.02}>
            <clipPath id={`wr${i}`}>
              <rect x="0" y={y} width="460" height={5 - 4 * k} />
            </clipPath>
            <g clipPath={`url(#wr${i})`}>
              <g transform="translate(0 230) scale(1 -1)">
                <rect y="0" width="460" height="115" fill="#9cc0dc" />
                <circle cx="320" cy="70" r="26" fill="#ff8c42" />
                <path d="M60 115 L110 60 L160 115z" fill="#41506b" />
                <rect x="200" y="75" width="50" height="40" fill="#c98d6a" />
                <path d="M195 77 L225 55 L255 77z" fill="#8f2522" />
              </g>
            </g>
          </g>
        );
      })}
    </Scene>
  );
}

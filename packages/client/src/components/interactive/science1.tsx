import { useMemo, useRef, useState } from 'react';
import { Choices, INK, MINT, ORANGE, PEACH, Say, Scene, SKY, Slider, useDrag, useTicker, type Tc } from './kit';

// ---------------- Atoms and molecules ----------------

const ATOM = { H: { color: '#f1f3f6', r: 14, name: 'водород' }, O: { color: '#e5534b', r: 20, name: 'кислород' }, C: { color: '#3d4450', r: 19, name: 'углерод' } } as const;
type El = keyof typeof ATOM;

/** Build a molecule: drag atoms into the dashed places. */
export function MoleculeBuilder({ tc }: { tc: Tc }) {
  const targets: Record<string, { label: string; slots: { el: El; x: number; y: number }[] }> = {
    water: { label: 'Вода H₂O', slots: [{ el: 'O', x: 330, y: 120 }, { el: 'H', x: 296, y: 150 }, { el: 'H', x: 364, y: 150 }] },
    co2: { label: 'Углекислый газ CO₂', slots: [{ el: 'C', x: 330, y: 125 }, { el: 'O', x: 286, y: 125 }, { el: 'O', x: 374, y: 125 }] },
    o2: { label: 'Кислород O₂', slots: [{ el: 'O', x: 310, y: 125 }, { el: 'O', x: 350, y: 125 }] },
  };
  const [goal, setGoal] = useState<keyof typeof targets>('water');
  const pool: { id: string; el: El; x: number; y: number }[] = [
    { id: 'h1', el: 'H', x: 50, y: 60 },
    { id: 'h2', el: 'H', x: 90, y: 60 },
    { id: 'o1', el: 'O', x: 60, y: 130 },
    { id: 'o2', el: 'O', x: 110, y: 130 },
    { id: 'c1', el: 'C', x: 80, y: 200 },
  ];
  const start = Object.fromEntries(pool.map((a) => [a.id, { x: a.x, y: a.y }])) as Record<string, { x: number; y: number }>;
  const slots = targets[goal].slots;
  const { pos, setPos, get } = useDrag(start, (id, p) => {
    const el = pool.find((a) => a.id === id)!.el;
    const free = slots.find((s) => s.el === el && Math.hypot(s.x - p.x, s.y - p.y) < 34);
    return free ? { x: free.x, y: free.y } : undefined;
  });
  const filled = slots.every((s) => pool.some((a) => a.el === s.el && pos[a.id].x === s.x && pos[a.id].y === s.y));
  return (
    <Scene
      title={tc('Собери молекулу')}
      h={250}
      notes={[tc('Перетащи атомы на пунктирные места.'), tc('Белый шарик это водород, красный кислород, чёрный углерод.')]}
      controls={
        <>
          <Choices
            items={Object.entries(targets).map(([k, v]) => [k, tc(v.label)] as [string, string])}
            value={goal}
            onChange={(g) => {
              setGoal(g as keyof typeof targets);
              setPos(start);
            }}
          />
          {filled && <Say>🎉 {tc('Получилось!')} {tc(targets[goal].label)}</Say>}
        </>
      }
    >
      <rect x="230" y="40" width="200" height="180" rx="20" fill="#f6fbff" stroke={SKY} strokeWidth="2" strokeDasharray="6 6" />
      {slots.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={ATOM[s.el].r + 2} fill="none" stroke="#9aa7b5" strokeDasharray="4 3" />
      ))}
      {pool.map((a) => (
        <g key={a.id} {...get(a.id)}>
          <circle r={ATOM[a.el].r} fill={ATOM[a.el].color} stroke={INK} strokeWidth="1.5" />
          <text y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill={a.el === 'H' ? INK : '#fff'} pointerEvents="none">
            {a.el}
          </text>
        </g>
      ))}
      <text x="330" y="208" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
        {tc(targets[goal].label)}
      </text>
    </Scene>
  );
}

/** Zoom into a drop of water: from a glass to molecules and atoms. */
export function AtomZoom({ tc }: { tc: Tc }) {
  const [zoom, setZoom] = useState(0);
  const steps = ['Стакан воды', 'Капля', 'Молекулы воды', 'Атом: ядро и электроны'];
  return (
    <Scene title={tc('Заглянем внутрь капли')} h={230} notes={[tc('Двигай ползунок: каждый шаг увеличивает в миллионы раз.')]} controls={<Slider label={<b>{tc(steps[zoom])}</b>} value={zoom} min={0} max={3} onChange={setZoom} />}>
      {zoom === 0 && (
        <g>
          <path d="M180 40h100l-12 160h-76z" fill="#e6f4fb" stroke="#8fb8cf" strokeWidth="3" />
          <path d="M186 90h88l-8 108h-72z" fill="#9fd3ef" />
        </g>
      )}
      {zoom === 1 && <path d="M230 40c40 60 60 90 60 120a60 60 0 0 1-120 0c0-30 20-60 60-120z" fill="#9fd3ef" stroke="#5aa6cf" strokeWidth="3" />}
      {zoom === 2 &&
        Array.from({ length: 12 }, (_, i) => {
          const x = 100 + (i % 4) * 85 + (i % 2) * 10;
          const y = 50 + Math.floor(i / 4) * 60;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${i * 37})`}>
              <circle r="16" fill="#e5534b" />
              <circle cx="-16" cy="12" r="10" fill="#f1f3f6" stroke={INK} />
              <circle cx="16" cy="12" r="10" fill="#f1f3f6" stroke={INK} />
            </g>
          );
        })}
      {zoom === 3 && (
        <g transform="translate(230 115)">
          {[40, 75].map((r) => (
            <ellipse key={r} rx={r} ry={r * 0.9} fill="none" stroke="#9aa7b5" strokeDasharray="4 4" />
          ))}
          <circle r="14" fill={ORANGE} />
          <circle cx="40" r="6" fill="#4a90e2">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="-75" r="6" fill="#4a90e2">
            <animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur="3s" repeatCount="indefinite" />
          </circle>
          <text y="105" textAnchor="middle" fontSize="12" fill={INK}>
            {tc('ядро в центре, вокруг летают электроны')}
          </text>
        </g>
      )}
    </Scene>
  );
}

/** Particles in a box move faster when it is warmer: solid, liquid, gas. */
export function ParticlesHeat({ tc }: { tc: Tc }) {
  const [temp, setTemp] = useState(20);
  const parts = useRef(Array.from({ length: 30 }, (_, i) => ({ hx: 150 + (i % 6) * 32, hy: 70 + Math.floor(i / 6) * 28, x: 0, y: 0, vx: Math.random() - 0.5, vy: Math.random() - 0.5 })));
  const state = temp < 0 ? 'solid' : temp < 100 ? 'liquid' : 'gas';
  useTicker(true, (dt) => {
    const speed = 20 + (temp + 30) * 1.6;
    for (const p of parts.current) {
      if (state === 'solid') {
        p.x = p.hx + (Math.random() - 0.5) * 3;
        p.y = p.hy + (Math.random() - 0.5) * 3;
        continue;
      }
      if (!p.x) [p.x, p.y] = [p.hx, p.hy];
      p.x += p.vx * speed * dt;
      p.y += p.vy * speed * dt;
      const top = state === 'liquid' ? 110 : 30;
      if (p.x < 110 || p.x > 350) p.vx *= -1;
      if (p.y < top || p.y > 210) p.vy *= -1;
      p.x = Math.min(350, Math.max(110, p.x));
      p.y = Math.min(210, Math.max(top, p.y));
    }
  });
  const label = { solid: 'Лёд: частицы стоят плотно и только дрожат', liquid: 'Вода: частицы скользят друг возле друга', gas: 'Пар: частицы разлетаются во все стороны' }[state];
  return (
    <Scene
      title={tc('Частицы и тепло')}
      h={240}
      notes={[tc('Двигай ползунок температуры и смотри, как меняется движение частиц.')]}
      controls={<Slider label={<>{tc('Температура')}: <b>{temp} °C</b></>} value={temp} min={-30} max={130} onChange={setTemp} hint={tc(label)} />}
    >
      <rect x="100" y="20" width="260" height="200" rx="14" fill={state === 'gas' ? '#fff5ef' : state === 'liquid' ? '#eaf6fd' : '#f0f6fa'} stroke="#9aa7b5" strokeWidth="2" />
      {parts.current.map((p, i) => (
        <circle key={i} cx={p.x || p.hx} cy={p.y || p.hy} r="9" fill={state === 'gas' ? PEACH : '#5aa6cf'} stroke="#fff" />
      ))}
      <rect x="380" y="30" width="16" height="180" rx="8" fill="#fff" stroke="#9aa7b5" />
      <rect x="383" y={200 - ((temp + 30) / 160) * 165} width="10" height={((temp + 30) / 160) * 165 + 7} rx="5" fill={ORANGE} />
    </Scene>
  );
}

// ---------------- Forces ----------------

/** A magnet attracts iron things but not wood, plastic or paper. */
export function MagnetPlay({ tc }: { tc: Tc }) {
  const items = [
    { id: 'nail', name: 'гвоздь', icon: '🔩', iron: true },
    { id: 'clip', name: 'скрепка', icon: '📎', iron: true },
    { id: 'pencil', name: 'карандаш', icon: '✏️', iron: false },
    { id: 'coin', name: 'ключ', icon: '🔑', iron: true },
    { id: 'eraser', name: 'ластик', icon: '🧽', iron: false },
    { id: 'leaf', name: 'листок', icon: '🍃', iron: false },
  ];
  const { pos, get } = useDrag(Object.fromEntries(items.map((it, i) => [it.id, { x: 40 + (i % 3) * 60, y: 70 + Math.floor(i / 3) * 80 }])) as Record<string, { x: number; y: number }>, (id, p) => {
    const it = items.find((x) => x.id === id)!;
    if (it.iron && p.x > 220) return { x: 300, y: 70 + items.filter((x) => x.iron).indexOf(it) * 45 };
  });
  const stuck = items.filter((it) => it.iron && pos[it.id].x === 300).length;
  return (
    <Scene
      title={tc('Что притягивает магнит?')}
      h={240}
      notes={[tc('Перетаскивай предметы к магниту. Железные прилипнут, остальные нет.')]}
      controls={<Say>{tc('Прилипло')}: {stuck} / 3</Say>}
    >
      <g transform="translate(330 40)">
        <path d="M0 0h50v140h-50v-30h22v-80h-22z" fill="#e5534b" />
        <rect x="0" y="0" width="22" height="30" fill="#c9ced6" />
        <rect x="0" y="110" width="22" height="30" fill="#c9ced6" />
        <text x="10" y="20" textAnchor="middle" fontSize="13" fontWeight="800" fill={INK}>
          N
        </text>
        <text x="10" y="130" textAnchor="middle" fontSize="13" fontWeight="800" fill={INK}>
          S
        </text>
      </g>
      {items.map((it) => (
        <g key={it.id} {...get(it.id)}>
          <circle r="22" fill="#fff" stroke="#d5dbe3" />
          <text y="9" textAnchor="middle" fontSize="24" pointerEvents="none">
            {it.icon}
          </text>
          <text y="38" textAnchor="middle" fontSize="11" fill={INK} pointerEvents="none">
            {tc(it.name)}
          </text>
        </g>
      ))}
    </Scene>
  );
}

/** Two magnets: like poles push apart, unlike poles pull together. */
export function MagnetPoles({ tc }: { tc: Tc }) {
  const [flip, setFlip] = useState(false);
  const pull = flip;
  return (
    <Scene
      title={tc('Два полюса: N и S')}
      h={170}
      notes={[tc('Нажми на правый магнит, чтобы повернуть его.'), tc('Разные полюса притягиваются, одинаковые отталкиваются.')]}
      controls={<Say>{pull ? tc('N и S: магниты притянулись!') : tc('N и N: магниты отталкиваются!')}</Say>}
    >
      <g transform={`translate(${pull ? 110 : 60} 60)`}>
        <rect width="70" height="40" fill="#4a90e2" />
        <rect x="70" width="70" height="40" fill="#e5534b" />
        <text x="35" y="26" textAnchor="middle" fill="#fff" fontWeight="800">
          S
        </text>
        <text x="105" y="26" textAnchor="middle" fill="#fff" fontWeight="800">
          N
        </text>
      </g>
      <g transform={`translate(${pull ? 250 : 300} 60)`} onClick={() => setFlip(!flip)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer", transition: 'transform 0.4s' }}>
        <rect width="70" height="40" fill={flip ? '#4a90e2' : '#e5534b'} />
        <rect x="70" width="70" height="40" fill={flip ? '#e5534b' : '#4a90e2'} />
        <text x="35" y="26" textAnchor="middle" fill="#fff" fontWeight="800">
          {flip ? 'S' : 'N'}
        </text>
        <text x="105" y="26" textAnchor="middle" fill="#fff" fontWeight="800">
          {flip ? 'N' : 'S'}
        </text>
      </g>
      {!pull && <text x="230" y="130" textAnchor="middle" fontSize="22">↔</text>}
    </Scene>
  );
}

/** Friction: push a toy car on different surfaces and see how far it goes. */
export function FrictionRamp({ tc }: { tc: Tc }) {
  const surfaces: [string, string, number, string][] = [
    ['ice', 'Лёд', 0.05, '#dff3fb'],
    ['floor', 'Пол', 0.2, '#e9d3b7'],
    ['carpet', 'Ковёр', 0.5, '#d9a0a0'],
    ['sand', 'Песок', 0.9, '#f1d58a'],
  ];
  const [s, setS] = useState('floor');
  const [x, setX] = useState(30);
  const [moving, setMoving] = useState(false);
  const v = useRef(0);
  const mu = surfaces.find((q) => q[0] === s)![2];
  useTicker(moving, (dt) => {
    v.current = Math.max(0, v.current - mu * 300 * dt);
    setX((px) => Math.min(430, px + v.current * dt));
    if (v.current === 0) setMoving(false);
  });
  return (
    <Scene
      title={tc('Трение: как далеко уедет машинка?')}
      h={160}
      notes={[tc('Выбери поверхность и толкни машинку. Чем больше трение, тем быстрее она остановится.')]}
      controls={
        <>
          <Choices items={surfaces.map((q) => [q[0], tc(q[1])] as [string, string])} value={s} onChange={(id) => { setS(id); setX(30); }} />
          <button type="button" className="btn btn-go md-play" onClick={() => { setX(30); v.current = 260; setMoving(true); }}>
            👉 {tc('Толкнуть')}
          </button>
        </>
      }
    >
      <rect x="0" y="110" width="460" height="40" fill={surfaces.find((q) => q[0] === s)![3]} />
      <g transform={`translate(${x} 80)`}>
        <rect x="-26" y="0" width="52" height="22" rx="8" fill={ORANGE} />
        <rect x="-14" y="-12" width="28" height="14" rx="5" fill="#ffd9a8" />
        <circle cx="-14" cy="26" r="8" fill={INK} />
        <circle cx="14" cy="26" r="8" fill={INK} />
      </g>
    </Scene>
  );
}

/** A lever: move the support and see how easy it is to lift the stone. */
export function LeverPlay({ tc }: { tc: Tc }) {
  const [f, setF] = useState(200);
  const stoneArm = f - 60;
  const handArm = 400 - f;
  const effort = Math.round((50 * stoneArm) / handArm);
  const tilt = Math.max(-12, Math.min(12, (effort - 25) / 3));
  return (
    <Scene
      title={tc('Рычаг: поднимем камень')}
      h={200}
      notes={[tc('Двигай опору. Чем ближе опора к камню, тем легче его поднять.')]}
      controls={<Slider label={<>{tc('Нужно силы')}: <b>{effort} {tc('кг')}</b></>} value={f} min={100} max={340} onChange={setF} hint={tc('Камень весит 50 кг')} />}
    >
      <g transform={`rotate(${tilt} ${f} 120)`}>
        <rect x="40" y="114" width="380" height="10" rx="5" fill="#a8714a" />
        <path d="M40 112c0-30 40-30 40 0z" fill="#8a94a3" />
        <text x="60" y="100" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">
          50
        </text>
        <text x="400" y="100" textAnchor="middle" fontSize="26">
          ✋
        </text>
      </g>
      <path d={`M${f - 18} 170l18-46 18 46z`} fill={MINT} />
      <rect x="0" y="170" width="460" height="10" fill="#d9e6d0" />
    </Scene>
  );
}

/** Things float or sink; in salty water an egg floats. */
export function FloatSink({ tc, salt = false }: { tc: Tc; salt?: boolean }) {
  const items = [
    { id: 'wood', icon: '🪵', name: 'деревяшка', float: true },
    { id: 'stone', icon: '🪨', name: 'камень', float: false },
    { id: 'ball', icon: '⚽', name: 'мяч', float: true },
    { id: 'key', icon: '🔑', name: 'ключ', float: false },
    { id: 'egg', icon: '🥚', name: 'яйцо', float: false },
    { id: 'apple', icon: '🍎', name: 'яблоко', float: true },
  ];
  const [salty, setSalty] = useState(0);
  const floats = (id: string) => (id === 'egg' ? salty >= 6 : items.find((x) => x.id === id)!.float);
  const { pos, get } = useDrag(Object.fromEntries(items.map((it, i) => [it.id, { x: 30 + i * 70, y: 30 }])) as Record<string, { x: number; y: number }>, (id, p) => {
    if (p.y > 80 && p.x > 60 && p.x < 400) return { x: p.x, y: floats(id) ? 112 : 205 };
  });
  return (
    <Scene
      title={tc(salt ? 'Яйцо в солёной воде' : 'Плавает или тонет?')}
      h={240}
      notes={[tc('Перетащи предметы в воду.'), ...(salt ? [tc('Добавляй соль ползунком и снова опусти яйцо.')] : [])]}
      controls={salt ? <Slider label={<>{tc('Соли')}: <b>{salty} {tc('ложек')}</b></>} value={salty} min={0} max={10} onChange={setSalty} hint={salty >= 6 ? tc('Солёная вода плотнее, яйцо всплывает!') : tc('В пресной воде яйцо тонет.')} /> : undefined}
    >
      <rect x="60" y="100" width="340" height="125" rx="10" fill={salty >= 6 ? '#bfe0ee' : '#cfe9f7'} stroke="#8fb8cf" strokeWidth="3" />
      {items
        .filter((it) => !salt || ['egg', 'apple', 'stone'].includes(it.id))
        .map((it) => (
          <g key={it.id} {...get(it.id)}>
            <text y="10" textAnchor="middle" fontSize="30" pointerEvents="none">
              {it.icon}
            </text>
            {pos[it.id].y < 80 && (
              <text y="30" textAnchor="middle" fontSize="10" fill={INK} pointerEvents="none">
                {tc(it.name)}
              </text>
            )}
          </g>
        ))}
    </Scene>
  );
}

/** Shadow theatre: move the lamp and watch the shadow grow and shrink. */
export function ShadowLamp({ tc }: { tc: Tc }) {
  const [lx, setLx] = useState(80);
  const objX = 220;
  const wall = 420;
  const scale = (wall - lx) / (objX - lx);
  const h = 40 * scale;
  return (
    <Scene title={tc('Свет и тень')} h={220} notes={[tc('Двигай фонарик. Ближе к предмету тень большая, дальше маленькая.')]} controls={<Slider label={tc('Где фонарик')} value={lx} min={40} max={190} onChange={setLx} />}>
      <rect x={wall} y="10" width="30" height="200" fill="#efe8d8" />
      <path d={`M${lx} 120L${wall} ${120 - h}L${wall} ${120 + h}z`} fill="#fff6c8" opacity="0.8" />
      <rect x={wall - 4} y={120 - h / 2} width="8" height={h} fill="#444" opacity="0.75" />
      <g transform={`translate(${objX} 120)`}>
        <text y="12" textAnchor="middle" fontSize="34">
          🐰
        </text>
      </g>
      <g transform={`translate(${lx} 120)`}>
        <rect x="-26" y="-10" width="26" height="20" rx="4" fill={INK} />
        <circle r="8" fill="#ffe56b" />
      </g>
      <text x={wall + 15} y="225" textAnchor="middle" fontSize="11" fill={INK}>
        {tc('стена')}
      </text>
    </Scene>
  );
}

/** White light through a prism makes a rainbow; drag the prism into the beam. */
export function PrismRainbow({ tc }: { tc: Tc }) {
  const { pos, get } = useDrag({ prism: { x: 120, y: 180 } });
  const inBeam = Math.abs(pos.prism.y - 110) < 30 && pos.prism.x > 150 && pos.prism.x < 300;
  const colors = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#29b6f6', '#3949ab', '#8e24aa'];
  const names = ['красный', 'оранжевый', 'жёлтый', 'зелёный', 'голубой', 'синий', 'фиолетовый'];
  return (
    <Scene title={tc('Радуга из призмы')} h={230} notes={[tc('Перетащи стеклянную призму на луч света.'), tc('Каждый Охотник Желает Знать, Где Сидит Фазан: порядок цветов радуги.')]}>
      <rect x="0" y="0" width="460" height="230" fill="#1f2433" rx="12" />
      <line x1="0" y1="110" x2={inBeam ? pos.prism.x : 460} y2="110" stroke="#fff" strokeWidth="5" />
      {inBeam &&
        colors.map((c, i) => (
          <g key={c}>
            <line x1={pos.prism.x + 20} y1="110" x2="440" y2={50 + i * 20} stroke={c} strokeWidth="5" />
            <text x="452" y={54 + i * 20} fontSize="9" fill={c} textAnchor="end" dy="-6">
              {tc(names[i])}
            </text>
          </g>
        ))}
      <g {...get('prism')}>
        <path d="M0 -36L32 22H-32z" fill="#bfe6f5" opacity="0.85" stroke="#fff" strokeWidth="2" />
      </g>
    </Scene>
  );
}

/** Sound is vibration: change loudness and pitch, see the wave and hear it. */
export function SoundWave({ tc }: { tc: Tc }) {
  const [loud, setLoud] = useState(50);
  const [pitch, setPitch] = useState(3);
  const path = useMemo(() => {
    let d = 'M0 100';
    for (let x = 0; x <= 460; x += 4) d += `L${x} ${100 - Math.sin((x / 460) * Math.PI * 2 * pitch) * loud * 0.8}`;
    return d;
  }, [loud, pitch]);
  const play = () => {
    const AC = window.AudioContext;
    if (!AC) return;
    const a = new AC();
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = 130 * pitch;
    g.gain.value = (loud / 100) * 0.3;
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.8);
  };
  return (
    <Scene
      title={tc('Звук это волна')}
      h={200}
      notes={[tc('Высокие волны звучат громко, частые волны звучат высоко (тонко).')]}
      controls={
        <>
          <Slider label={tc('Громкость')} value={loud} min={10} max={100} onChange={setLoud} />
          <Slider label={tc('Высота звука')} value={pitch} min={1} max={8} onChange={setPitch} />
          <button type="button" className="btn btn-go md-play" onClick={play}>
            ▶ {tc('Послушать')}
          </button>
        </>
      }
    >
      <line x1="0" y1="100" x2="460" y2="100" stroke="#d5dbe3" />
      <path d={path} stroke="#4a90e2" strokeWidth="3" fill="none" />
    </Scene>
  );
}

/** An electric circuit: close the switch and try different materials in the gap. */
export function CircuitPlay({ tc }: { tc: Tc }) {
  const [on, setOn] = useState(false);
  const [mat, setMat] = useState('metal');
  const conducts = mat === 'metal' || mat === 'coin';
  const lit = on && conducts;
  return (
    <Scene
      title={tc('Электрическая цепь')}
      h={230}
      notes={[tc('Нажми на выключатель.'), tc('Поставь в разрыв разные предметы: ток идёт только через проводники.')]}
      controls={
        <>
          <Choices items={[['metal', tc('Гвоздь')], ['coin', tc('Монета')], ['wood', tc('Палочка')], ['rubber', tc('Резинка')]]} value={mat} onChange={setMat} />
          <Say>{lit ? tc('Лампочка горит: это проводник!') : on ? tc('Не горит: это изолятор.') : tc('Цепь разомкнута.')}</Say>
        </>
      }
    >
      <path d="M80 60H380V180H80Z" fill="none" stroke={lit ? '#f5b400' : INK} strokeWidth="4" />
      <rect x="60" y="100" width="40" height="70" rx="6" fill="#4a90e2" />
      <text x="80" y="140" textAnchor="middle" fill="#fff" fontWeight="800">
        +
      </text>
      <g transform="translate(230 40)">
        <circle r="22" fill={lit ? '#ffe56b' : '#f3f5f8'} stroke={INK} strokeWidth="2" />
        {lit && <circle r="34" fill="#ffe56b" opacity="0.35" />}
      </g>
      <g onClick={() => setOn(!on)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}>
        <rect x="355" y="100" width="50" height="50" fill="transparent" />
        <line x1="380" y1="150" x2={on ? 380 : 400} y2={on ? 100 : 110} stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <circle cx="380" cy="150" r="5" fill={INK} />
      </g>
      <rect x="200" y="168" width="60" height="24" rx="6" fill="#fff" stroke={INK} />
      <text x="230" y="186" textAnchor="middle" fontSize="16">
        {{ metal: '🔩', coin: '🪙', wood: '🥢', rubber: '🧽' }[mat]}
      </text>
    </Scene>
  );
}

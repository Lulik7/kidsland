import { useState } from 'react';
import { Choices, INK, MINT, ORANGE, PEACH, Say, Scene, SKY, Slider, useDrag, useTicker, type Tc } from './kit';

// ---------------- Space ----------------

const PLANETS: { name: string; color: string; r: number; fact: string; g: number }[] = [
  { name: 'Меркурий', color: '#b0a59a', r: 5, fact: 'Ближе всех к Солнцу, год длится 88 дней.', g: 0.38 },
  { name: 'Венера', color: '#e8c27a', r: 8, fact: 'Самая горячая планета: облака держат жару.', g: 0.9 },
  { name: 'Земля', color: '#4a90e2', r: 8, fact: 'Наш дом: есть вода, воздух и жизнь.', g: 1 },
  { name: 'Марс', color: '#d8643c', r: 6, fact: 'Красная планета с самой высокой горой Олимп.', g: 0.38 },
  { name: 'Юпитер', color: '#d9a77f', r: 17, fact: 'Самая большая планета, газовый гигант.', g: 2.5 },
  { name: 'Сатурн', color: '#e9cf8f', r: 14, fact: 'Знаменит кольцами изо льда и камней.', g: 1.07 },
  { name: 'Уран', color: '#9fdde8', r: 11, fact: 'Ледяной гигант, вращается лёжа на боку.', g: 0.9 },
  { name: 'Нептун', color: '#4f6fd8', r: 11, fact: 'Самые сильные ветры в Солнечной системе.', g: 1.14 },
];

const MOON = { name: 'Луна', fact: 'Спутник Земли: летит вокруг нашей планеты за 27 дней и светит отражённым светом Солнца.' };

/** The Solar System: planets go round the Sun; tap a planet to learn about it. */
export function SolarSystem({ tc }: { tc: Tc }) {
  const [t, setT] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [pick, setPick] = useState(2);
  useTicker(speed > 0, (dt) => setT((x) => x + dt * speed));
  return (
    <Scene
      title={tc('Солнечная система')}
      h={300}
      notes={[tc('Нажми на планету, чтобы узнать о ней. Маленький серый шарик возле Земли — Луна.'), tc('Ближние планеты бегут вокруг Солнца быстрее дальних.')]}
      controls={
        <>
          <Say>
            <b>{tc((PLANETS[pick] ?? MOON).name)}</b>: {tc((PLANETS[pick] ?? MOON).fact)}
          </Say>
          <Slider label={tc('Скорость')} value={speed} min={0} max={4} step={0.5} onChange={setSpeed} />
        </>
      }
    >
      <rect width="460" height="300" rx="14" fill="#141a2e" />
      {PLANETS.map((p, i) => {
        const R = 30 + i * 24;
        const a = t / Math.sqrt((i + 1) ** 3) + i;
        return (
          <g key={p.name}>
            <ellipse cx="230" cy="150" rx={R} ry={R * 0.55} fill="none" stroke="#2f3a5a" />
            <g transform={`translate(${230 + Math.cos(a) * R} ${150 + Math.sin(a) * R * 0.55})`} onClick={() => setPick(i)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}>
              <circle r={p.r + 6} fill="transparent" />
              <circle r={p.r} fill={p.color} stroke={pick === i ? '#fff' : 'none'} strokeWidth="2" />
              {i === 5 && <ellipse rx={p.r + 7} ry="3" fill="none" stroke="#e9cf8f" strokeWidth="2" />}
              {i === 2 && (
                <g
                  transform={`translate(${Math.cos(t * 4) * 15} ${Math.sin(t * 4) * 9})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPick(-1);
                  }}
                >
                  <circle r="7" fill="transparent" />
                  <circle r="3.5" fill="#d9d9d9" stroke={pick === -1 ? '#fff' : 'none'} strokeWidth="1.5" />
                </g>
              )}
            </g>
          </g>
        );
      })}
      <circle cx="230" cy="150" r="18" fill="#ffd23f" />
      <circle cx="230" cy="150" r="26" fill="#ffd23f" opacity="0.25" />
    </Scene>
  );
}

/** Weight on other planets: pick a planet and see how much you would weigh. */
export function PlanetWeight({ tc }: { tc: Tc }) {
  const [kg, setKg] = useState(30);
  const [p, setP] = useState(3);
  const planets = [...PLANETS, { name: 'Луна', color: '#ccc', r: 6, fact: '', g: 0.17 }];
  const w = Math.round(kg * planets[p].g);
  return (
    <Scene
      title={tc('Сколько я вешу на других планетах?')}
      h={180}
      notes={[tc('Масса везде одинаковая, а вес зависит от притяжения планеты.')]}
      controls={
        <>
          <Slider label={<>{tc('Мой вес на Земле')}: <b>{kg} {tc('кг')}</b></>} value={kg} min={15} max={80} onChange={setKg} />
          <Choices items={planets.map((q, i) => [String(i), tc(q.name)] as [string, string])} value={String(p)} onChange={(v) => setP(Number(v))} />
        </>
      }
    >
      <circle cx="110" cy="90" r="60" fill={planets[p].color} />
      <text x="110" y="96" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">
        {tc(planets[p].name)}
      </text>
      <g transform="translate(300 40)">
        <rect x="-60" y="60" width="120" height="30" rx="8" fill="#d5dbe3" />
        <text y="50" textAnchor="middle" fontSize="40">
          🧒
        </text>
        <text y="82" textAnchor="middle" fontSize="18" fontWeight="800" fill={INK}>
          {w} {tc('кг')}
        </text>
      </g>
    </Scene>
  );
}

/** Moon phases: drag the Moon around the Earth and see how it looks from here. */
export function MoonPhases({ tc }: { tc: Tc }) {
  const [a, setA] = useState(0);
  const rad = (a * Math.PI) / 180;
  // 0 = new moon (between Earth and Sun on the left), 180 = full moon
  const lit = (1 - Math.cos(rad)) / 2;
  const names = ['Новолуние', 'Растущая Луна', 'Первая четверть', 'Растущая Луна', 'Полнолуние', 'Убывающая Луна', 'Последняя четверть', 'Убывающая Луна'];
  const name = names[Math.round(a / 45) % 8];
  const k = 1 - 2 * lit;
  return (
    <Scene title={tc('Фазы Луны')} h={220} notes={[tc('Двигай Луну вокруг Земли. Солнце светит слева, а справа видно, какой Луну видим мы.')]} controls={<Slider label={<b>{tc(name)}</b>} value={a} min={0} max={359} onChange={setA} />}>
      <circle cx="10" cy="110" r="40" fill="#ffd23f" />
      <circle cx="170" cy="110" r="26" fill="#4a90e2" />
      <circle cx="170" cy="110" r="80" fill="none" stroke="#d5dbe3" strokeDasharray="4 4" />
      <g transform={`translate(${170 - Math.cos(rad) * 80} ${110 - Math.sin(rad) * 80})`}>
        <circle r="12" fill="#444" />
        <path d="M0 -12a12 12 0 0 0 0 24z" fill="#f5f5f0" />
      </g>
      <g transform="translate(360 110)">
        <circle r="50" fill="#2b2f3a" />
        <path d={`M0 -50A50 50 0 0 ${a < 180 ? 1 : 0} 0 50A${Math.abs(k) * 50} 50 0 0 ${(k > 0) === a < 180 ? 0 : 1} 0 -50z`} fill="#f5f5f0" />
        <text y="72" textAnchor="middle" fontSize="11" fill={INK}>
          {tc('Так видно с Земли')}
        </text>
      </g>
    </Scene>
  );
}

/** Connect the stars in order to draw the Big Dipper. */
export function Constellation({ tc }: { tc: Tc }) {
  const stars = [
    [60, 70], [120, 60], [175, 80], [225, 105], [240, 165], [320, 170], [330, 110],
  ];
  const [n, setN] = useState(0);
  return (
    <Scene
      title={tc('Собери Большую Медведицу')}
      h={230}
      notes={[tc('Нажимай на звёзды по порядку: от 1 до 7.'), tc('От двух крайних звёзд ковша можно найти Полярную звезду.')]}
      controls={n >= stars.length ? <Say>✨ {tc('Это ковш Большой Медведицы!')}</Say> : <button type="button" className="btn btn-light md-play" onClick={() => setN(0)}>{tc('Сначала')}</button>}
    >
      <rect width="460" height="230" rx="14" fill="#141a2e" />
      {stars.slice(0, n).map((s, i) => i > 0 && <line key={i} x1={stars[i - 1][0]} y1={stars[i - 1][1]} x2={s[0]} y2={s[1]} stroke="#ffd23f" strokeWidth="2" />)}
      {n >= stars.length && <line x1="330" y1="110" x2="380" y2="20" stroke="#9fdde8" strokeDasharray="4 4" />}
      {n >= stars.length && <circle cx="380" cy="20" r="6" fill="#9fdde8" />}
      {stars.map(([x, y], i) => (
        <g key={i} onClick={() => i === n && setN(n + 1)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}>
          <circle cx={x} cy={y} r="14" fill="transparent" />
          <circle cx={x} cy={y} r={i < n ? 6 : 4} fill={i < n ? '#ffd23f' : '#fff'} />
          {i >= n && (
            <text x={x + 9} y={y - 7} fontSize="10" fill="#8a94b8">
              {i + 1}
            </text>
          )}
        </g>
      ))}
    </Scene>
  );
}

/** Earth spins: drag the slider to turn it; the side facing the Sun has day. */
export function DayNight({ tc }: { tc: Tc }) {
  const [h, setH] = useState(12);
  const x = Math.sin(((h - 6) / 24) * Math.PI * 2) * 60;
  const day = h >= 6 && h < 18;
  return (
    <Scene title={tc('День и ночь')} h={200} notes={[tc('Земля крутится вокруг своей оси за 24 часа. Двигай часы и следи за домиком.')]} controls={<Slider label={<>{tc('Время')}: <b>{h}:00</b> {day ? '☀️' : '🌙'}</>} value={h} min={0} max={23} onChange={setH} />}>
      <circle cx="30" cy="100" r="40" fill="#ffd23f" />
      <circle cx="260" cy="100" r="70" fill="#4a90e2" />
      <path d="M260 30a70 70 0 0 1 0 140z" fill="#14213d" opacity="0.6" />
      <text x={260 + x} y={100 + Math.cos(((h - 6) / 24) * Math.PI * 2) * -10} textAnchor="middle" fontSize="20">
        🏠
      </text>
      <text x="400" y="105" fontSize="28">
        {day ? '☀️' : '🌙'}
      </text>
    </Scene>
  );
}

// ---------------- Water, weather, plants, body ----------------

/** The water cycle: tap each step to see where the water goes. */
export function WaterCycle({ tc }: { tc: Tc }) {
  const steps = ['Солнце греет воду', 'Пар поднимается вверх', 'Пар собирается в облака', 'Капли падают дождём', 'Вода бежит в реку и море'];
  const [s, setS] = useState(0);
  return (
    <Scene
      title={tc('Круговорот воды')}
      h={240}
      notes={[tc('Нажимай «Дальше» и смотри, как вода путешествует по кругу.')]}
      controls={
        <>
          <Say>
            {s + 1}. {tc(steps[s])}
          </Say>
          <button type="button" className="btn btn-go md-play" onClick={() => setS((s + 1) % steps.length)}>
            {tc('Дальше')} →
          </button>
        </>
      }
    >
      <rect width="460" height="240" fill="#eaf6fd" rx="14" />
      <circle cx="60" cy="50" r="28" fill="#ffd23f" opacity={s === 0 ? 1 : 0.6} />
      <path d="M0 190q120-20 230 0t230 0v50H0z" fill="#4a90e2" />
      <path d="M280 190l60-90 60 90z" fill="#8bb174" />
      {s >= 1 && [120, 160, 200].map((x) => <path key={x} d={`M${x} 170q-8-20 0-40t0-40`} stroke="#9aa7b5" strokeWidth="3" fill="none" strokeDasharray="4 6" opacity={s === 1 ? 1 : 0.4} />)}
      {s >= 2 && (
        <g transform="translate(250 50)" opacity={s >= 2 ? 1 : 0}>
          <ellipse rx="60" ry="22" fill={s >= 3 ? '#9aa7b5' : '#fff'} />
          <ellipse cx="-30" cy="-12" rx="30" ry="18" fill={s >= 3 ? '#9aa7b5' : '#fff'} />
        </g>
      )}
      {s === 3 && [220, 250, 280, 310].map((x) => <line key={x} x1={x} y1="80" x2={x - 6} y2="110" stroke="#4a90e2" strokeWidth="3" strokeLinecap="round" />)}
      {s === 4 && <path d="M330 120q-10 40-60 70" stroke="#4a90e2" strokeWidth="6" fill="none" />}
    </Scene>
  );
}

/** Water, light and warmth make a plant grow; try different amounts. */
export function PlantGrow({ tc }: { tc: Tc }) {
  const [water, setWater] = useState(50);
  const [light, setLight] = useState(50);
  const ok = (v: number) => 1 - Math.abs(v - 60) / 60;
  const health = Math.max(0, Math.min(1, ok(water) * ok(light) * 1.4));
  const h = 30 + health * 120;
  return (
    <Scene
      title={tc('Что нужно растению?')}
      h={230}
      notes={[tc('Подбери воду и свет. Слишком мало или слишком много тоже плохо.')]}
      controls={
        <>
          <Slider label={<>💧 {tc('Вода')}</>} value={water} min={0} max={120} onChange={setWater} />
          <Slider label={<>☀️ {tc('Свет')}</>} value={light} min={0} max={120} onChange={setLight} />
          <Say>{health > 0.75 ? tc('Растение счастливо и растёт!') : water > 90 ? tc('Слишком много воды: корни гниют.') : water < 25 ? tc('Растению не хватает воды.') : light < 25 ? tc('Растению не хватает света.') : tc('Почти! Попробуй ещё.')}</Say>
        </>
      }
    >
      <circle cx="400" cy="40" r={10 + light / 6} fill="#ffd23f" />
      <path d={`M230 190V${190 - h}`} stroke={health > 0.4 ? '#4caf50' : '#a1887f'} strokeWidth="6" />
      {[0.4, 0.65, 0.9].map((k, i) => (
        <ellipse key={i} cx={230 + (i % 2 ? 22 : -22)} cy={190 - h * k} rx={10 + health * 12} ry="8" fill={health > 0.4 ? '#66bb6a' : '#bcaaa4'} transform={`rotate(${i % 2 ? -25 : 25} ${230 + (i % 2 ? 22 : -22)} ${190 - h * k})`} />
      ))}
      {health > 0.75 && <circle cx="230" cy={190 - h} r="12" fill="#f48fb1" />}
      <path d="M180 190h100l-10 35h-80z" fill="#c97b4a" />
    </Scene>
  );
}

/** The human body: tap an organ to learn what it does. */
export function BodyOrgans({ tc }: { tc: Tc }) {
  const organs: { id: string; name: string; fact: string; x: number; y: number; r: number; color: string }[] = [
    { id: 'brain', name: 'Мозг', fact: 'Думает и управляет всем телом.', x: 230, y: 40, r: 18, color: '#f8bbd0' },
    { id: 'lungs', name: 'Лёгкие', fact: 'Берут из воздуха кислород.', x: 210, y: 105, r: 18, color: '#ef9a9a' },
    { id: 'heart', name: 'Сердце', fact: 'Насос: качает кровь по всему телу, около 80 ударов в минуту.', x: 245, y: 110, r: 11, color: '#e53935' },
    { id: 'stomach', name: 'Желудок', fact: 'Переваривает еду.', x: 245, y: 150, r: 14, color: '#ffcc80' },
    { id: 'bones', name: 'Скелет', fact: 'Около 206 костей держат тело и защищают органы.', x: 200, y: 215, r: 12, color: '#eeeeee' },
  ];
  const [p, setP] = useState(2);
  return (
    <Scene title={tc('Как устроено тело')} h={260} notes={[tc('Нажимай на органы.')]} controls={<Say><b>{tc(organs[p].name)}</b>: {tc(organs[p].fact)}</Say>}>
      <circle cx="230" cy="40" r="30" fill="#f7d7bf" />
      <rect x="185" y="72" width="90" height="110" rx="30" fill="#f7d7bf" />
      <rect x="190" y="175" width="25" height="80" rx="12" fill="#f7d7bf" />
      <rect x="245" y="175" width="25" height="80" rx="12" fill="#f7d7bf" />
      <rect x="150" y="80" width="25" height="90" rx="12" fill="#f7d7bf" />
      <rect x="285" y="80" width="25" height="90" rx="12" fill="#f7d7bf" />
      {organs.map((o, i) => (
        <g key={o.id} onClick={() => setP(i)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}>
          <circle cx={o.x} cy={o.y} r={o.r} fill={o.color} stroke={p === i ? INK : '#fff'} strokeWidth="2">
            {o.id === 'heart' && <animate attributeName="r" values={`${o.r};${o.r + 2};${o.r}`} dur="0.75s" repeatCount="indefinite" />}
          </circle>
        </g>
      ))}
    </Scene>
  );
}

/** Three states of water: drag the thermometer to melt ice or boil water. */
export function WaterStates({ tc }: { tc: Tc }) {
  const [t, setT] = useState(-10);
  const state = t <= 0 ? 'лёд' : t < 100 ? 'вода' : 'пар';
  return (
    <Scene title={tc('Лёд, вода и пар')} h={180} notes={[tc('При 0 °C лёд тает, при 100 °C вода кипит и превращается в пар.')]} controls={<Slider label={<>{tc('Температура')}: <b>{t} °C</b> → {tc(state)}</>} value={t} min={-20} max={120} onChange={setT} />}>
      <path d="M170 60h120l-10 100h-100z" fill="#f3f5f8" stroke="#9aa7b5" strokeWidth="2" />
      {state === 'лёд' && <rect x="195" y="90" width="70" height="55" rx="8" fill="#cfefff" stroke="#8fd3f4" strokeWidth="3" />}
      {state === 'вода' && <path d="M178 100h104l-6 58h-92z" fill="#4a90e2" opacity="0.7" />}
      {state === 'пар' && [200, 230, 260].map((x) => <path key={x} d={`M${x} 60q-10-20 0-40`} stroke="#9aa7b5" strokeWidth="4" fill="none" />)}
      <rect x="340" y="20" width="16" height="140" rx="8" fill="#fff" stroke="#9aa7b5" />
      <rect x="343" y={150 - ((t + 20) / 140) * 125} width="10" height={((t + 20) / 140) * 125 + 7} rx="5" fill={ORANGE} />
    </Scene>
  );
}

/** pH: drop liquids into red cabbage juice and watch the colour. */
export function CabbageIndicator({ tc }: { tc: Tc }) {
  const liquids: [string, string, string, string][] = [
    ['lemon', '🍋 Лимонный сок', '#e5395f', 'кислота'],
    ['vinegar', '🫙 Уксус', '#d0457a', 'кислота'],
    ['water', '💧 Вода', '#7e57c2', 'нейтрально'],
    ['soda', '🧂 Сода', '#3f8fd8', 'щёлочь'],
    ['soap', '🧼 Мыло', '#2bb673', 'щёлочь'],
  ];
  const [l, setL] = useState('water');
  const [c, , , kind] = liquids.find((q) => q[0] === l)!;
  const color = liquids.find((q) => q[0] === l)![2];
  return (
    <Scene title={tc('Индикатор из капусты')} h={200} notes={[tc('Капустный сок меняет цвет: кислоты делают его розовым, щёлочи синим или зелёным.')]} controls={<><Choices items={liquids.map((q) => [q[0], tc(q[1])] as [string, string])} value={l} onChange={setL} /><Say>{tc(kind)}</Say></>}>
      <path d="M180 30h100l-12 150h-76z" fill="#f3f5f8" stroke="#9aa7b5" strokeWidth="2" />
      <path d="M186 80h88l-8 98h-72z" fill={color} style={{ transition: 'fill 0.6s' }} />
      <text x="120" y="60" fontSize="30">
        {c && liquids.find((q) => q[0] === l)![1].split(' ')[0]}
      </text>
    </Scene>
  );
}

/** Food chain: drag the living things into order, from the sun to the predator. */
export function FoodChain({ tc }: { tc: Tc }) {
  const order = ['☀️', '🌿', '🐛', '🐦', '🦊'];
  const names = ['Солнце', 'Трава', 'Гусеница', 'Птица', 'Лиса'];
  const shuffled = [3, 0, 4, 1, 2];
  const slotX = (i: number) => 50 + i * 90;
  const { pos, get } = useDrag(Object.fromEntries(shuffled.map((k, i) => [k, { x: 50 + i * 90, y: 60 }])) as Record<number, { x: number; y: number }>, (id, p) => {
    if (p.y > 120) {
      const i = Math.round((p.x - 50) / 90);
      if (i >= 0 && i < 5) return { x: slotX(i), y: 170 };
    }
  });
  const right = order.every((_, k) => pos[k].y === 170 && pos[k].x === slotX(k));
  return (
    <Scene title={tc('Пищевая цепь')} h={230} notes={[tc('Перетащи картинки вниз по порядку: кто кого ест.')]} controls={right ? <Say>🎉 {tc('Верно: энергия Солнца переходит от растения к животным.')}</Say> : undefined}>
      {order.map((_, i) => (
        <g key={i}>
          <rect x={slotX(i) - 32} y="140" width="64" height="62" rx="12" fill="none" stroke="#c9ced6" strokeDasharray="5 4" />
          {i < 4 && <text x={slotX(i) + 45} y="178" textAnchor="middle" fontSize="16" fill="#9aa7b5">→</text>}
        </g>
      ))}
      {order.map((icon, k) => (
        <g key={k} {...get(k)}>
          <rect x="-32" y="-26" width="64" height="64" rx="12" fill="transparent" />
          <text y="12" textAnchor="middle" fontSize="34" pointerEvents="none">
            {icon}
          </text>
          <text y="32" textAnchor="middle" fontSize="10" fill={INK} pointerEvents="none">
            {tc(names[k])}
          </text>
        </g>
      ))}
    </Scene>
  );
}

/** Earth's layers: tap a layer. */
export function EarthLayers({ tc }: { tc: Tc }) {
  const layers: [string, string, string, number][] = [
    ['Кора', 'Твёрдая каменная оболочка, на ней мы живём. Тонкая, как кожура у яблока.', '#8d6e63', 100],
    ['Мантия', 'Горячий, медленно текущий камень. Из неё выходит лава вулканов.', '#e64a19', 92],
    ['Внешнее ядро', 'Жидкий металл: железо и никель.', '#ffa000', 55],
    ['Внутреннее ядро', 'Твёрдый металлический шар, горячий, как поверхность Солнца.', '#ffd54f', 28],
  ];
  const [p, setP] = useState(0);
  return (
    <Scene title={tc('Земля изнутри')} h={230} notes={[tc('Нажимай на слои.')]} controls={<Say><b>{tc(layers[p][0])}</b>: {tc(layers[p][1])}</Say>}>
      {layers.map(([name, , color, r], i) => (
        <circle key={name} cx="230" cy="115" r={r} fill={color} stroke={p === i ? '#fff' : 'none'} strokeWidth="3" onClick={() => setP(i)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }} />
      ))}
    </Scene>
  );
}

/** Fire needs heat, fuel and air; remove one side and the fire goes out. */
export function FireTriangle({ tc }: { tc: Tc }) {
  const [have, setHave] = useState({ heat: true, fuel: true, air: true });
  const burning = have.heat && have.fuel && have.air;
  const toggle = (k: keyof typeof have) => setHave({ ...have, [k]: !have[k] });
  const side = (k: keyof typeof have, d: string, label: string, lx: number, ly: number) => (
    <g onClick={() => toggle(k)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}>
      <path d={d} stroke={have[k] ? ORANGE : '#d5dbe3'} strokeWidth="10" strokeLinecap="round" />
      <text x={lx} y={ly} textAnchor="middle" fontSize="13" fontWeight="800" fill={have[k] ? INK : '#9aa7b5'}>
        {tc(label)}
      </text>
    </g>
  );
  return (
    <Scene title={tc('Треугольник огня')} h={230} notes={[tc('Нажми на сторону треугольника, чтобы убрать её. Без любой из трёх сторон огонь гаснет.')]} controls={<Say>{burning ? tc('Огонь горит.') : tc('Огонь погас! Так и тушат пожары.')}</Say>}>
      {side('heat', 'M130 190L230 30', 'Тепло', 150, 100)}
      {side('fuel', 'M230 30L330 190', 'Топливо', 320, 100)}
      {side('air', 'M130 190H330', 'Кислород', 230, 215)}
      <text x="230" y="150" textAnchor="middle" fontSize="50" opacity={burning ? 1 : 0.15}>
        🔥
      </text>
    </Scene>
  );
}

/** Sort rubbish into the right recycling bins. */
export function RecycleSort({ tc }: { tc: Tc }) {
  const items: [string, string, string][] = [
    ['bottle', '🍾', 'glass'],
    ['paper', '📰', 'paper'],
    ['can', '🥫', 'plastic'],
    ['box', '📦', 'paper'],
    ['jar', '🫙', 'glass'],
    ['cup', '🥤', 'plastic'],
  ];
  const bins: [string, string, string, number][] = [
    ['paper', 'Бумага', '#4a90e2', 90],
    ['plastic', 'Пластик и металл', '#f5b400', 230],
    ['glass', 'Стекло', '#4caf50', 370],
  ];
  const [msg, setMsg] = useState('');
  const { get } = useDrag(Object.fromEntries(items.map((it, i) => [it[0], { x: 50 + i * 72, y: 45 }])) as Record<string, { x: number; y: number }>, (id, p) => {
    const it = items.find((x) => x[0] === id)!;
    const bin = bins.find((b) => Math.abs(b[3] - p.x) < 60 && p.y > 120);
    if (!bin) return;
    if (bin[0] === it[2]) {
      setMsg(tc('Правильно!'));
      return { x: bin[3] + (Math.random() * 30 - 15), y: 170 };
    }
    setMsg(tc('Не тот контейнер, попробуй другой.'));
    return { x: 50 + items.indexOf(it) * 72, y: 45 };
  });
  return (
    <Scene title={tc('Сортируем мусор')} h={230} notes={[tc('Перетащи каждую вещь в нужный контейнер.')]} controls={msg ? <Say>{msg}</Say> : undefined}>
      {bins.map(([id, name, color, x]) => (
        <g key={id}>
          <rect x={x - 55} y="130" width="110" height="80" rx="10" fill={color} opacity="0.85" />
          <text x={x} y="225" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
            {tc(name)}
          </text>
        </g>
      ))}
      {items.map(([id, icon]) => (
        <g key={id} {...get(id)}>
          <circle r="26" fill="transparent" />
          <text y="12" textAnchor="middle" fontSize="30" pointerEvents="none">
            {icon}
          </text>
        </g>
      ))}
    </Scene>
  );
}

/** Wind and sun make electricity: more wind, faster turbine, brighter lamp. */
export function WindTurbine({ tc }: { tc: Tc }) {
  const [wind, setWind] = useState(40);
  const [sun, setSun] = useState(50);
  const [a, setA] = useState(0);
  useTicker(true, (dt) => setA((x) => (x + dt * wind * 8) % 360));
  const power = Math.round(wind * 0.6 + sun * 0.4);
  return (
    <Scene
      title={tc('Энергия ветра и солнца')}
      h={220}
      notes={[tc('Двигай ползунки ветра и солнца и смотри, как светит лампа.')]}
      controls={
        <>
          <Slider label={<>🌬 {tc('Ветер')}</>} value={wind} min={0} max={100} onChange={setWind} />
          <Slider label={<>☀️ {tc('Солнце')}</>} value={sun} min={0} max={100} onChange={setSun} />
        </>
      }
    >
      <rect x="96" y="80" width="8" height="130" fill="#c9ced6" />
      <g transform={`translate(100 80) rotate(${a})`}>
        {[0, 120, 240].map((r) => (
          <path key={r} d="M0 0L6 -60L-6 -60z" fill="#fff" stroke="#9aa7b5" transform={`rotate(${r})`} />
        ))}
        <circle r="6" fill={INK} />
      </g>
      <rect x="170" y="160" width="80" height="40" fill="#3949ab" transform="skewX(-20)" opacity={0.4 + sun / 170} />
      <circle cx="260" cy="40" r={10 + sun / 6} fill="#ffd23f" />
      <path d="M100 210H380V150" stroke={INK} strokeWidth="3" fill="none" />
      <circle cx="380" cy="130" r="20" fill={`rgba(255,214,0,${power / 100})`} stroke={INK} />
      <circle cx="380" cy="130" r={20 + power / 4} fill="#ffe56b" opacity={power / 250} />
    </Scene>
  );
}

/** A cell under the microscope: tap the parts. */
export function CellParts({ tc }: { tc: Tc }) {
  const parts: [string, string][] = [
    ['Оболочка', 'Как стенка домика: решает, что впустить и что выпустить.'],
    ['Ядро', 'Командный центр: хранит ДНК, инструкцию клетки.'],
    ['Хлоропласты', 'Зелёные кухни растений: делают еду из света.'],
    ['Цитоплазма', 'Жидкость внутри, в ней плавают все части.'],
  ];
  const [p, setP] = useState(1);
  const pick = (i: number) => ({ onClick: () => setP(i), style: { cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" } });
  return (
    <Scene title={tc('Растительная клетка')} h={220} notes={[tc('Нажимай на части клетки.')]} controls={<Say><b>{tc(parts[p][0])}</b>: {tc(parts[p][1])}</Say>}>
      <rect x="90" y="20" width="280" height="180" rx="30" fill="#c8e6c9" stroke={p === 0 ? INK : '#66bb6a'} strokeWidth="8" {...pick(0)} />
      <rect x="104" y="34" width="252" height="152" rx="22" fill="#e8f5e9" {...pick(3)} />
      <circle cx="230" cy="110" r="30" fill="#9575cd" stroke={p === 1 ? INK : 'none'} strokeWidth="3" {...pick(1)} />
      {[[140, 60], [320, 70], [150, 160], [310, 160], [270, 50]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="16" ry="9" fill="#43a047" stroke={p === 2 ? INK : 'none'} {...pick(2)} />
      ))}
    </Scene>
  );
}

/** Newton's second law: more force, faster; more mass, slower. */
export function ForceCart({ tc }: { tc: Tc }) {
  const [force, setForce] = useState(5);
  const [mass, setMass] = useState(2);
  const [x, setX] = useState(30);
  const [run, setRun] = useState(false);
  const v = useState({ v: 0 })[0];
  useTicker(run, (dt) => {
    v.v += (force / mass) * 20 * dt;
    setX((p) => {
      const n = p + v.v * dt;
      if (n > 420) setRun(false);
      return Math.min(420, n);
    });
  });
  return (
    <Scene
      title={tc('Сила, масса и ускорение')}
      h={150}
      notes={[tc('Чем сильнее толкаем, тем быстрее разгон. Чем тяжелее тележка, тем медленнее.')]}
      controls={
        <>
          <Slider label={<>{tc('Сила')}: <b>{force}</b></>} value={force} min={1} max={10} onChange={setForce} />
          <Slider label={<>{tc('Груз')}: <b>{mass}</b></>} value={mass} min={1} max={6} onChange={setMass} />
          <button type="button" className="btn btn-go md-play" onClick={() => { v.v = 0; setX(30); setRun(true); }}>
            ▶ {tc('Поехали')}
          </button>
        </>
      }
    >
      <rect y="110" width="460" height="6" fill="#c9ced6" />
      <g transform={`translate(${x} 70)`}>
        <rect x="-30" y="0" width="60" height="30" rx="5" fill={MINT} />
        {Array.from({ length: mass }, (_, i) => (
          <rect key={i} x={-26 + (i % 3) * 18} y={-14 - Math.floor(i / 3) * 14} width="16" height="13" fill="#8d6e63" />
        ))}
        <circle cx="-18" cy="34" r="7" fill={INK} />
        <circle cx="18" cy="34" r="7" fill={INK} />
      </g>
    </Scene>
  );
}

/** Pressure: boots sink into snow, skis do not. */
export function SnowPressure({ tc }: { tc: Tc }) {
  const [shoe, setShoe] = useState('boots');
  const area = { boots: 1, snowshoes: 4, skis: 6 }[shoe as 'boots'];
  const sink = 60 / area;
  return (
    <Scene title={tc('Давление: почему лыжи не проваливаются')} h={180} notes={[tc('Вес тот же, но если он делится на большую площадь, давление меньше.')]} controls={<Choices items={[['boots', tc('Ботинки')], ['snowshoes', tc('Снегоступы')], ['skis', tc('Лыжи')]]} value={shoe} onChange={setShoe} />}>
      <rect y="100" width="460" height="80" fill="#f4f9fc" />
      <g transform={`translate(230 ${40 + sink})`}>
        <text y="0" textAnchor="middle" fontSize="40">
          🧒
        </text>
        <rect x={-15 * area} y="12" width={30 * area} height="8" rx="4" fill={shoe === 'boots' ? INK : '#4a90e2'} />
      </g>
      <text x="230" y="170" textAnchor="middle" fontSize="12" fill={INK}>
        {tc('Провалился на')} {Math.round(sink / 2)} {tc('см')}
      </text>
    </Scene>
  );
}

export { PEACH, SKY };

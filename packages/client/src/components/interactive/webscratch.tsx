import { useEffect, useState } from 'react';
import { MINT, Say, Scene, Slider, type Tc } from './kit';

/* ---------- Web: edit code and see the page change at once ---------- */

const SAMPLES: Record<string, { title: string; html: string; js?: boolean; notes: string[] }> = {
  tags: {
    title: 'Теги в деле',
    html: '<h1>Мой первый сайт</h1>\n<p>Я люблю <b>котов</b> и <i>рисование</i>.</p>\n<ul>\n  <li>Кот Барсик</li>\n  <li>Кошка Мурка</li>\n</ul>',
    notes: ['Меняй текст и теги слева, справа сразу видна страница.', 'Попробуй заменить h1 на h2 или добавить ещё один <li>.'],
  },
  css: {
    title: 'CSS меняет вид',
    html: '<style>\n  h1 { color: tomato; text-align: center; }\n  p { background: #e6f7ff; padding: 10px; border-radius: 12px; }\n</style>\n<h1>Привет!</h1>\n<p>Это абзац с фоном и скруглёнными углами.</p>',
    notes: ['Поменяй цвет tomato на green или blue.', 'Каждое правило: селектор { свойство: значение; }.'],
  },
  card: {
    title: 'Карточка своими руками',
    html: '<style>\n  .card { width: 200px; margin: auto; padding: 16px; border-radius: 16px;\n          background: #fff5e6; box-shadow: 0 6px 16px #0002; text-align: center; }\n  .card img { font-size: 60px; }\n</style>\n<div class="card">\n  <div class="img">🐶</div>\n  <h3>Шарик</h3>\n  <p>Люблю гулять и грызть косточки.</p>\n</div>',
    notes: ['Измени имя, эмодзи и цвет фона карточки.', 'Тень box-shadow делает карточку объёмной.'],
  },
  button: {
    title: 'Кнопка с JavaScript',
    js: true,
    html: '<button onclick="hello()">Нажми меня</button>\n<p id="msg"></p>\n<script>\n  function hello() {\n    document.getElementById("msg").textContent = "Привет от JavaScript!";\n  }\n</script>',
    notes: ['Нажми кнопку справа.', 'Поменяй текст сообщения в кавычках и нажми ещё раз.'],
  },
  clicker: {
    title: 'Кликер: событие click',
    js: true,
    html: '<button id="btn">🍪 Печенька</button>\n<p>Очки: <b id="score">0</b></p>\n<script>\n  let score = 0;\n  document.getElementById("btn").addEventListener("click", () => {\n    score = score + 1;\n    document.getElementById("score").textContent = score;\n  });\n</script>',
    notes: ['Каждый клик запускает функцию и увеличивает счёт.', 'Попробуй прибавлять по 10 очков за клик.'],
  },
};

/** A tiny code editor next to a live page, rebuilt after every change. */
export function LiveHtml({ tc, sample }: { tc: Tc; sample: keyof typeof SAMPLES }) {
  const s = SAMPLES[sample];
  const [code, setCode] = useState(s.html);
  const [doc, setDoc] = useState(s.html);
  useEffect(() => {
    const t = window.setTimeout(() => setDoc(code), 350);
    return () => window.clearTimeout(t);
  }, [code]);
  return (
    <figure className="music-diagram scene live-html">
      <figcaption className="md-title">{tc(s.title)}</figcaption>
      <div className="lh-main">
        <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} aria-label={tc('Код')} />
        <iframe
          title={tc('Страница')}
          sandbox={s.js ? 'allow-scripts' : ''}
          srcDoc={`<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;margin:12px">${doc}</body>`}
        />
      </div>
      <div className="scene-controls">
        <button type="button" className="btn btn-light btn-small" onClick={() => setCode(s.html)}>
          ↺ {tc('Вернуть как было')}
        </button>
      </div>
      <ol className="md-notes">
        {s.notes.map((n) => (
          <li key={n}>{tc(n)}</li>
        ))}
      </ol>
    </figure>
  );
}

/** Flexbox: switch the properties and watch the boxes move. */
export function FlexPlay({ tc }: { tc: Tc }) {
  const [dir, setDir] = useState('row');
  const [justify, setJustify] = useState('flex-start');
  const [align, setAlign] = useState('stretch');
  const pick = (label: string, value: string, set: (v: string) => void, items: string[]) => (
    <div className="flex-pick">
      <code>{label}:</code>
      {items.map((x) => (
        <button key={x} type="button" className={`fchip${value === x ? ' on' : ''}`} onClick={() => set(x)}>
          {x}
        </button>
      ))}
    </div>
  );
  return (
    <figure className="music-diagram scene flex-play">
      <figcaption className="md-title">{tc('Flexbox: раскладываем блоки')}</figcaption>
      <div className="fp-box" style={{ flexDirection: dir as 'row', justifyContent: justify, alignItems: align }}>
        {['🍎', '🍌', '🍇'].map((f, i) => (
          <span key={f} style={{ minHeight: align === 'stretch' ? undefined : 40 + i * 14 }}>
            {f}
          </span>
        ))}
      </div>
      <pre className="code algo-code">{`.menu {\n  display: flex;\n  flex-direction: ${dir};\n  justify-content: ${justify};\n  align-items: ${align};\n}`}</pre>
      {pick('flex-direction', dir, setDir, ['row', 'column'])}
      {pick('justify-content', justify, setJustify, ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'])}
      {pick('align-items', align, setAlign, ['stretch', 'flex-start', 'center', 'flex-end'])}
    </figure>
  );
}

/* ---------- Scratch: blocks run and the sprite moves ---------- */

const Block = ({ color, children, on, inner }: { color: string; children: React.ReactNode; on?: boolean; inner?: boolean }) => (
  <div className={`sb-block${on ? ' on' : ''}${inner ? ' inner' : ''}`} style={{ background: color }}>
    {children}
  </div>
);

/** x and y: the stage is a grid, the cat goes where the block says. */
export function ScratchXY({ tc }: { tc: Tc }) {
  const [x, setX] = useState(100);
  const [y, setY] = useState(50);
  const sx = 230 + x * 0.9;
  const sy = 130 - y * 0.9;
  return (
    <Scene
      title={tc('Координаты x и y')}
      w={460}
      h={260}
      notes={[tc('x — вправо и влево от центра, y — вверх и вниз.'), tc('Центр сцены: x = 0, y = 0.')]}
      controls={
        <>
          <div className="sb-script">
            <Block color="#4c97ff">
              {tc('перейти в')} x: <b>{x}</b> y: <b>{y}</b>
            </Block>
          </div>
          <Slider label={`x = ${x}`} value={x} min={-240} max={240} step={10} onChange={setX} />
          <Slider label={`y = ${y}`} value={y} min={-130} max={130} step={10} onChange={setY} />
        </>
      }
    >
      <rect x="10" y="10" width="440" height="240" rx="10" fill="#f4fbff" stroke="#cfe3f3" />
      <path d="M230 10 V250 M10 130 H450" stroke="#bcd" strokeDasharray="4 4" />
      <text x="440" y="124" fontSize="12" textAnchor="end" fill="#678">
        x
      </text>
      <text x="236" y="22" fontSize="12" fill="#678">
        y
      </text>
      <path d={`M${sx} 130 V${sy} M230 ${sy} H${sx}`} stroke="#f2a07b" strokeDasharray="3 3" />
      <text x={sx} y={sy + 10} textAnchor="middle" fontSize="30" style={{ transition: 'all 0.35s ease' }}>
        🐱
      </text>
      <text x={sx} y={sy + 30} textAnchor="middle" fontSize="11" fill="#445">
        ({x}; {y})
      </text>
    </Scene>
  );
}

/** "Repeat" with the pen: the same two blocks, run again and again, draw a star or a polygon. */
export function ScratchRepeat({ tc, star = false }: { tc: Tc; star?: boolean }) {
  const [times, setTimes] = useState(5);
  const [turn, setTurn] = useState(star ? 144 : 72);
  const [k, setK] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (k >= times * 2) return setRunning(false);
    const t = window.setTimeout(() => setK(k + 1), 380);
    return () => window.clearTimeout(t);
  }, [running, k, times]);
  const len = 110;
  const pts = [{ x: 0, y: 0, a: 0 }];
  for (let i = 0; i < times; i++) {
    const p = pts[pts.length - 1];
    pts.push({ x: p.x + len * Math.cos(p.a), y: p.y + len * Math.sin(p.a), a: p.a + (turn * Math.PI) / 180 });
  }
  const drawn = Math.floor((k + 1) / 2);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const dx = 230 - (Math.min(...xs) + Math.max(...xs)) / 2;
  const dy = 115 - (Math.min(...ys) + Math.max(...ys)) / 2;
  const cur = pts[Math.min(drawn, pts.length - 1)];
  const step = k % 2;
  const shape = (times * turn) % 360 === 0 ? (turn === 144 && times === 5 ? tc('Звезда!') : tc('Фигура замкнулась!')) : tc('Фигура не замкнулась: попробуй другой угол.');
  return (
    <Scene
      title={star ? tc('Звезда из цикла') : tc('Блок «повторить»')}
      w={460}
      h={230}
      notes={[tc('Внутри «повторить» всего два блока, но рисунок получается целый.'), tc('Звезда: 5 раз по 144°. Квадрат: 4 раза по 90°.')]}
      controls={
        <>
          <div className="sb-script">
            <Block color="#ffbf00">{tc('когда 🏁 нажат')}</Block>
            <Block color="#ffab19" on={running}>
              {tc('повторить')} <b>{times}</b> {tc('раз')}
            </Block>
            <Block color="#4c97ff" inner on={running && step === 1}>
              {tc('идти')} {len} {tc('шагов')}
            </Block>
            <Block color="#4c97ff" inner on={running && step === 0 && k > 0}>
              {tc('повернуть на')} <b>{turn}</b>°
            </Block>
          </div>
          <Slider label={`${tc('Сколько раз')}: ${times}`} value={times} min={3} max={10} onChange={(v) => (setK(0), setRunning(false), setTimes(v))} />
          <Slider label={`${tc('Угол')}: ${turn}°`} value={turn} min={30} max={170} step={1} onChange={(v) => (setK(0), setRunning(false), setTurn(v))} />
          <button type="button" className="btn btn-go btn-small" onClick={() => (setK(0), setRunning(true))}>
            🏁 {tc('Запустить')}
          </button>
          {!running && k > 0 && <Say>{shape}</Say>}
        </>
      }
    >
      <g transform={`translate(${dx} ${dy})`}>
        <polyline points={pts.slice(0, drawn + 1).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={MINT} strokeWidth="4" strokeLinejoin="round" />
        <text x={cur.x} y={cur.y + 9} textAnchor="middle" fontSize="24">
          🐱
        </text>
      </g>
    </Scene>
  );
}

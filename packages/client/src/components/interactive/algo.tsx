import { useEffect, useMemo, useState } from 'react';
import { MINT, ORANGE, PEACH, Say, Scene, Slider, type Tc } from './kit';

/**
 * Algorithms shown step by step: each scene builds the list of frames an algorithm goes through,
 * and the child plays them, goes one step forward or back, or starts again.
 */
function useSteps(count: number, ms = 700) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (i >= count - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setI((n) => Math.min(count - 1, n + 1)), ms);
    return () => window.clearTimeout(id);
  }, [playing, i, count, ms]);
  useEffect(() => setI((n) => Math.min(n, Math.max(0, count - 1))), [count]);
  return {
    i,
    playing,
    play: () => {
      if (i >= count - 1) setI(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    next: () => setI((n) => Math.min(count - 1, n + 1)),
    prev: () => setI((n) => Math.max(0, n - 1)),
    reset: () => {
      setPlaying(false);
      setI(0);
    },
  };
}

function StepBar({ s, count, tc }: { s: ReturnType<typeof useSteps>; count: number; tc: Tc }) {
  return (
    <div className="algo-bar">
      <button type="button" className="btn btn-light btn-small" onClick={s.reset} aria-label={tc('Сначала')}>
        ⏮
      </button>
      <button type="button" className="btn btn-light btn-small" onClick={s.prev} disabled={s.i === 0} aria-label={tc('Шаг назад')}>
        ◀
      </button>
      <button type="button" className="btn btn-go btn-small" onClick={s.playing ? s.pause : s.play}>
        {s.playing ? `⏸ ${tc('Пауза')}` : `▶ ${tc('Запустить')}`}
      </button>
      <button type="button" className="btn btn-light btn-small" onClick={s.next} disabled={s.i >= count - 1} aria-label={tc('Шаг вперёд')}>
        ▶|
      </button>
      <span className="muted small">
        {tc('Шаг')} {s.i + 1} / {count}
      </span>
    </div>
  );
}

const shuffle = (n: number, seed: number) => {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  let h = seed;
  for (let i = n - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- 1. A robot follows a program on a grid ---------- */

type Cmd = 'up' | 'down' | 'left' | 'right';
const ARROW: Record<Cmd, string> = { up: '↑', down: '↓', left: '←', right: '→' };
const MOVE: Record<Cmd, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** An algorithm is a list of exact commands: the robot does exactly what is written, step by step. */
export function RobotProgram({ tc }: { tc: Tc }) {
  const N = 5;
  const goal = { x: 4, y: 0 };
  const walls = ['2,1', '2,2', '1,3'];
  const [prog, setProg] = useState<Cmd[]>(['right', 'right', 'up', 'up']);
  const frames = useMemo(() => {
    const out = [{ x: 0, y: 4, hit: false }];
    let p = { x: 0, y: 4 };
    for (const c of prog) {
      const n = { x: p.x + MOVE[c][0], y: p.y + MOVE[c][1] };
      if (n.x < 0 || n.y < 0 || n.x >= N || n.y >= N || walls.includes(`${n.x},${n.y}`)) {
        out.push({ ...p, hit: true });
        break;
      }
      p = n;
      out.push({ ...p, hit: false });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prog]);
  const s = useSteps(frames.length, 600);
  const f = frames[s.i];
  const last = frames[frames.length - 1];
  const done = s.i === frames.length - 1;
  const C = 44;
  return (
    <Scene
      title={tc('Робот выполняет алгоритм')}
      w={460}
      h={240}
      notes={[tc('Добавляй стрелки, чтобы робот дошёл до флажка и не врезался в стену.'), tc('Робот выполняет команды строго по порядку, одну за другой.')]}
      controls={
        <>
          <div className="algo-prog">
            {prog.map((c, k) => (
              <span key={k} className={k === s.i - 1 ? 'on' : ''}>
                {ARROW[c]}
              </span>
            ))}
          </div>
          <div className="chips-row">
            {(Object.keys(ARROW) as Cmd[]).map((c) => (
              <button key={c} type="button" className="fchip" onClick={() => (s.reset(), setProg((p) => (p.length < 12 ? [...p, c] : p)))}>
                {ARROW[c]}
              </button>
            ))}
            <button type="button" className="fchip" onClick={() => (s.reset(), setProg((p) => p.slice(0, -1)))}>
              ⌫
            </button>
            <button type="button" className="fchip" onClick={() => (s.reset(), setProg([]))}>
              {tc('Очистить')}
            </button>
          </div>
          <StepBar s={s} count={frames.length} tc={tc} />
          {done && (
            <Say>
              {last.hit ? `💥 ${tc('Робот упёрся в стену. Найди ошибку в программе!')}` : last.x === goal.x && last.y === goal.y ? `🏁 ${tc('Ура! Алгоритм привёл робота к флажку.')}` : tc('Программа закончилась, а флажок ещё не достигнут.')}
            </Say>
          )}
        </>
      }
    >
      <g transform="translate(120 10)">
        {Array.from({ length: N * N }, (_, k) => {
          const x = k % N;
          const y = Math.floor(k / N);
          const wall = walls.includes(`${x},${y}`);
          return <rect key={k} x={x * C} y={y * C} width={C - 2} height={C - 2} rx="6" fill={wall ? '#8a6d5a' : '#fdf6ec'} stroke="#ecd9c6" />;
        })}
        <text x={goal.x * C + 21} y={goal.y * C + 30} textAnchor="middle" fontSize="24">
          🏁
        </text>
        <g style={{ transition: 'transform 0.45s ease' }} transform={`translate(${f.x * C + 21} ${f.y * C + 22})`}>
          <text textAnchor="middle" y="9" fontSize="26">
            {f.hit && s.i === frames.length - 1 ? '😵' : '🤖'}
          </text>
        </g>
      </g>
    </Scene>
  );
}

/* ---------- 2. A loop draws a pattern ---------- */

/** "Repeat N times": a short program draws a long pattern. */
export function LoopPattern({ tc }: { tc: Tc }) {
  const [n, setN] = useState(5);
  const [shape, setShape] = useState(0);
  const SH = ['🔴🔵', '⭐🌙', '🟩🟨🟥'];
  const parts = [...SH[shape]].filter((c) => c.trim());
  const s = useSteps(n + 1, 450);
  return (
    <Scene
      title={tc('Цикл «повторить»')}
      w={460}
      h={150}
      notes={[tc('Тело цикла пишут один раз, а компьютер повторяет его столько раз, сколько скажешь.')]}
      controls={
        <>
          <pre className="code algo-code">
            {`${tc('повторить')} ${n} ${tc('раз')}:\n    ${tc('нарисовать')} ${parts.join(' ')}`}
          </pre>
          <Slider label={tc('Сколько раз')} value={n} min={1} max={8} onChange={(v) => (s.reset(), setN(v))} />
          <div className="chips-row">
            {SH.map((x, k) => (
              <button key={x} type="button" className={`fchip${k === shape ? ' on' : ''}`} onClick={() => (s.reset(), setShape(k))}>
                {x}
              </button>
            ))}
          </div>
          <StepBar s={s} count={n + 1} tc={tc} />
        </>
      }
    >
      {Array.from({ length: s.i }, (_, k) =>
        parts.map((p, j) => (
          <text key={`${k}-${j}`} x={14 + (k * parts.length + j) * (430 / (8 * parts.length))} y="80" fontSize={parts.length > 2 ? 15 : 20} className="pop-in">
            {p}
          </text>
        )),
      )}
      <text x="230" y="130" textAnchor="middle" fontSize="13" fill="#667">
        {tc('Повтор')} {s.i} / {n}
      </text>
    </Scene>
  );
}

/* ---------- 3. If / else on a flowchart ---------- */

/** A decision in an algorithm: the flowchart lights up the way the program goes. */
export function IfElseFlow({ tc }: { tc: Tc }) {
  const [rain, setRain] = useState<boolean | null>(null);
  const on = (yes: boolean) => rain !== null && rain === yes;
  const box = (x: number, y: number, w: number, text: string, lit: boolean) => (
    <g>
      <rect x={x - w / 2} y={y - 17} width={w} height="34" rx="10" fill={lit ? '#d8f2e5' : '#fff'} stroke={lit ? MINT : '#ccc'} strokeWidth="2" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="700">
        {text}
      </text>
    </g>
  );
  return (
    <Scene
      title={tc('Если… то… иначе')}
      w={460}
      h={250}
      notes={[tc('Выбери погоду и посмотри, по какой ветке пойдёт программа.')]}
      controls={
        <div className="chips-row">
          <button type="button" className={`fchip${rain === true ? ' on' : ''}`} onClick={() => setRain(true)}>
            🌧 {tc('Дождь')}
          </button>
          <button type="button" className={`fchip${rain === false ? ' on' : ''}`} onClick={() => setRain(false)}>
            ☀️ {tc('Солнце')}
          </button>
        </div>
      }
    >
      {box(230, 25, 140, tc('Выхожу из дома'), rain !== null)}
      <path d="M230 42 V64" stroke="#999" strokeWidth="2" />
      <polygon points="230,64 320,104 230,144 140,104" fill={rain !== null ? '#fff4d6' : '#fff'} stroke={rain !== null ? '#f2c14e' : '#ccc'} strokeWidth="2" />
      <text x="230" y="109" textAnchor="middle" fontSize="13" fontWeight="700">
        {tc('Идёт дождь?')}
      </text>
      <path d="M140 104 H80 V190" stroke={on(true) ? MINT : '#ccc'} strokeWidth={on(true) ? 4 : 2} fill="none" />
      <path d="M320 104 H380 V190" stroke={on(false) ? MINT : '#ccc'} strokeWidth={on(false) ? 4 : 2} fill="none" />
      <text x="105" y="96" fontSize="12" fill="#2f7d5b" fontWeight="700">
        {tc('да')}
      </text>
      <text x="335" y="96" fontSize="12" fill={ORANGE} fontWeight="700">
        {tc('нет')}
      </text>
      {box(80, 205, 140, `☂️ ${tc('Беру зонтик')}`, on(true))}
      {box(380, 205, 140, `🧢 ${tc('Беру кепку')}`, on(false))}
    </Scene>
  );
}

/** AND, OR, NOT: switch the inputs and see when the lamp lights up. */
export function LogicGates({ tc }: { tc: Tc }) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [op, setOp] = useState<'and' | 'or' | 'not'>('and');
  const out = op === 'and' ? a && b : op === 'or' ? a || b : !a;
  const sw = (v: boolean, set: (v: boolean) => void, y: number, name: string) => (
    <g onClick={() => set(!v)} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}>
      <rect x="30" y={y - 16} width="70" height="32" rx="16" fill={v ? MINT : '#ddd'} />
      <circle cx={v ? 84 : 46} cy={y} r="13" fill="#fff" style={{ transition: 'cx 0.2s' }} />
      <text x="16" y={y + 5} fontSize="16" fontWeight="800" textAnchor="middle">
        {name}
      </text>
      <text x="65" y={y + 32} fontSize="11" textAnchor="middle" fill="#667">
        {v ? tc('истина') : tc('ложь')}
      </text>
    </g>
  );
  return (
    <Scene
      title={tc('И, ИЛИ, НЕ')}
      w={460}
      h={200}
      notes={[tc('Нажимай на переключатели A и B.'), tc('И — нужны оба. ИЛИ — хватит одного. НЕ — наоборот.')]}
      controls={
        <div className="chips-row">
          {(['and', 'or', 'not'] as const).map((k) => (
            <button key={k} type="button" className={`fchip${op === k ? ' on' : ''}`} onClick={() => setOp(k)}>
              {k === 'and' ? tc('И') : k === 'or' ? tc('ИЛИ') : tc('НЕ')}
            </button>
          ))}
        </div>
      }
    >
      {sw(a, setA, 60, 'A')}
      {op !== 'not' && sw(b, setB, 140, 'B')}
      <path d={`M100 60 H180 ${op !== 'not' ? 'M100 140 H180' : ''}`} stroke={a || b ? MINT : '#bbb'} strokeWidth="3" />
      <rect x="180" y="40" width="110" height={op === 'not' ? 40 : 120} rx="18" fill="#efeaff" stroke="#9a8ee0" strokeWidth="2" />
      <text x="235" y={op === 'not' ? 66 : 106} textAnchor="middle" fontSize="20" fontWeight="800" fill="#5b4bb7">
        {op === 'and' ? tc('И') : op === 'or' ? tc('ИЛИ') : tc('НЕ')}
      </text>
      <path d={`M290 ${op === 'not' ? 60 : 100} H360`} stroke={out ? '#f2c14e' : '#bbb'} strokeWidth="3" />
      <circle cx="385" cy={op === 'not' ? 60 : 100} r="24" fill={out ? '#ffe066' : '#eee'} stroke={out ? '#f2a000' : '#ccc'} strokeWidth="3" />
      <text x="385" y={(op === 'not' ? 60 : 100) + 7} textAnchor="middle" fontSize="20">
        💡
      </text>
      <text x="385" y={(op === 'not' ? 60 : 100) + 45} textAnchor="middle" fontSize="12" fontWeight="700" fill={out ? '#2f7d5b' : '#999'}>
        {out ? tc('горит') : tc('не горит')}
      </text>
    </Scene>
  );
}

/* ---------- 4. Debugging: step through a program and find the wrong line ---------- */

/** Running a program line by line shows exactly where it goes wrong. */
export function DebugSteps({ tc }: { tc: Tc }) {
  const [fixed, setFixed] = useState(false);
  const lines = [tc('вперёд'), tc('вперёд'), fixed ? tc('повернуть налево') : tc('повернуть направо'), tc('вперёд'), tc('взять яблоко')];
  // Positions after each line: the bug turns the hedgehog into the pond.
  const path = fixed
    ? [{ x: 0, y: 2, d: 0 }, { x: 1, y: 2, d: 0 }, { x: 2, y: 2, d: 0 }, { x: 2, y: 2, d: -90 }, { x: 2, y: 1, d: -90 }, { x: 2, y: 1, d: -90 }]
    : [{ x: 0, y: 2, d: 0 }, { x: 1, y: 2, d: 0 }, { x: 2, y: 2, d: 0 }, { x: 2, y: 2, d: 90 }, { x: 2, y: 3, d: 90 }, { x: 2, y: 3, d: 90 }];
  const s = useSteps(path.length, 800);
  const p = path[s.i];
  const C = 46;
  const wet = !fixed && s.i >= 4;
  return (
    <Scene
      title={tc('Отладка по шагам')}
      w={460}
      h={210}
      notes={[tc('Запусти по шагам и найди строку, после которой ёжик пошёл не туда.'), tc('Потом нажми «Исправить» и проверь ещё раз.')]}
      controls={
        <>
          <ol className="algo-lines">
            {lines.map((l, k) => (
              <li key={k} className={`${k === s.i - 1 ? 'on' : ''}${!fixed && k === 2 && s.i >= 4 ? ' bug' : ''}`}>
                {l}
              </li>
            ))}
          </ol>
          <StepBar s={s} count={path.length} tc={tc} />
          <div className="chips-row">
            <button type="button" className={`fchip${fixed ? ' on' : ''}`} onClick={() => (s.reset(), setFixed(!fixed))}>
              🔧 {fixed ? tc('Вернуть ошибку') : tc('Исправить строку 3')}
            </button>
          </div>
          {s.i === path.length - 1 && <Say>{wet ? `💦 ${tc('Ёжик упал в пруд! Ошибка в строке 3: нужно повернуть налево.')}` : `🍎 ${tc('Ёжик взял яблоко. Ошибка исправлена!')}`}</Say>}
        </>
      }
    >
      <g transform="translate(150 10)">
        {Array.from({ length: 16 }, (_, k) => (
          <rect key={k} x={(k % 4) * C} y={Math.floor(k / 4) * C} width={C - 2} height={C - 2} rx="6" fill={k === 14 ? '#bfe3ff' : '#eaf6e3'} />
        ))}
        <text x={2 * C + 22} y={1 * C + 30} textAnchor="middle" fontSize="24">
          🍎
        </text>
        <g style={{ transition: 'transform 0.5s ease' }} transform={`translate(${p.x * C + 22} ${p.y * C + 22})`}>
          <text textAnchor="middle" y="9" fontSize="26">
            {wet ? '💦' : '🦔'}
          </text>
        </g>
      </g>
    </Scene>
  );
}

/* ---------- 5. A tree of choices ---------- */

/** All the outfits from 2 T-shirts and 3 trousers: a tree of choices that grows level by level. */
export function ChoiceTree({ tc }: { tc: Tc }) {
  const shirts = ['👕', '🎽'];
  const pants = ['👖', '🩳', '👗'];
  const s = useSteps(3, 900);
  return (
    <Scene
      title={tc('Дерево вариантов')}
      w={460}
      h={230}
      notes={[tc('Сначала выбираем футболку, потом к каждой футболке — низ.'), tc('2 × 3 = 6 вариантов, и ни один не потерялся.')]}
      controls={<StepBar s={s} count={3} tc={tc} />}
    >
      <circle cx="230" cy="24" r="16" fill={PEACH} />
      <text x="230" y="29" textAnchor="middle" fontSize="13" fontWeight="800">
        {tc('старт')}
      </text>
      {s.i >= 1 &&
        shirts.map((sh, a) => {
          const x = 120 + a * 220;
          return (
            <g key={sh} className="pop-in">
              <path d={`M230 40 L${x} 90`} stroke="#bbb" strokeWidth="2" />
              <text x={x} y="108" textAnchor="middle" fontSize="28">
                {sh}
              </text>
              {s.i >= 2 &&
                pants.map((pt, b) => {
                  const px = x - 70 + b * 70;
                  return (
                    <g key={pt} className="pop-in">
                      <path d={`M${x} 118 L${px} 160`} stroke="#bbb" strokeWidth="2" />
                      <text x={px} y="185" textAnchor="middle" fontSize="24">
                        {pt}
                      </text>
                      <text x={px} y="210" textAnchor="middle" fontSize="12" fill="#667">
                        {a * 3 + b + 1}
                      </text>
                    </g>
                  );
                })}
            </g>
          );
        })}
    </Scene>
  );
}

/* ---------- 6. Sorting ---------- */

type SortFrame = { a: number[]; cmp: number[]; swap: boolean; done: number[] };

function bubbleFrames(start: number[]): SortFrame[] {
  const a = [...start];
  const out: SortFrame[] = [{ a: [...a], cmp: [], swap: false, done: [] }];
  const done: number[] = [];
  for (let end = a.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      const swap = a[i] > a[i + 1];
      out.push({ a: [...a], cmp: [i, i + 1], swap, done: [...done] });
      if (swap) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        out.push({ a: [...a], cmp: [i, i + 1], swap: true, done: [...done] });
      }
    }
    done.push(end);
  }
  out.push({ a: [...a], cmp: [], swap: false, done: a.map((_, i) => i) });
  return out;
}

function selectionFrames(start: number[]): SortFrame[] {
  const a = [...start];
  const out: SortFrame[] = [{ a: [...a], cmp: [], swap: false, done: [] }];
  const done: number[] = [];
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      out.push({ a: [...a], cmp: [min, j], swap: false, done: [...done] });
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      out.push({ a: [...a], cmp: [i, min], swap: true, done: [...done] });
    }
    done.push(i);
  }
  out.push({ a: [...a], cmp: [], swap: false, done: a.map((_, i) => i) });
  return out;
}

/** Bubble sort or selection sort on bars: compared bars light up, swapped ones jump. */
export function SortBars({ tc, kind }: { tc: Tc; kind: 'bubble' | 'selection' }) {
  const [seed, setSeed] = useState(7);
  const start = useMemo(() => shuffle(8, seed), [seed]);
  const frames = useMemo(() => (kind === 'bubble' ? bubbleFrames(start) : selectionFrames(start)), [start, kind]);
  const s = useSteps(frames.length, 450);
  const f = frames[s.i];
  const compares = frames.slice(0, s.i + 1).filter((x) => x.cmp.length && !x.swap).length;
  return (
    <Scene
      title={kind === 'bubble' ? tc('Сортировка пузырьком') : tc('Сортировка выбором')}
      w={460}
      h={210}
      notes={
        kind === 'bubble'
          ? [tc('Сравниваем двух соседей. Если левый больше, меняем их местами.'), tc('Самый большой «всплывает» в конец, как пузырёк.')]
          : [tc('Ищем самый маленький столбик и ставим его в начало.'), tc('Потом ищем самый маленький из оставшихся, и так далее.')]
      }
      controls={
        <>
          <StepBar s={s} count={frames.length} tc={tc} />
          <div className="chips-row">
            <button type="button" className="fchip" onClick={() => (s.reset(), setSeed((x) => x + 13))}>
              🔀 {tc('Перемешать')}
            </button>
            <span className="muted small">
              {tc('Сравнений')}: {compares}
            </span>
          </div>
        </>
      }
    >
      {f.a.map((v, i) => {
        const lit = f.cmp.includes(i);
        const fill = f.done.includes(i) ? MINT : lit ? (f.swap ? ORANGE : '#f2c14e') : '#a9c7f0';
        return (
          <g key={v} style={{ transition: 'transform 0.35s ease' }} transform={`translate(${40 + i * 50} 0)`}>
            <rect x="0" y={180 - v * 19} width="38" height={v * 19} rx="6" fill={fill} />
            <text x="19" y="198" textAnchor="middle" fontSize="13" fontWeight="700">
              {v}
            </text>
          </g>
        );
      })}
    </Scene>
  );
}

/* ---------- 7. Binary numbers ---------- */

/** Bits are switches worth 128, 64 … 2, 1; the number is the sum of the switched-on ones. */
export function BinaryBits({ tc, bits = 8 }: { tc: Tc; bits?: number }) {
  const [on, setOn] = useState<boolean[]>(() => Array.from({ length: bits }, (_, i) => i === bits - 1 || i === bits - 3));
  const values = on.map((_, i) => 2 ** (bits - 1 - i));
  const sum = on.reduce((n, b, i) => n + (b ? values[i] : 0), 0);
  const W = 420 / bits;
  return (
    <Scene
      title={bits === 8 ? tc('Байт: восемь битов') : tc('Двоичное число')}
      w={460}
      h={170}
      notes={[tc('Нажимай на лампочки. Горит — это 1, не горит — 0.'), tc('Число равно сумме весов горящих лампочек.')]}
      controls={
        <Say>
          <code>{on.map((b) => (b ? 1 : 0)).join('')}</code> = {on.map((b, i) => (b ? values[i] : null)).filter(Boolean).join(' + ') || '0'} = <b>{sum}</b>
        </Say>
      }
    >
      {on.map((b, i) => (
        <g
          key={i}
          transform={`translate(${20 + i * W + W / 2} 0)`}
          onClick={() => setOn((x) => x.map((v, k) => (k === i ? !v : v)))}
          style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}
        >
          <text y="24" textAnchor="middle" fontSize="13" fill="#667" fontWeight="700">
            {values[i]}
          </text>
          <circle cy="68" r={Math.min(22, W / 2.3)} fill={b ? '#ffe066' : '#eee'} stroke={b ? '#f2a000' : '#ccc'} strokeWidth="3" />
          <text y="76" textAnchor="middle" fontSize="20" fontWeight="800">
            {b ? 1 : 0}
          </text>
        </g>
      ))}
      <text x="230" y="140" textAnchor="middle" fontSize="16">
        {tc('В десятичной системе')}: <tspan fontWeight="800">{sum}</tspan>
      </text>
    </Scene>
  );
}

/* ---------- 8. Binary search ---------- */

/** Guess a number from 1 to 100: every question cuts the range in half. */
export function BinarySearch({ tc }: { tc: Tc }) {
  const [secret, setSecret] = useState(37);
  const frames = useMemo(() => {
    const out: { lo: number; hi: number; mid: number | null }[] = [{ lo: 1, hi: 100, mid: null }];
    let lo = 1;
    let hi = 100;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      out.push({ lo, hi, mid });
      if (mid === secret) break;
      if (mid < secret) lo = mid + 1;
      else hi = mid - 1;
    }
    return out;
  }, [secret]);
  const s = useSteps(frames.length, 1100);
  const f = frames[s.i];
  const x = (n: number) => 20 + ((n - 1) / 99) * 420;
  const found = f.mid === secret;
  return (
    <Scene
      title={tc('Двоичный поиск')}
      w={460}
      h={170}
      notes={[tc('Задумай число и смотри: каждый вопрос «больше или меньше?» убирает половину чисел.'), tc('Из 100 чисел нужное находится не больше чем за 7 вопросов.')]}
      controls={
        <>
          <Slider label={`${tc('Загаданное число')}: ${secret}`} value={secret} min={1} max={100} onChange={(v) => (s.reset(), setSecret(v))} />
          <StepBar s={s} count={frames.length} tc={tc} />
          {f.mid !== null && (
            <Say>
              {tc('Вопрос')} {s.i}: {tc('это')} {f.mid}?{' '}
              {found ? `🎉 ${tc('Да! Нашли за')} ${s.i} ${tc('вопр.')}` : f.mid < secret ? `${tc('Нет, загаданное больше')} ⬆` : `${tc('Нет, загаданное меньше')} ⬇`}
            </Say>
          )}
        </>
      }
    >
      <rect x="20" y="60" width="420" height="26" rx="13" fill="#eee" />
      <rect x={x(f.lo)} y="60" width={Math.max(6, x(f.hi) - x(f.lo) + 4)} height="26" rx="13" fill={found ? MINT : '#a9c7f0'} style={{ transition: 'all 0.5s ease' }} />
      {f.mid !== null && (
        <g style={{ transition: 'transform 0.5s ease' }} transform={`translate(${x(f.mid)} 0)`}>
          <path d="M0 56 L-7 44 L7 44 Z" fill={ORANGE} />
          <text y="38" textAnchor="middle" fontSize="15" fontWeight="800" fill={ORANGE}>
            {f.mid}
          </text>
        </g>
      )}
      <text x="20" y="108" fontSize="12" fill="#667">
        1
      </text>
      <text x="440" y="108" fontSize="12" fill="#667" textAnchor="end">
        100
      </text>
      <text x="230" y="140" textAnchor="middle" fontSize="13" fill="#445">
        {tc('Осталось чисел')}: {found ? 1 : f.hi - f.lo + 1}
      </text>
    </Scene>
  );
}

/* ---------- 9. Shortest path: the wave ---------- */

const MAZE = ['S..#....', '.#.#.##.', '.#...#..', '.####.#.', '......#F'];

/**
 * Breadth-first search as a wave: the start gets 0, its free neighbours 1, theirs 2 and so on.
 * When the wave reaches the finish, the path is traced back through numbers that go down by one.
 * Clicking a cell adds or removes a wall.
 */
export function WaveMaze({ tc }: { tc: Tc }) {
  const [grid, setGrid] = useState(() => MAZE.map((r) => [...r]));
  const H = grid.length;
  const W = grid[0].length;
  const find = (ch: string) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === ch) return { x, y };
    return { x: 0, y: 0 };
  };
  const frames = useMemo(() => {
    const S = find('S');
    const F = find('F');
    const dist: number[][] = grid.map((r) => r.map(() => -1));
    dist[S.y][S.x] = 0;
    let front = [S];
    const out: { dist: number[][]; path: string[] }[] = [{ dist: dist.map((r) => [...r]), path: [] }];
    let reached = false;
    while (front.length && !reached) {
      const next: { x: number; y: number }[] = [];
      for (const p of front)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = p.x + dx;
          const y = p.y + dy;
          if (x < 0 || y < 0 || x >= W || y >= H || grid[y][x] === '#' || dist[y][x] >= 0) continue;
          dist[y][x] = dist[p.y][p.x] + 1;
          next.push({ x, y });
          if (x === F.x && y === F.y) reached = true;
        }
      front = next;
      out.push({ dist: dist.map((r) => [...r]), path: [] });
    }
    if (reached) {
      const path: string[] = [];
      let p = F;
      path.push(`${p.x},${p.y}`);
      while (dist[p.y][p.x] > 0) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = p.x + dx;
          const y = p.y + dy;
          if (x >= 0 && y >= 0 && x < W && y < H && dist[y][x] === dist[p.y][p.x] - 1) {
            p = { x, y };
            break;
          }
        }
        path.push(`${p.x},${p.y}`);
        out.push({ dist: dist.map((r) => [...r]), path: [...path] });
      }
    }
    return { out, reached };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);
  const s = useSteps(frames.out.length, 380);
  const f = frames.out[s.i];
  const C = 50;
  const last = s.i === frames.out.length - 1;
  return (
    <Scene
      title={tc('Волна по клеткам')}
      w={420}
      h={260}
      notes={[tc('Запусти волну: числа показывают, за сколько шагов можно дойти до клетки.'), tc('Нажми на клетку, чтобы поставить или убрать стену.')]}
      controls={
        <>
          <StepBar s={s} count={frames.out.length} tc={tc} />
          {last && <Say>{frames.reached ? `🏁 ${tc('Кратчайший путь')}: ${f.path.length - 1} ${tc('шагов')}` : `🚧 ${tc('До финиша не дойти: волна упёрлась в стены.')}`}</Say>}
        </>
      }
    >
      {grid.map((row, y) =>
        row.map((ch, x) => {
          const d = f.dist[y][x];
          const onPath = f.path.includes(`${x},${y}`);
          const fill = ch === '#' ? '#8a6d5a' : onPath ? '#ffd27a' : d >= 0 ? `hsl(${150 - d * 6}, 55%, ${88 - Math.min(d, 12)}%)` : '#fdf6ec';
          return (
            <g
              key={`${x}-${y}`}
              onClick={() => {
                if (ch === 'S' || ch === 'F') return;
                s.reset();
                setGrid((g) => g.map((r, yy) => r.map((c, xx) => (xx === x && yy === y ? (c === '#' ? '.' : '#') : c))));
              }}
              style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}
            >
              <rect x={10 + x * C} y={5 + y * C} width={C - 3} height={C - 3} rx="7" fill={fill} style={{ transition: 'fill 0.3s' }} />
              <text x={10 + x * C + 23} y={5 + y * C + 30} textAnchor="middle" fontSize={ch === 'S' || ch === 'F' ? 20 : 15} fontWeight="800" fill="#334">
                {ch === 'S' ? '🐭' : ch === 'F' ? '🧀' : d >= 0 ? d : ''}
              </text>
            </g>
          );
        }),
      )}
    </Scene>
  );
}

/** The same wave on a graph: a map of stations, visited layer by layer. */
export function GraphBfs({ tc }: { tc: Tc }) {
  const nodes = [
    { id: 'A', x: 60, y: 110 },
    { id: 'B', x: 160, y: 50 },
    { id: 'C', x: 160, y: 170 },
    { id: 'D', x: 270, y: 40 },
    { id: 'E', x: 270, y: 120 },
    { id: 'F', x: 270, y: 200 },
    { id: 'G', x: 390, y: 110 },
  ];
  const edges = ['AB', 'AC', 'BD', 'BE', 'CE', 'CF', 'DG', 'EG', 'FG'];
  const [start, setStart] = useState('A');
  const layers = useMemo(() => {
    const seen = new Map<string, number>([[start, 0]]);
    let front = [start];
    const out = [new Map(seen)];
    while (front.length) {
      const next: string[] = [];
      for (const n of front)
        for (const e of edges) {
          const other = e[0] === n ? e[1] : e[1] === n ? e[0] : null;
          if (other && !seen.has(other)) {
            seen.set(other, seen.get(n)! + 1);
            next.push(other);
          }
        }
      front = next;
      if (next.length) out.push(new Map(seen));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);
  const s = useSteps(layers.length, 900);
  const seen = layers[s.i];
  const COLORS = ['#ff9f68', '#ffd166', '#a0e7a0', '#8ecae6', '#c3aed6'];
  return (
    <Scene
      title={tc('Поиск в ширину на графе')}
      w={460}
      h={240}
      notes={[tc('Вершины — станции, рёбра — дороги между ними.'), tc('Нажми на станцию, чтобы начать с неё. Цвет показывает, за сколько шагов до неё добраться.')]}
      controls={<StepBar s={s} count={layers.length} tc={tc} />}
    >
      {edges.map((e) => {
        const a = nodes.find((n) => n.id === e[0])!;
        const b = nodes.find((n) => n.id === e[1])!;
        const lit = seen.has(e[0]) && seen.has(e[1]);
        return <line key={e} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? '#9a8ee0' : '#ddd'} strokeWidth={lit ? 4 : 3} />;
      })}
      {nodes.map((n) => {
        const d = seen.get(n.id);
        return (
          <g key={n.id} onClick={() => (s.reset(), setStart(n.id))} style={{ cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" }}>
            <circle cx={n.x} cy={n.y} r="22" fill={d === undefined ? '#fff' : COLORS[d % COLORS.length]} stroke="#7a6fc6" strokeWidth="3" style={{ transition: 'fill 0.4s' }} />
            <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="16" fontWeight="800">
              {n.id}
            </text>
            {d !== undefined && (
              <text x={n.x + 20} y={n.y - 18} fontSize="12" fontWeight="800" fill="#5b4bb7">
                {d}
              </text>
            )}
          </g>
        );
      })}
    </Scene>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { MINT, Say, Scene, Slider, type Tc } from './kit';

/** One moment of a running program: the line about to run, the variables and what is printed so far. */
interface Step {
  line: number;
  vars: Record<string, string | number | (string | number)[]>;
  out: string[];
  note?: string;
}

interface Trace {
  title: string;
  code: string[];
  /** Builds the steps, for the value of the slider when there is one. */
  run: (p: number) => Step[];
  param?: { label: string; min: number; max: number; start: number };
  notes: string[];
}

/** Records steps while a small hand-written model of the program runs. */
function recorder() {
  const steps: Step[] = [];
  const out: string[] = [];
  const vars: Step['vars'] = {};
  return {
    steps,
    vars,
    at(line: number, note?: string) {
      steps.push({ line, vars: JSON.parse(JSON.stringify(vars)), out: [...out], note });
    },
    print(s: string) {
      out.push(s);
    },
  };
}

const TRACES: Record<string, Trace> = {
  vars: {
    title: 'Переменная — коробка с названием',
    code: ['apples = 3', 'apples = apples + 2', 'print(apples)'],
    notes: ['Смотри, как меняется число в коробке apples.', 'Справа от = считается новое значение, потом оно кладётся в коробку.'],
    run: () => {
      const r = recorder();
      r.at(0);
      r.vars.apples = 3;
      r.at(1, 'apples + 2 = 3 + 2 = 5');
      r.vars.apples = 5;
      r.at(2);
      r.print('5');
      r.at(3);
      return r.steps;
    },
  },
  ifelse: {
    title: 'if и else по шагам',
    code: ['age = AGE', 'if age >= 7:', '    print("В школу!")', 'else:', '    print("В садик!")'],
    param: { label: 'Возраст', min: 3, max: 12, start: 9 },
    notes: ['Двигай ползунок возраста и запускай снова.', 'Выполняется только одна ветка: та, где условие верно.'],
    run: (age) => {
      const r = recorder();
      r.at(0);
      r.vars.age = age;
      const ok = age >= 7;
      r.at(1, `${age} >= 7 → ${ok ? 'True' : 'False'}`);
      if (ok) {
        r.at(2);
        r.print('В школу!');
      } else {
        r.at(3);
        r.at(4);
        r.print('В садик!');
      }
      r.at(5);
      return r.steps;
    },
  },
  forrange: {
    title: 'Цикл for по шагам',
    code: ['for i in range(N):', '    print("Привет", i)', 'print("Готово")'],
    param: { label: 'N', min: 1, max: 6, start: 3 },
    notes: ['Переменная i по очереди принимает значения 0, 1, 2…', 'Тело цикла выполняется столько раз, сколько чисел в range.'],
    run: (n) => {
      const r = recorder();
      for (let i = 0; i < n; i++) {
        r.vars.i = i;
        r.at(0, `i = ${i}`);
        r.at(1);
        r.print(`Привет ${i}`);
      }
      r.at(0, 'range закончился');
      r.at(2);
      r.print('Готово');
      r.at(3);
      return r.steps;
    },
  },
  sum: {
    title: 'Считаем сумму в цикле',
    code: ['total = 0', 'for n in range(1, N + 1):', '    total = total + n', 'print(total)'],
    param: { label: 'N', min: 2, max: 8, start: 4 },
    notes: ['Каждый круг цикла прибавляет n к total.', 'Это алгоритм накопления: так считают очки, деньги, шаги.'],
    run: (N) => {
      const r = recorder();
      r.at(0);
      r.vars.total = 0;
      for (let n = 1; n <= N; n++) {
        r.vars.n = n;
        r.at(1, `n = ${n}`);
        const before = r.vars.total as number;
        r.at(2, `${before} + ${n} = ${before + n}`);
        r.vars.total = before + n;
      }
      r.at(3);
      r.print(String(r.vars.total));
      r.at(4);
      return r.steps;
    },
  },
  list: {
    title: 'Список по шагам',
    code: ['fruits = ["яблоко", "банан"]', 'fruits.append("киви")', 'for f in fruits:', '    print(f)'],
    notes: ['append добавляет элемент в конец списка.', 'for по очереди берёт каждый элемент списка.'],
    run: () => {
      const r = recorder();
      r.at(0);
      const list = ['яблоко', 'банан'];
      r.vars.fruits = [...list];
      r.at(1);
      list.push('киви');
      r.vars.fruits = [...list];
      for (const f of list) {
        r.vars.f = f;
        r.at(2, `f = "${f}"`);
        r.at(3);
        r.print(f);
      }
      r.at(4);
      return r.steps;
    },
  },
  func: {
    title: 'Функция и return',
    code: ['def double(x):', '    return x * 2', '', 'y = double(X)', 'print(y)'],
    param: { label: 'X', min: 1, max: 10, start: 5 },
    notes: ['При вызове программа прыгает внутрь функции.', 'return отдаёт ответ туда, откуда функцию позвали.'],
    run: (X) => {
      const r = recorder();
      r.at(0, 'запоминаем функцию double');
      r.at(3, `вызываем double(${X})`);
      r.vars.x = X;
      r.at(1, `x * 2 = ${X * 2}`);
      delete r.vars.x;
      r.vars.y = X * 2;
      r.at(3, `return вернул ${X * 2}`);
      r.at(4);
      r.print(String(X * 2));
      r.at(5);
      return r.steps;
    },
  },
  whileloop: {
    title: 'Цикл while по шагам',
    code: ['n = 1', 'while n < LIMIT:', '    n = n * 2', 'print(n)'],
    param: { label: 'LIMIT', min: 5, max: 100, start: 20 },
    notes: ['while повторяет, пока условие верно.', 'Как только условие стало ложным, цикл заканчивается.'],
    run: (limit) => {
      const r = recorder();
      r.at(0);
      r.vars.n = 1;
      let n = 1;
      while (n < limit) {
        r.at(1, `${n} < ${limit} → True`);
        r.at(2, `${n} * 2 = ${n * 2}`);
        n *= 2;
        r.vars.n = n;
      }
      r.at(1, `${n} < ${limit} → False`);
      r.at(3);
      r.print(String(n));
      r.at(4);
      return r.steps;
    },
  },
};

/**
 * A program running line by line: the current line lights up, variables are boxes whose
 * contents change, and printed lines appear in the console.
 */
export function CodeTrace({ tc, id }: { tc: Tc; id: keyof typeof TRACES }) {
  const tr = TRACES[id];
  const [p, setP] = useState(tr.param?.start ?? 0);
  const steps = useMemo(() => tr.run(p), [tr, p]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (i >= steps.length - 1) return setPlaying(false);
    const t = window.setTimeout(() => setI(i + 1), 900);
    return () => window.clearTimeout(t);
  }, [playing, i, steps.length]);
  const st = steps[Math.min(i, steps.length - 1)];
  const shown = tr.code.map((l) => l.replace(/\b(AGE|N|X|LIMIT)\b/, String(p)));
  return (
    <figure className="music-diagram scene code-trace">
      <figcaption className="md-title">{tc(tr.title)}</figcaption>
      <div className="ct-main">
        <pre className="ct-code">
          {shown.map((l, k) => (
            <div key={k} className={k === st.line ? 'on' : ''}>
              <i>{k + 1}</i>
              {l || ' '}
            </div>
          ))}
        </pre>
        <div className="ct-side">
          <div className="ct-vars">
            {Object.keys(st.vars).length === 0 && <span className="muted small">{tc('Переменных пока нет')}</span>}
            {Object.entries(st.vars).map(([k, v]) => (
              <div key={k} className="ct-box">
                <small>{k}</small>
                {Array.isArray(v) ? (
                  <span className="ct-list">
                    {v.map((x, j) => (
                      <b key={j}>{String(x)}</b>
                    ))}
                  </span>
                ) : (
                  <b key={String(v)} className="pop-in">
                    {String(v)}
                  </b>
                )}
              </div>
            ))}
          </div>
          <pre className="ct-out">
            <small>{tc('Вывод')}</small>
            {'\n'}
            {st.out.join('\n')}
          </pre>
        </div>
      </div>
      {st.note && <Say>💡 {st.note}</Say>}
      {tr.param && <Slider label={`${tr.param.label} = ${p}`} value={p} min={tr.param.min} max={tr.param.max} onChange={(v) => (setI(0), setPlaying(false), setP(v))} />}
      <div className="algo-bar">
        <button type="button" className="btn btn-light btn-small" onClick={() => (setPlaying(false), setI(0))}>
          ⏮
        </button>
        <button type="button" className="btn btn-light btn-small" disabled={i === 0} onClick={() => setI(i - 1)}>
          ◀
        </button>
        <button
          type="button"
          className="btn btn-go btn-small"
          onClick={() => {
            if (playing) return setPlaying(false);
            if (i >= steps.length - 1) setI(0);
            setPlaying(true);
          }}
        >
          {playing ? `⏸ ${tc('Пауза')}` : `▶ ${tc('Запустить')}`}
        </button>
        <button type="button" className="btn btn-light btn-small" disabled={i >= steps.length - 1} onClick={() => setI(i + 1)}>
          ▶|
        </button>
        <span className="muted small">
          {tc('Шаг')} {i + 1} / {steps.length}
        </span>
      </div>
      <ol className="md-notes">
        {tr.notes.map((n) => (
          <li key={n}>{tc(n)}</li>
        ))}
      </ol>
    </figure>
  );
}

/** Turtle graphics: a loop of "forward, turn" draws a polygon, one side per step. */
export function TurtleLoop({ tc }: { tc: Tc }) {
  const [sides, setSides] = useState(5);
  const [k, setK] = useState(0);
  useEffect(() => {
    setK(0);
  }, [sides]);
  useEffect(() => {
    if (k >= sides) return;
    const t = window.setTimeout(() => setK(k + 1), 550);
    return () => window.clearTimeout(t);
  }, [k, sides]);
  const len = 260 / sides + 20;
  const pts = [{ x: 200, y: 200, a: 0 }];
  for (let i = 0; i < sides; i++) {
    const p = pts[i];
    pts.push({ x: p.x + len * Math.cos(p.a), y: p.y + len * Math.sin(p.a), a: p.a - (2 * Math.PI) / sides });
  }
  const cur = pts[k];
  const minX = Math.min(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxX = Math.max(...pts.map((p) => p.x));
  const maxY = Math.max(...pts.map((p) => p.y));
  const dx = 230 - (minX + maxX) / 2;
  const dy = 120 - (minY + maxY) / 2;
  return (
    <Scene
      title={tc('Черепашка рисует циклом')}
      w={460}
      h={240}
      notes={[tc('Одна и та же пара команд повторяется: вперёд и поворот.'), tc('Угол поворота = 360 / число сторон.')]}
      controls={
        <>
          <pre className="code algo-code">{`for i in range(${sides}):\n    t.forward(${Math.round(len)})\n    t.left(${Math.round(360 / sides)})`}</pre>
          <Slider label={`${tc('Сторон')}: ${sides}`} value={sides} min={3} max={10} onChange={setSides} />
          <button type="button" className="btn btn-light btn-small" onClick={() => setK(0)}>
            ↻ {tc('Нарисовать ещё раз')}
          </button>
        </>
      }
    >
      <g transform={`translate(${dx} ${dy})`}>
        <polyline points={pts.slice(0, k + 1).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={MINT} strokeWidth="4" strokeLinejoin="round" />
        <text x={cur.x} y={cur.y + 8} textAnchor="middle" fontSize="22" style={{ transition: 'all 0.4s' }}>
          🐢
        </text>
      </g>
      <text x="230" y="230" textAnchor="middle" fontSize="12" fill="#667">
        {tc('Шаг цикла')} {Math.min(k, sides)} / {sides}
      </text>
    </Scene>
  );
}

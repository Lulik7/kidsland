import { useEffect, useRef, useState } from 'react';
import { Figure, INK, Keyboard, MINT, PEACH, Staff, type Tc } from './parts';
import { ListenButton, usePlayer, type Step } from './player';
import { audio, playClap, playClick, playNote } from './sound';

// ---------------- Metronome ----------------

const TEMPO_NAMES: [number, string][] = [
  [60, 'Ларго: очень медленно'],
  [76, 'Адажио: медленно'],
  [108, 'Анданте: спокойно, как шаг'],
  [120, 'Модерато: умеренно'],
  [168, 'Аллегро: быстро'],
  [999, 'Престо: очень быстро'],
];

/** A working metronome: the child moves the sliders to pick the tempo and how many beats are in a bar. */
export function Metronome({ tc }: { tc: Tc }) {
  const [bpm, setBpm] = useState(80);
  const [beats, setBeats] = useState(4);
  const [sub, setSub] = useState(1);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState<{ beat: number; tick: number }>({ beat: -1, tick: 0 });
  const cfg = useRef({ bpm, beats, sub });
  cfg.current = { bpm, beats, sub };

  useEffect(() => {
    if (!running) return;
    const a = audio();
    if (!a) return;
    let next = a.currentTime + 0.1;
    let tick = 0;
    let beat = 0;
    let part = 0;
    const timers: number[] = [];
    const id = window.setInterval(() => {
      while (next < a.currentTime + 0.12) {
        const { bpm: b, beats: n, sub: s } = cfg.current;
        if (beat >= n) beat = 0;
        playClick(next, part === 0 && beat === 0, part !== 0);
        if (part === 0) {
          const shown = { beat, tick };
          timers.push(window.setTimeout(() => setNow(shown), Math.max(0, (next - a.currentTime) * 1000)));
          tick++;
        }
        next += 60 / b / s;
        part++;
        if (part >= s) {
          part = 0;
          beat++;
        }
      }
    }, 25);
    return () => {
      clearInterval(id);
      timers.forEach(clearTimeout);
      setNow({ beat: -1, tick: 0 });
    };
  }, [running]);

  const name = TEMPO_NAMES.find(([max]) => bpm < max)?.[1] ?? '';
  const side = now.tick % 2 === 0 ? -28 : 28;
  return (
    <figure className="music-diagram metronome">
      <figcaption className="md-title">{tc('Метроном: попробуй сам')}</figcaption>
      <div className="metro-body">
        <svg viewBox="0 0 160 195" width="150" role="img" aria-label={tc('Метроном')}>
          <path d="M50 20h60l30 160H20z" fill="#d9a77f" stroke="#a8714a" strokeWidth="3" />
          <rect x="40" y="135" width="80" height="34" rx="6" fill="#fffdf8" stroke="#a8714a" strokeWidth="2" />
          <g
            style={{
              transform: `rotate(${running ? side : 0}deg)`,
              transformOrigin: '80px 150px',
              transition: `transform ${running ? 60 / bpm : 0.3}s ease-in-out`,
            }}
          >
            <line x1="80" y1="150" x2="80" y2="30" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            <rect x="70" y={110 - (bpm - 40) * 0.45} width="20" height="14" rx="3" fill={MINT} stroke={INK} strokeWidth="1.5" />
          </g>
          <text x="80" y="186" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">
            {bpm}
          </text>
        </svg>
        <div className="metro-controls">
          <div className="metro-dots" aria-hidden>
            {Array.from({ length: beats }, (_, i) => (
              <span key={i} className={`metro-dot${i === 0 ? ' strong' : ''}${now.beat === i ? ' on' : ''}`}>
                {i + 1}
              </span>
            ))}
          </div>
          <label className="metro-slider">
            <span>
              {tc('Темп')}: <b>{bpm}</b> {tc('ударов в минуту')}
            </span>
            <input type="range" min={40} max={208} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
            <span className="muted small">{tc(name)}</span>
          </label>
          <label className="metro-slider">
            <span>
              {tc('Долей в такте')}: <b>{beats}</b>
            </span>
            <input type="range" min={2} max={6} value={beats} onChange={(e) => setBeats(Number(e.target.value))} />
            <span className="muted small">{tc('Первая доля звучит выше: это сильная доля.')}</span>
          </label>
          <div className="chips-row">
            {(
              [
                [1, 'Только доли'],
                [2, 'Доли и «и»'],
                [4, 'Четыре на долю'],
              ] as const
            ).map(([n, label]) => (
              <button key={n} type="button" className={sub === n ? 'fchip on' : 'fchip'} onClick={() => setSub(n)}>
                {tc(label)}
              </button>
            ))}
          </div>
          <button type="button" className={`btn ${running ? 'btn-light' : 'btn-go'} md-play`} onClick={() => setRunning(!running)}>
            {running ? `■ ${tc('Стоп')}` : `▶ ${tc('Включить метроном')}`}
          </button>
        </div>
      </div>
    </figure>
  );
}

// ---------------- Clapping ----------------

const CLAP_PATTERNS: { id: string; label: string; claps: boolean[] }[] = [
  { id: 'q', label: 'Хлопок на каждый счёт', claps: [true, false, true, false, true, false, true, false] },
  { id: 'e', label: 'Хлопок на «раз» и на «и»', claps: [true, true, true, true, true, true, true, true] },
  { id: 'r', label: 'Ритм: та, та, ти-ти, та', claps: [true, false, true, false, true, true, true, false] },
];
const SYLLABLES = ['раз', 'и', 'два', 'и', 'три', 'и', 'четыре', 'и'];

function Palm({ flip }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      <rect x="-26" y="-6" width="34" height="58" rx="16" fill="#f7d7bf" stroke="#d9a77f" strokeWidth="2" />
      {[0, 1, 2, 3].map((f) => (
        <rect key={f} x={-24 + f * 8} y={-40 + Math.abs(f - 1.5) * 5} width="8" height="40" rx="4" fill="#f7d7bf" stroke="#d9a77f" strokeWidth="1.5" />
      ))}
      <rect x="4" y="8" width="20" height="9" rx="4.5" transform="rotate(-35 4 12)" fill="#f7d7bf" stroke="#d9a77f" strokeWidth="1.5" />
      <rect x="-30" y="50" width="42" height="26" rx="8" fill="#79c7a6" />
    </g>
  );
}

/** Hands clap along with the count «раз-и, два-и»; the child sees when to clap and when to open the hands. */
export function ClapRhythm({ tc }: { tc: Tc }) {
  const [pattern, setPattern] = useState(CLAP_PATTERNS[0]);
  const [bpm, setBpm] = useState(70);
  const player = usePlayer();
  const clapping = player.step >= 0 && pattern.claps[player.step % 8];
  const start = () => {
    const steps: Step[] = [];
    for (let bar = 0; bar < 2; bar++)
      pattern.claps.forEach((c, i) =>
        steps.push({ beats: 0.5, play: (at) => (c ? playClap(at, i % 2 === 0 ? 0.7 : 0.45) : i % 2 === 0 ? playClick(at, false, true) : undefined) }),
      );
    player.play(steps, bpm);
  };
  return (
    <Figure
      title={tc('Хлопаем ритм: «раз-и, два-и»')}
      h={200}
      notes={[
        tc('Держи ладони перед собой, локти свободно.'),
        tc('На счёт хлопни, на «и» разведи ладони немного в стороны.'),
        tc('Считай вслух вместе с подсветкой: «раз-и, два-и, три-и, четыре-и».'),
        tc('Сначала медленно. Получается ровно? Сдвинь темп чуть быстрее.'),
      ]}
      extra={
        <div className="clap-controls">
          <div className="chips-row">
            {CLAP_PATTERNS.map((p) => (
              <button key={p.id} type="button" className={pattern.id === p.id ? 'fchip on' : 'fchip'} onClick={() => setPattern(p)}>
                {tc(p.label)}
              </button>
            ))}
          </div>
          <label className="metro-slider">
            <span>
              {tc('Темп')}: <b>{bpm}</b>
            </span>
            <input type="range" min={50} max={130} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
          </label>
          <ListenButton tc={tc} label="Хлопать вместе" playing={player.playing} onPlay={start} onStop={player.stop} />
        </div>
      }
    >
      <g transform="translate(230 70)">
        <g style={{ transform: `translateX(${clapping ? -30 : -70}px) rotate(${clapping ? 8 : -10}deg)`, transition: 'transform 0.07s ease-out' }}>
          <Palm />
        </g>
        <g style={{ transform: `translateX(${clapping ? 30 : 70}px) rotate(${clapping ? -8 : 10}deg)`, transition: 'transform 0.07s ease-out' }}>
          <Palm flip />
        </g>
        {clapping && (
          <g stroke={PEACH} strokeWidth="3" strokeLinecap="round">
            <line x1="0" y1="-62" x2="0" y2="-76" />
            <line x1="-18" y1="-56" x2="-28" y2="-68" />
            <line x1="18" y1="-56" x2="28" y2="-68" />
          </g>
        )}
      </g>
      {SYLLABLES.map((s, i) => {
        const on = player.step >= 0 && player.step % 8 === i;
        const x = 40 + i * 54 + (i > 6 ? 8 : i === 6 ? 4 : 0);
        return (
          <g key={i}>
            <rect x={x - (i === 6 ? 32 : 25)} y="160" width={i === 6 ? 64 : 50} height="30" rx="15" fill={on ? MINT : pattern.claps[i] ? '#fff1e8' : '#f3f5f8'} stroke={pattern.claps[i] ? PEACH : '#d5dbe3'} strokeWidth="1.5" />
            <text x={x} y="180" textAnchor="middle" fontSize={i % 2 ? 13 : 14} fontWeight={i % 2 ? 600 : 800} fill={on ? '#fff' : INK}>
              {tc(s)}
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

// ---------------- Rhythm on the staff ----------------

type RNote = { d: number; dotted?: boolean; tie?: boolean; accent?: boolean; rest?: boolean; fermata?: boolean };

/** Notes of one pitch on a staff, spaced by time, with the count underneath and a play button. */
export function RhythmExample({ tc, title, notes, explain, perBar = 4, bpm = 80, label = 'Послушать' }: {
  tc: Tc;
  title: string;
  notes: RNote[];
  explain: string[];
  perBar?: number;
  bpm?: number;
  label?: string;
}) {
  const player = usePlayer();
  const total = notes.reduce((s, n) => s + n.d, 0);
  const unit = Math.min(52, 360 / total);
  const x0 = 90;
  const y = 60;
  const xs: number[] = [];
  notes.reduce((acc, n) => {
    xs.push(x0 + acc * unit);
    return acc + n.d;
  }, 0);
  const w = x0 + total * unit + 30;
  const play = () => {
    const beatSec = 60 / bpm;
    const steps: Step[] = notes.map((n, i) => {
      const tiedFromPrev = i > 0 && notes[i - 1].tie;
      let len = n.d;
      for (let j = i; notes[j]?.tie && notes[j + 1]; j++) len += notes[j + 1].d;
      return {
        beats: n.d,
        play: (at: number) => {
          if (!n.rest && !tiedFromPrev) playNote(67, len * beatSec * (n.fermata ? 2.2 : 0.92), at, n.accent ? 0.55 : 0.3);
        },
      };
    });
    // Soft clicks on every beat, so the count is heard too.
    const clicks: Step[] = Array.from({ length: Math.ceil(total) }, (_, i) => ({ beats: 1, play: (at: number) => playClick(at, i % perBar === 0, true) }));
    clicks[0] = { beats: 1, play: (at) => playClick(at, true, true) };
    const a = audio();
    if (a) clicks.forEach((c, i) => c.play(a.currentTime + 0.1 + i * beatSec));
    player.play(steps, bpm);
  };
  const counts: { x: number; text: string }[] = [];
  for (let b = 0; b < total; b += 0.5) counts.push({ x: x0 + b * unit, text: b % 1 ? 'и' : String((Math.floor(b) % perBar) + 1) });
  return (
    <Figure title={tc(title)} w={Math.max(w, 300)} h={150} notes={explain.map(tc)} extra={<ListenButton tc={tc} label={label} playing={player.playing} onPlay={play} onStop={player.stop} />}>
      <Staff x={10} y={40} w={w - 20} gap={10} />
      <text x="62" y="58" textAnchor="middle" fontSize="20" fontWeight="800" fill={INK}>
        {perBar}
      </text>
      <text x="62" y="78" textAnchor="middle" fontSize="20" fontWeight="800" fill={INK}>
        4
      </text>
      {Array.from({ length: Math.floor(total / perBar) }, (_, b) => (
        <line key={b} x1={x0 + (b + 1) * perBar * unit - 10} y1="40" x2={x0 + (b + 1) * perBar * unit - 10} y2="80" stroke="#6b7786" strokeWidth="1.5" />
      ))}
      {notes.map((n, i) => {
        const x = xs[i] + 6;
        const color = player.step === i ? '#e07a3f' : INK;
        if (n.rest) return <Rest key={i} x={x} d={n.d} color={color} />;
        const hollow = n.d >= 2;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="7" ry="5.2" transform={`rotate(-20 ${x} ${y})`} fill={hollow ? '#fff' : color} stroke={color} strokeWidth="2" />
            {n.d < 4 && <line x1={x + 6.5} y1={y - 2} x2={x + 6.5} y2={y - 34} stroke={color} strokeWidth="2" />}
            {n.d === 0.5 && <path d={`M${x + 6.5} ${y - 34}c3 8 14 10 10 24`} stroke={color} strokeWidth="2" fill="none" />}
            {n.dotted && <circle cx={x + 13} cy={y - 4} r="2.6" fill={color} />}
            {n.tie && i + 1 < notes.length && <path d={`M${x} ${y + 8}Q${(x + xs[i + 1] + 6) / 2} ${y + 22} ${xs[i + 1] + 6} ${y + 8}`} stroke={color} strokeWidth="2" fill="none" />}
            {n.accent && <path d={`M${x - 6} ${y - 50}l12 5-12 5`} stroke={PEACH} strokeWidth="2.5" fill="none" />}
            {n.fermata && (
              <g>
                <path d={`M${x - 10} ${y - 40}a10 10 0 0 1 20 0`} stroke={color} strokeWidth="2" fill="none" />
                <circle cx={x} cy={y - 43} r="2" fill={color} />
              </g>
            )}
          </g>
        );
      })}
      {counts.map((c, i) => (
        <text key={i} x={c.x + 6} y="112" textAnchor="middle" fontSize={c.text === 'и' ? 11 : 14} fontWeight={c.text === 'и' ? 500 : 800} fill={c.text === 'и' ? '#8a94a3' : INK}>
          {tc(c.text)}
        </text>
      ))}
    </Figure>
  );
}

function Rest({ x, d, color }: { x: number; d: number; color: string }) {
  if (d >= 4) return <rect x={x - 7} y="50" width="14" height="5" fill={color} />;
  if (d >= 2) return <rect x={x - 7} y="55" width="14" height="5" fill={color} />;
  if (d >= 1) return <path d={`M${x - 3} 44l7 9-6 7 7 9c-6-3-10 0-6 6`} stroke={color} strokeWidth="2.6" fill="none" strokeLinejoin="round" />;
  return (
    <g>
      <circle cx={x - 3} cy="56" r="3" fill={color} />
      <path d={`M${x - 3} 58c4 1 7-1 8-4l-6 18`} stroke={color} strokeWidth="2" fill="none" />
    </g>
  );
}

/** All four rests with their beats. */
export function Rests({ tc }: { tc: Tc }) {
  const list: [number, string, string][] = [
    [4, 'Целая пауза', '4'],
    [2, 'Половинная пауза', '2'],
    [1, 'Четвертная пауза', '1'],
    [0.5, 'Восьмая пауза', '½'],
  ];
  return (
    <Figure title={tc('Паузы: сколько счётов молчим')} h={150} notes={[tc('Целая пауза висит под линейкой, половинная лежит на линейке, как шляпа.')]}>
      <Staff x={10} y={40} w={440} gap={10} />
      {list.map(([d, name, beats], i) => (
        <g key={name}>
          <Rest x={80 + i * 105} d={d} color={INK} />
          <text x={80 + i * 105} y="108" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>
            {tc(name)}
          </text>
          <text x={80 + i * 105} y="128" textAnchor="middle" fontSize="15" fontWeight="800" fill={MINT}>
            {beats}
          </text>
        </g>
      ))}
    </Figure>
  );
}

// ---------------- Keyboard examples ----------------

/** A keyboard with buttons; each button plays its notes in turn and then together. */
function KeyboardChoices({ tc, title, choices, notes, octaves = 1 }: { tc: Tc; title: string; choices: { label: string; midi: number[]; together?: boolean }[]; notes: string[]; octaves?: number }) {
  const player = usePlayer();
  const [current, setCurrent] = useState(0);
  const steps = (c: (typeof choices)[number]): number[][] => (c.together === false ? c.midi.map((m) => [m]) : [...c.midi.map((m) => [m]), c.midi]);
  const seq = steps(choices[current]);
  const lit = player.step >= 0 ? seq[player.step] ?? [] : [];
  return (
    <Figure
      title={tc(title)}
      w={octaves === 1 ? 300 : 500}
      h={170}
      notes={notes.map(tc)}
      extra={
        <div className="chips-row md-choices">
          {choices.map((c, i) => (
            <button
              key={c.label}
              type="button"
              className={current === i && player.playing ? 'fchip on' : 'fchip'}
              onClick={() => {
                setCurrent(i);
                player.play(
                  steps(c).map((m, k, all) => ({ beats: k === all.length - 1 ? 2 : 1, play: (at: number) => m.forEach((x) => playNote(x, k === all.length - 1 ? 1.3 : 0.55, at)) })),
                  100,
                );
              }}
            >
              ▶ {tc(c.label)}
            </button>
          ))}
        </div>
      }
    >
      <Keyboard x={20} y={20} octaves={octaves} keyW={octaves === 1 ? 32 : 30} lit={lit} tc={tc} />
    </Figure>
  );
}

/** A tone is two semitones: До, До♯, Ре. Ми–Фа is a semitone with no black key between. */
export function ToneExample({ tc }: { tc: Tc }) {
  const player = usePlayer();
  const seq = [[60], [61], [62], [], [60], [62], [], [64], [65]];
  const lit = player.step >= 0 ? seq[player.step] ?? [] : [];
  const k = 34;
  const arc = (x1: number, x2: number, up: number, text: string, color: string) => (
    <g>
      <path d={`M${x1} 30Q${(x1 + x2) / 2} ${30 - up} ${x2} 30`} stroke={color} strokeWidth="2.5" fill="none" />
      <text x={(x1 + x2) / 2} y={22 - up / 2} textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>
        {tc(text)}
      </text>
    </g>
  );
  return (
    <Figure
      title={tc('Тон = полутон + полутон')}
      w={320}
      h={230}
      notes={[tc('От До до До♯ полутон, от До♯ до Ре ещё полутон. Вместе это тон.'), tc('Между Ми и Фа нет чёрной клавиши, поэтому Ми–Фа только полутон.')]}
      extra={<ListenButton tc={tc} label="Послушать: До, До♯, Ре" playing={player.playing} onStop={player.stop} onPlay={() => player.play(seq.map((m) => ({ beats: 1, play: (at: number) => m.forEach((x) => playNote(x, 0.6, at)) })), 100)} />}
    >
      <g transform="translate(10 40)">
        {arc(k * 0.5, k, 18, 'полутон', '#e07a3f')}
        {arc(k, k * 1.5, 18, 'полутон', '#e07a3f')}
        {arc(k * 0.5, k * 1.5, 52, 'тон', MINT)}
        {arc(k * 2.5, k * 3.5, 18, 'полутон', '#e07a3f')}
      </g>
      <Keyboard x={10} y={72} octaves={1} keyW={k} lit={lit} marks={[0, 1]} tc={tc} />
    </Figure>
  );
}

export const Intervals = ({ tc }: { tc: Tc }) => (
  <KeyboardChoices
    tc={tc}
    title="Интервалы от ноты До"
    notes={['Нажми кнопку: прозвучат две ноты по очереди, потом вместе.', 'Чем дальше ноты друг от друга, тем шире интервал.']}
    choices={[
      { label: 'Секунда: До–Ре', midi: [60, 62] },
      { label: 'Терция: До–Ми', midi: [60, 64] },
      { label: 'Кварта: До–Фа', midi: [60, 65] },
      { label: 'Квинта: До–Соль', midi: [60, 67] },
      { label: 'Секста: До–Ля', midi: [60, 69] },
      { label: 'Септима: До–Си', midi: [60, 71] },
      { label: 'Октава: До–До', midi: [60, 72] },
    ]}
  />
);

export const MajorMinorChords = ({ tc }: { tc: Tc }) => (
  <KeyboardChoices
    tc={tc}
    title="Мажорное и минорное трезвучие"
    notes={['Мажор звучит светло, минор грустнее. Отличается только средняя нота: Ми или Ми♭.']}
    choices={[
      { label: 'До мажор: До, Ми, Соль', midi: [60, 64, 67] },
      { label: 'До минор: До, Ми♭, Соль', midi: [60, 63, 67] },
      { label: 'Ля минор: Ля, До, Ми', midi: [69, 72, 76] },
    ]}
    octaves={2}
  />
);

export const BluesScale = ({ tc }: { tc: Tc }) => (
  <KeyboardChoices
    tc={tc}
    title="Блюзовая гамма от До"
    notes={['До, Ми♭, Фа, Фа♯, Соль, Си♭, До: в ней есть «блюзовые» чёрные клавиши.']}
    choices={[{ label: 'Послушать гамму', midi: [60, 63, 65, 66, 67, 70, 72], together: false }]}
  />
);

/** Sharp, flat and natural signs on the staff, each with a button to hear the change. */
export function Accidentals({ tc }: { tc: Tc }) {
  const player = usePlayer();
  const signs: { sign: string; name: string; text: string; midi: [number, number]; y: number }[] = [
    { sign: '♯', name: 'Диез', text: 'выше на полутон', midi: [65, 66], y: 65 },
    { sign: '♭', name: 'Бемоль', text: 'ниже на полутон', midi: [71, 70], y: 50 },
    { sign: '♮', name: 'Бекар', text: 'отменяет знак', midi: [66, 65], y: 65 },
  ];
  return (
    <Figure
      title={tc('Диез, бемоль и бекар')}
      h={170}
      notes={[tc('Знак пишут перед нотой. Нажми на знак, чтобы услышать: сначала нота без знака, потом со знаком.')]}
    >
      <Staff x={10} y={40} w={440} gap={10} />
      {signs.map((s, i) => {
        const x = 130 + i * 120;
        const on = player.playing && player.step >= 0;
        return (
          <g
            key={s.name}
            style={{ cursor: 'pointer' }}
            role="button"
            onClick={() => player.play(s.midi.map((m) => ({ beats: 1, play: (at: number) => playNote(m, 0.7, at) })), 90)}
          >
            <rect x={x - 45} y="30" width="90" height="120" rx="12" fill={on ? '#fff7ef' : 'transparent'} />
            <text x={x - 20} y={s.y + 8} fontSize="26" textAnchor="middle" fill="#e07a3f" fontFamily="serif">
              {s.sign}
            </text>
            <ellipse cx={x + 4} cy={s.y} rx="7" ry="5.2" transform={`rotate(-20 ${x + 4} ${s.y})`} fill={INK} />
            <line x1={x + 10.5} y1={s.y - 2} x2={x + 10.5} y2={s.y - 34} stroke={INK} strokeWidth="2" />
            <text x={x} y="118" textAnchor="middle" fontSize="14" fontWeight="800" fill={INK}>
              ▶ {tc(s.name)}
            </text>
            <text x={x} y="136" textAnchor="middle" fontSize="12" fill="#6b7786">
              {tc(s.text)}
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

/** Dynamics from pp to ff and a crescendo hairpin; the button plays one note growing louder. */
export function Dynamics({ tc }: { tc: Tc }) {
  const player = usePlayer();
  const marks = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
  const vols = [0.06, 0.12, 0.2, 0.3, 0.45, 0.65];
  return (
    <Figure
      title={tc('Громкость: от pp до ff')}
      h={150}
      notes={[tc('p (пиано) значит тихо, f (форте) значит громко.'), tc('Расходящаяся «вилка» это крещендо: постепенно громче.')]}
      extra={<ListenButton tc={tc} label="Послушать крещендо" playing={player.playing} onStop={player.stop} onPlay={() => player.play(vols.map((v) => ({ beats: 1, play: (at: number) => playNote(67, 0.5, at, v) })), 100)} />}
    >
      {marks.map((m, i) => (
        <text key={m} x={50 + i * 72} y="40" textAnchor="middle" fontSize={16 + i * 3} fontStyle="italic" fontWeight="800" fontFamily="serif" fill={player.step === i ? '#e07a3f' : INK}>
          {m}
        </text>
      ))}
      <path d="M40 95L420 75M40 95L420 115" stroke={MINT} strokeWidth="4" fill="none" strokeLinecap="round" />
      <text x="230" y="140" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
        {tc('крещендо: всё громче')}
      </text>
    </Figure>
  );
}

// ---------------- Intervals house ----------------

const FLOORS: { name: string; animal: string; pic: string; midi: number; note: string }[] = [
  { name: 'Прима', animal: 'мышка', pic: '1f42d', midi: 60, note: 'До' },
  { name: 'Секунда', animal: 'ёжик', pic: '1f994', midi: 62, note: 'Ре' },
  { name: 'Терция', animal: 'кукушка', pic: '1f426', midi: 64, note: 'Ми' },
  { name: 'Кварта', animal: 'козлёнок', pic: '1f410', midi: 65, note: 'Фа' },
  { name: 'Квинта', animal: 'медуза', pic: '1fabc', midi: 67, note: 'Соль' },
  { name: 'Секста', animal: 'обезьянка', pic: '1f412', midi: 69, note: 'Ля' },
  { name: 'Септима', animal: 'крокодил', pic: '1f40a', midi: 71, note: 'Си' },
  { name: 'Октава', animal: 'жираф', pic: '1f992', midi: 72, note: 'До' },
];

/** A house of intervals: each floor has an animal to remember the name and two keys to press. */
export function IntervalHouse({ tc }: { tc: Tc }) {
  const [on, setOn] = useState<string | null>(null);
  const hit = (id: string, midi: number) => {
    setOn(id);
    playNote(midi, 0.7);
    window.setTimeout(() => setOn((x) => (x === id ? null : x)), 350);
  };
  const both = (i: number, midi: number) => {
    setOn(`b${i}`);
    playNote(60, 1.1);
    playNote(midi, 1.1);
    window.setTimeout(() => setOn((x) => (x === `b${i}` ? null : x)), 600);
  };
  return (
    <figure className="music-diagram interval-house">
      <figcaption className="md-title">{tc('Домик интервалов')}</figcaption>
      <div className="ih-house">
        <div className="ih-roof" aria-hidden />
        {[...FLOORS].reverse().map((f) => {
          const i = FLOORS.indexOf(f);
          return (
            <div key={f.name} className="ih-floor">
              <span className="ih-num">{i + 1}</span>
              <img src={`/img/3d/${f.pic}.webp`} alt="" width={44} height={44} loading="lazy" />
              <span className="ih-name">
                <b>{tc(f.name)}</b>
                <span className="muted small">{tc(f.animal)}</span>
              </span>
              <span className="ih-keys">
                <button type="button" className={`ih-key${on === `l${i}` || on === `b${i}` ? ' on' : ''}`} onPointerDown={() => hit(`l${i}`, 60)}>
                  {tc('До')}
                </button>
                <button type="button" className={`ih-key${on === `r${i}` || on === `b${i}` ? ' on' : ''}`} onPointerDown={() => hit(`r${i}`, f.midi)}>
                  {tc(f.note)}
                </button>
                <button type="button" className="ih-both" onClick={() => both(i, f.midi)} aria-label={tc('Вместе')}>
                  ▶
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <ol className="md-notes">
        <li>{tc('Интервал это номер этажа: от ноты До считаем ступеньки вверх.')}</li>
        <li>{tc('На первом этаже живёт мышка-прима: обе ноты одинаковые. На восьмом жираф-октава: самый высокий.')}</li>
        <li>{tc('Нажми две клавиши по очереди, а ▶ сыграет их вместе.')}</li>
      </ol>
    </figure>
  );
}

// ---------------- Accompaniment ----------------

const PROGRESSION: { name: string; notes: number[] }[] = [
  { name: 'До', notes: [60, 64, 67] },
  { name: 'Фа', notes: [60, 65, 69] },
  { name: 'Соль', notes: [62, 67, 71] },
  { name: 'До', notes: [60, 64, 67] },
];

const STYLES: { id: string; label: string; steps: (c: number[]) => number[][] }[] = [
  { id: 'block', label: 'Аккорд целиком', steps: (c) => [c, [], c, []] },
  { id: 'arp', label: 'Арпеджио: по одной ноте', steps: (c) => [[c[0]], [c[1]], [c[2]], [c[1]]] },
  { id: 'oompa', label: 'Бас и аккорд: «ум-па»', steps: (c) => [[c[0]], [c[1], c[2]], [c[0]], [c[1], c[2]]] },
  { id: 'waltz', label: 'Вальс: «ум-па-па»', steps: (c) => [[c[0]], [c[1], c[2]], [c[1], c[2]]] },
];

/** Accompaniment: the same chords До, Фа, Соль, До played in different ways. */
export function Accompaniment({ tc }: { tc: Tc }) {
  const player = usePlayer();
  const [style, setStyle] = useState(STYLES[0]);
  const seq = PROGRESSION.flatMap((ch) => style.steps(ch.notes));
  const per = style.steps([0, 0, 0]).length;
  const lit = player.step >= 0 ? seq[player.step] ?? [] : [];
  const chordNow = player.step >= 0 ? Math.floor(player.step / per) : -1;
  const start = (s: (typeof STYLES)[number]) => {
    setStyle(s);
    const steps = PROGRESSION.flatMap((ch) => s.steps(ch.notes));
    player.play(steps.map((m) => ({ beats: 1, play: (at: number) => m.forEach((x, k) => playNote(x, 0.5, at, k === 0 && m.length === 1 ? 0.4 : 0.25)) })), 120);
  };
  return (
    <Figure
      title={tc('Аккомпанемент: аккорды До, Фа, Соль, До')}
      h={190}
      notes={[tc('Аккорды те же, меняется только способ игры.'), tc('Выбери способ и послушай. Клавиши тоже можно нажимать самому.')]}
      extra={
        <div className="chips-row md-choices">
          {STYLES.map((s) => (
            <button key={s.id} type="button" className={style.id === s.id && player.playing ? 'fchip on' : 'fchip'} onClick={() => start(s)}>
              ▶ {tc(s.label)}
            </button>
          ))}
        </div>
      }
    >
      {PROGRESSION.map((c, i) => (
        <text key={i} x={110 + i * 80} y="18" textAnchor="middle" fontSize="15" fontWeight="800" fill={chordNow === i ? '#e07a3f' : INK}>
          {tc(c.name)}
        </text>
      ))}
      <Keyboard x={20} y={30} octaves={2} keyW={28} lit={lit} marks={[]} tc={tc} />
    </Figure>
  );
}

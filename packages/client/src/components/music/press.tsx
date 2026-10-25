import { useEffect, useRef, useState } from 'react';
import { ListenButton, usePlayer, type Step } from './player';
import { playDrum, playNote, strum, whiteMidi } from './sound';
import { Callout, Figure, INK, Keyboard, MINT, PEACH, Staff, type Tc } from './parts';

const tap = (fn: () => void) => ({
  onPointerDown: (e: { preventDefault: () => void }) => {
    e.preventDefault();
    fn();
  },
  style: { cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" },
  role: 'button',
});

/** A play button for a row of single notes. */
function NotesButton({ tc, midis, label, bpm = 100, onStep, onNote }: { tc: Tc; midis: number[]; label: string; bpm?: number; onStep?: (i: number) => void; onNote?: (midi: number | null) => void }) {
  const player = usePlayer();
  useEffect(() => {
    onStep?.(player.step);
    onNote?.(player.step >= 0 ? midis[player.step] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.step]);
  return (
    <ListenButton
      tc={tc}
      label={label}
      playing={player.playing}
      onStop={player.stop}
      onPlay={() => player.play(midis.map((m, i) => ({ beats: i === midis.length - 1 ? 2 : 1, play: (at: number) => playNote(m, 0.6, at) })), bpm)}
    />
  );
}

const GLOW = '#f4a259';

const NOTE_NAMES = ['До', 'До♯', 'Ре', 'Ре♯', 'Ми', 'Фа', 'Фа♯', 'Соль', 'Соль♯', 'Ля', 'Ля♯', 'Си'];

/** Which note sounds now: set while «Listen» plays and for a moment after a tap. */
function useSounding() {
  const [cur, setCur] = useState<number | null>(null);
  const timer = useRef(0);
  const show = (midi: number) => {
    setCur(midi);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCur(null), 900);
  };
  const hit = (midi: number) => {
    playNote(midi, 0.9);
    show(midi);
  };
  return { cur, setCur, show, hit };
}

/** A big line under the picture: the name of the note that sounds now. */
function NowPlaying({ tc, cur }: { tc: Tc; cur: number | null }) {
  return (
    <div className="md-now" aria-live="polite">
      {cur === null ? <span>{tc('Нажми, чтобы услышать ноту')}</span> : <>{tc('Звучит')}: <b key={cur}>{tc(NOTE_NAMES[cur % 12])}</b></>}
    </div>
  );
}

/** Piano: where to put the right hand for the first melody, fingers 1–5 on До–Соль. */
export function PianoPress({ tc }: { tc: Tc }) {
  const { cur, setCur, show } = useSounding();
  return (
    <Figure
      title={tc('Нажми на любую клавишу')}
      h={220}
      notes={[tc('Большой палец (1) на До, мизинец (5) на Соль.'), tc('До всегда слева от двух чёрных клавиш.'), tc('Нажимай на клавиши: каждая звучит.')]}
      extra={
        <>
          <NowPlaying tc={tc} cur={cur} />
          <NotesButton tc={tc} midis={[60, 62, 64, 65, 67, 65, 64, 62, 60]} label="Послушать: До, Ре, Ми, Фа, Соль" onNote={setCur} />
        </>
      }
    >
      <Keyboard x={20} y={50} octaves={2} keyW={28} marks={[0, 1, 2, 3, 4]} fingers={{ 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 }} lit={cur === null ? [] : [cur]} onPress={show} tc={tc} />
    </Figure>
  );
}

/** Guitar: the first notes on the three thin strings. */
export function GuitarPress({ tc }: { tc: Tc }) {
  const strings = ['Ми', 'Си', 'Соль', 'Ре', 'Ля', 'Ми'];
  const dots: [number, number, string][] = [
    [0, 0, 'Ми'], [0, 1, 'Фа'], [0, 3, 'Соль'],
    [1, 0, 'Си'], [1, 1, 'До'], [1, 3, 'Ре'],
    [2, 0, 'Соль'], [2, 2, 'Ля'],
  ];
  const fx = (f: number) => (f === 0 ? 70 : 90 + (f - 0.5) * 80);
  // Real pitch of each dot: open strings Ми 64, Си 59, Соль 55 plus the fret.
  const midiOf = (st: number, f: number) => [64, 59, 55][st] + [0, 1, 2, 3][f] + (st === 0 && f === 3 ? 0 : 0);
  const { cur, setCur, hit } = useSounding();
  return (
    <Figure
      title={tc('Куда нажимать: первые ноты на гитаре')}
      h={250}
      notes={[tc('Цифра лада = номер пальца левой руки.'), tc('Прижимай струну рядом с металлическим порожком.'), tc('Нажми на кружок, чтобы услышать ноту.')]}
      extra={
        <>
          <NowPlaying tc={tc} cur={cur} />
          <NotesButton tc={tc} midis={[55, 57, 59, 60, 62, 64, 65, 67]} label="Послушать все ноты" onNote={setCur} />
        </>
      }
    >
      <rect x="90" y="40" width="340" height="170" fill="#8a5a3c" />
      <rect x="84" y="40" width="8" height="170" fill="#f0e2c8" />
      {[1, 2, 3, 4].map((f) => (
        <g key={f}>
          <line x1={90 + f * 80} y1="40" x2={90 + f * 80} y2="210" stroke="#c9ced6" strokeWidth="3" />
          <text x={90 + (f - 0.5) * 80} y="232" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
            {f} {tc('лад')}
          </text>
        </g>
      ))}
      {strings.map((s, i) => (
        <g key={i}>
          <line x1="70" y1={54 + i * 28} x2="430" y2={54 + i * 28} stroke="#efe8d8" strokeWidth={1 + i * 0.4} />
          <text x="2" y={58 + i * 28} fontSize="11" fill="#6b7786" fontWeight="700">
            {i + 1}. {tc(s)}
          </text>
        </g>
      ))}
      {dots.map(([s, f, name]) => (
        <g key={`${s}-${f}`} {...tap(() => hit(midiOf(s, f)))}>
          {cur === midiOf(s, f) && <circle cx={fx(f)} cy={54 + s * 28} r="19" fill={GLOW} opacity="0.55" className="md-ring" />}
          <circle cx={fx(f)} cy={54 + s * 28} r="12" fill={cur === midiOf(s, f) ? GLOW : f === 0 ? '#fff' : MINT} stroke={f === 0 ? MINT : '#fff'} strokeWidth="2" />
          <text x={fx(f)} y={58 + s * 28} textAnchor="middle" fontSize="9" fontWeight="800" fill={f === 0 ? INK : '#fff'}>
            {tc(name)}
          </text>
        </g>
      ))}
    </Figure>
  );
}

/** Ukulele: four chord shapes for the first songs. */
export function UkulelePress({ tc }: { tc: Tc }) {
  // fingers: [string index 0..3 from G to A, fret]
  const chords: { name: string; dots: [number, number][]; midi: number[] }[] = [
    { name: 'C', dots: [[3, 3]], midi: [67, 60, 64, 72] },
    { name: 'Am', dots: [[0, 2]], midi: [69, 60, 64, 69] },
    { name: 'F', dots: [[0, 2], [2, 1]], midi: [69, 60, 65, 69] },
    { name: 'G', dots: [[1, 2], [2, 3], [3, 2]], midi: [67, 62, 67, 71] },
  ];
  return (
    <Figure
      title={tc('Куда нажимать: первые аккорды на укулеле')}
      h={230}
      notes={[tc('Вертикальные линии это струны Соль, До, Ми, Ля, горизонтальные это лады.'), tc('Точка показывает, где прижать струну.'), tc('Нажми на аккорд, чтобы услышать, как он звучит.')]}
    >
      {chords.map((c, k) => (
        <g key={c.name} transform={`translate(${30 + k * 110} 30)`} {...tap(() => strum(c.midi))}>
          <rect x="0" y="-18" width="80" height="190" fill="transparent" />
          <text x="40" y="0" textAnchor="middle" fontSize="20" fontWeight="800" fill={INK}>
            {c.name}
          </text>
          <rect x="4" y="14" width="72" height="5" fill={INK} />
          {[0, 1, 2, 3].map((s) => (
            <line key={s} x1={10 + s * 20} y1="16" x2={10 + s * 20} y2="166" stroke="#8a94a3" strokeWidth="2" />
          ))}
          {[1, 2, 3, 4].map((f) => (
            <line key={f} x1="10" y1={16 + f * 37} x2="70" y2={16 + f * 37} stroke="#c9ced6" strokeWidth="2" />
          ))}
          {c.dots.map(([s, f]) => (
            <circle key={`${s}${f}`} cx={10 + s * 20} cy={16 + (f - 0.5) * 37} r="9" fill={MINT} stroke="#fff" strokeWidth="2" />
          ))}
        </g>
      ))}
    </Figure>
  );
}

/** Violin or cello: finger places on the two strings used for the first melody. */
export function BowedPress({ tc, cello = false }: { tc: Tc; cello?: boolean }) {
  const rows = cello
    ? [
        { string: 'Ре', notes: ['Ре', 'Ми', '', 'Фа♯', 'Соль'], midi: [50, 52, 0, 54, 55] },
        { string: 'Ля', notes: ['Ля', 'Си', '', 'До♯', 'Ре'], midi: [57, 59, 0, 61, 62] },
      ]
    : [
        { string: 'Ля', notes: ['Ля', 'Си', 'До♯', 'Ре'], midi: [69, 71, 73, 74] },
        { string: 'Ми', notes: ['Ми', 'Фа♯', 'Соль♯', 'Ля'], midi: [76, 78, 80, 81] },
      ];
  const { cur, setCur, hit } = useSounding();
  return (
    <Figure
      title={tc(cello ? 'Куда нажимать: пальцы на струнах Ре и Ля' : 'Куда нажимать: пальцы на струнах Ля и Ми')}
      h={210}
      notes={[tc('0 значит открытая струна, без пальца.'), tc(cello ? 'На виолончели между 1 и 3 пальцем остаётся место для 2.' : 'Наклей полоски на гриф, чтобы видеть места пальцев.'), tc('Нажми на кружок, чтобы услышать ноту.')]}
      extra={
        <>
          <NowPlaying tc={tc} cur={cur} />
          <NotesButton tc={tc} midis={rows.flatMap((r) => r.midi.filter(Boolean))} label="Послушать все ноты" bpm={80} onNote={setCur} />
        </>
      }
    >
      <rect x="40" y="40" width="390" height="120" rx="10" fill="#2f2a2a" />
      {rows.map((r, i) => (
        <g key={r.string}>
          <line x1="40" y1={75 + i * 50} x2="430" y2={75 + i * 50} stroke="#efe8d8" strokeWidth="2" />
          <text x="20" y={80 + i * 50} textAnchor="middle" fontSize="13" fontWeight="800" fill={INK}>
            {tc(r.string)}
          </text>
          {r.notes.map((n, f) =>
            n ? (
              <g key={f} {...tap(() => hit(r.midi[f]))}>
                {cur === r.midi[f] && <circle cx={70 + f * 80} cy={75 + i * 50} r="24" fill={GLOW} opacity="0.55" className="md-ring" />}
                <circle cx={70 + f * 80} cy={75 + i * 50} r="16" fill={cur === r.midi[f] ? GLOW : f === 0 ? '#fff' : MINT} />
                <text x={70 + f * 80} y={71 + i * 50} textAnchor="middle" fontSize="9" fontWeight="800" fill={f === 0 && cur !== r.midi[f] ? INK : '#fff'}>
                  {f}
                </text>
                <text x={70 + f * 80} y={83 + i * 50} textAnchor="middle" fontSize="9" fontWeight="700" fill={f === 0 && cur !== r.midi[f] ? INK : '#fff'}>
                  {tc(n)}
                </text>
              </g>
            ) : null,
          )}
        </g>
      ))}
    </Figure>
  );
}

/** Flute or saxophone: which keys to close for Си, Ля and Соль. */
export function WindPress({ tc, sax = false }: { tc: Tc; sax?: boolean }) {
  const notes: { name: string; closed: number; midi: number }[] = [
    { name: 'Си', closed: 1, midi: sax ? 59 : 71 },
    { name: 'Ля', closed: 2, midi: sax ? 57 : 69 },
    { name: 'Соль', closed: 3, midi: sax ? 55 : 67 },
  ];
  const { cur, setCur, hit } = useSounding();
  return (
    <Figure
      title={tc(sax ? 'Куда нажимать: первые ноты на саксофоне' : 'Куда нажимать: первые ноты на флейте')}
      h={250}
      notes={[tc('Закрашенный кружок значит, что клапан закрыт пальцем левой руки.'), tc(sax ? 'Левая рука сверху, правая снизу.' : 'Большой палец левой руки держит клапан сзади.'), tc('Нажми на ноту, чтобы услышать её.')]}
      extra={
        <>
          <NowPlaying tc={tc} cur={cur} />
          <NotesButton tc={tc} midis={notes.map((n) => n.midi)} label="Послушать: Си, Ля, Соль" bpm={70} onNote={setCur} />
        </>
      }
    >
      {notes.map((n, k) => (
        <g key={n.name} transform={`translate(${60 + k * 130} 20)`} {...tap(() => hit(n.midi))}>
          <rect x="-10" y="-4" width="80" height="229" rx="12" fill={cur === n.midi ? '#fff1e0' : 'transparent'} stroke={cur === n.midi ? GLOW : 'none'} strokeWidth="2" />
          <text x="30" y="16" textAnchor="middle" fontSize="18" fontWeight="800" fill={cur === n.midi ? '#e07a3f' : INK}>
            {tc(n.name)}
          </text>
          <rect x="18" y="28" width="24" height="190" rx="12" fill="#e6ebf0" stroke="#8a94a3" />
          {[0, 1, 2].map((h) => (
            <circle key={h} cx="30" cy={50 + h * 28} r="9" fill={h < n.closed ? INK : '#fff'} stroke={INK} strokeWidth="2" />
          ))}
          <line x1="20" y1="134" x2="40" y2="134" stroke="#8a94a3" strokeDasharray="3 3" />
          {[0, 1, 2].map((h) => (
            <circle key={`r${h}`} cx="30" cy={150 + h * 22} r="8" fill="#fff" stroke="#8a94a3" strokeWidth="2" />
          ))}
          <text x="60" y="80" fontSize="10" fill="#6b7786">
            {k === 0 ? tc('левая') : ''}
          </text>
          <text x="60" y="176" fontSize="10" fill="#6b7786">
            {k === 0 ? tc('правая') : ''}
          </text>
        </g>
      ))}
    </Figure>
  );
}

/** Drums: the simple rock beat as a grid of eighth notes. */
export function DrumPress({ tc }: { tc: Tc }) {
  const rows: { name: string; hits: number[]; color: string }[] = [
    { name: 'Хай-хэт', hits: [0, 1, 2, 3, 4, 5, 6, 7], color: '#e9c97a' },
    { name: 'Малый', hits: [2, 6], color: PEACH },
    { name: 'Бочка', hits: [0, 4], color: '#e8743b' },
  ];
  const counts = ['1', 'и', '2', 'и', '3', 'и', '4', 'и'];
  const kinds = ['hat', 'snare', 'kick'] as const;
  const player = usePlayer();
  const col = player.step >= 0 ? player.step % 8 : -1;
  const beat = (): Step[] =>
    Array.from({ length: 16 }, (_, i) => ({ beats: 0.5, play: (at: number) => rows.forEach((r, k) => r.hits.includes(i % 8) && playDrum(kinds[k], at)) }));
  return (
    <Figure
      title={tc('Простой рок-бит: что и когда играть')}
      h={220}
      notes={[tc('Считай вслух «раз-и-два-и» и играй по клеточкам.'), tc('Хай-хэт правой рукой, малый барабан левой, бочка правой ногой.'), tc('Нажми на клеточку, чтобы услышать этот барабан.')]}
      extra={<ListenButton tc={tc} label="Послушать бит" playing={player.playing} onStop={player.stop} onPlay={() => player.play(beat(), 90)} />}
    >
      {counts.map((c, i) => (
        <text key={i} x={130 + i * 40} y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill={col === i ? '#e07a3f' : INK}>
          {tc(c)}
        </text>
      ))}
      {rows.map((r, k) => (
        <g key={r.name}>
          <text x="110" y={84 + k * 50} textAnchor="end" fontSize="13" fontWeight="700" fill={INK}>
            {tc(r.name)}
          </text>
          {counts.map((_, i) => (
            <rect
              key={i}
              {...tap(() => playDrum(kinds[k]))}
              x={114 + i * 40}
              y={62 + k * 50}
              width="32"
              height="32"
              rx="8"
              fill={r.hits.includes(i) ? r.color : '#f2f4f6'}
              stroke={col === i ? INK : 'none'}
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
    </Figure>
  );
}

/** Accordion: right-hand keys and the left-hand bass and chord buttons. */
export function AccordionPress({ tc }: { tc: Tc }) {
  return (
    <Figure
      title={tc('Куда нажимать на аккордеоне')}
      h={250}
      notes={[tc('Правая рука играет мелодию на клавишах, как на пианино.'), tc('Левая рука нажимает бас До и рядом кнопку аккорда До мажор.'), tc('Клавиши и кнопки нажимаются: попробуй бас, потом аккорд.')]}
    >
      <Keyboard x={20} y={40} octaves={1} keyW={30} marks={[0, 2, 4]} fingers={{ 0: 1, 2: 3, 4: 5 }} tc={tc} />
      <g transform="translate(300 40)">
        {Array.from({ length: 15 }, (_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const on = row === 2 && col < 2;
          return (
            <circle
              key={i}
              {...tap(() => (on ? (col === 0 ? playNote(48, 0.8) : strum([60, 64, 67])) : playNote(48 + ((row * 7 + col * 4) % 12), 0.6)))}
              cx={20 + col * 34 + row * 8}
              cy={14 + row * 34}
              r="12"
              fill={on ? MINT : '#fff'}
              stroke="#8a94a3"
              strokeWidth="2"
            />
          );
        })}
        <Callout x={44} y={82} tx={10} ty={190} text={tc('Бас До')} />
        <Callout x={78} y={82} tx={110} ty={190} text={tc('Аккорд До')} anchor="middle" />
      </g>
    </Figure>
  );
}

/** Voice: the warm-up «ladder» do-re-mi-fa-sol and back. */
export function VoiceLadder({ tc }: { tc: Tc }) {
  const steps = ['До', 'Ре', 'Ми', 'Фа', 'Соль'];
  const ladder = [60, 62, 64, 65, 67, 65, 64, 62, 60];
  const [at, setAt] = useState(-1);
  const { cur, setCur, hit } = useSounding();
  return (
    <Figure
      title={tc('Распевка «Лесенка»')}
      h={230}
      notes={[tc('Пой по ступенькам вверх и обратно вниз на звук «ма».'), tc('Перед каждой фразой спокойно вдохни животом.'), tc('Нажми на ступеньку, чтобы услышать ноту, и спой её.')]}
      extra={
        <>
          <NowPlaying tc={tc} cur={cur} />
          <NotesButton tc={tc} midis={ladder} label="Послушать лесенку" bpm={90} onStep={setAt} onNote={setCur} />
        </>
      }
    >
      {[...steps, ...steps.slice(0, -1).reverse()].map((s, i) => {
        const h = i < 5 ? i : 8 - i;
        return (
          <g key={i} {...tap(() => (setAt(i), hit(ladder[i])))}>
            <rect x={20 + i * 48} y={180 - h * 32} width="44" height={20 + h * 32} rx="8" fill={at === i && cur !== null ? GLOW : i % 2 ? '#bfe6d4' : '#fde3d6'} />
            <text x={42 + i * 48} y={198 - h * 32 - 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>
              {tc(s)}
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

const DURATIONS: { name: string; beats: string; filled: boolean; stem: boolean; flag: boolean }[] = [
  { name: 'Целая', beats: '4', filled: false, stem: false, flag: false },
  { name: 'Половинная', beats: '2', filled: false, stem: true, flag: false },
  { name: 'Четверть', beats: '1', filled: true, stem: true, flag: false },
  { name: 'Восьмая', beats: '½', filled: true, stem: true, flag: true },
];

/** Note lengths: whole, half, quarter and eighth with their beats. Each note sounds as long as it lasts. */
export function Durations({ tc }: { tc: Tc }) {
  const beats = [4, 2, 1, 0.5];
  const player = usePlayer();
  const playOne = (b: number) => player.play([{ beats: b, play: (at) => playNote(67, b * 0.75 * 0.95, at) }], 80);
  return (
    <Figure
      title={tc('Длительности нот')}
      h={170}
      notes={[tc('Число под нотой показывает, на сколько счётов её тянуть.'), tc('Нажми на ноту и послушай, сколько она длится.')]}
      extra={
        <ListenButton
          tc={tc}
          label="Послушать все по очереди"
          playing={player.playing}
          onStop={player.stop}
          onPlay={() => player.play(beats.map((b) => ({ beats: b, play: (at: number) => playNote(67, b * 0.75 * 0.95, at) })), 80)}
        />
      }
    >
      {DURATIONS.map((d, i) => {
        const color = player.step === i ? '#e07a3f' : INK;
        return (
          <g key={d.name} transform={`translate(${60 + i * 105} 40)`} {...tap(() => playOne(beats[i]))}>
            <rect x="-40" y="0" width="80" height="125" fill="transparent" />
            <ellipse cx="0" cy="60" rx="11" ry="8" transform="rotate(-20 0 60)" fill={d.filled ? color : '#fff'} stroke={color} strokeWidth="2.5" />
            {d.stem && <line x1="10" y1="58" x2="10" y2="8" stroke={color} strokeWidth="2.5" />}
            {d.flag && <path d="M10 8c4 10 18 14 14 30" stroke={color} strokeWidth="2.5" fill="none" />}
            <text x="0" y="96" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
              {tc(d.name)}
            </text>
            <text x="0" y="116" textAnchor="middle" fontSize="15" fontWeight="800" fill={MINT}>
              {d.beats}
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

/** Notes До–До on the staff with their names; every note can be pressed. */
export function StaffNotes({ tc }: { tc: Tc }) {
  const names = ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си', 'До'];
  const midis = [60, 62, 64, 65, 67, 69, 71, 72];
  const gap = 12;
  const [on, setOn] = useState(-1);
  return (
    <Figure
      title={tc('Ноты на нотном стане')}
      h={170}
      notes={[tc('Ноты пишут на линейках и между ними: чем выше нота, тем выше звук.'), tc('Нажми на ноту, чтобы услышать её.')]}
      extra={<NotesButton tc={tc} midis={midis} label="Послушать: До, Ре, Ми, Фа, Соль, Ля, Си, До" onStep={setOn} />}
    >
      <Staff x={20} y={40} w={420} gap={gap} />
      {names.map((n, i) => {
        // bottom line (Ми) is at y = 40 + 4*gap; До is one ledger line below it
        const y = 40 + 4 * gap + gap - (i * gap) / 2;
        const color = on === i ? '#e07a3f' : INK;
        return (
          <g key={i} {...tap(() => playNote(midis[i], 0.8))}>
            <rect x={104 + i * 40} y="20" width="36" height="130" fill="transparent" />
            {i === 0 && <line x1={110 + i * 40} y1={y} x2={134 + i * 40} y2={y} stroke="#6b7786" strokeWidth="1.2" />}
            <ellipse cx={122 + i * 40} cy={y} rx="7" ry="5.5" transform={`rotate(-20 ${122 + i * 40} ${y})`} fill={color} />
            <text x={122 + i * 40} y="140" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>
              {tc(n)}
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

/** Keyboard pictures for scales, chords and semitones. Keys sound when pressed; the button plays the example. */
export function KeyboardTheory({ tc, kind }: { tc: Tc; kind: 'major' | 'minor' | 'triad' | 'sharps' | 'tones' }) {
  const player = usePlayer();
  const spec = {
    major: { title: 'Гамма До мажор: только белые клавиши от ноты До до ноты До', marks: [0, 1, 2, 3, 4, 5, 6, 7], black: [] as number[], label: 'Послушать гамму' },
    minor: { title: 'Гамма Ля минор: белые клавиши от ноты Ля до ноты Ля', marks: [5, 6, 7, 8, 9, 10, 11, 12], black: [], label: 'Послушать гамму' },
    triad: { title: 'Трезвучие До мажор: До, Ми, Соль (через одну клавишу)', marks: [0, 2, 4], black: [], label: 'Послушать аккорд' },
    sharps: { title: 'Чёрные клавиши: диез выше, бемоль ниже', marks: [0, 1], black: [0], label: 'Послушать: До, До♯, Ре' },
    tones: { title: 'Полутон: соседние клавиши. Тон: через одну', marks: [2, 3], black: [], label: 'Послушать: полутон, потом тон' },
  }[kind];
  // What sounds at each step of the example, as MIDI numbers.
  const chords: number[][] =
    kind === 'major' || kind === 'minor'
      ? [...spec.marks, ...spec.marks.slice(0, -1).reverse()].map((i) => [whiteMidi(i)])
      : kind === 'triad'
        ? [[60], [64], [67], [60, 64, 67]]
        : kind === 'sharps'
          ? [[60], [61], [62]]
          : [[64], [65], [], [60], [62]];
  const lit = player.step >= 0 ? chords[player.step] ?? [] : [];
  return (
    <Figure
      title={tc(spec.title)}
      h={190}
      notes={[tc('Нажимай на клавиши: каждая звучит.')]}
      extra={
        <ListenButton
          tc={tc}
          label={spec.label}
          playing={player.playing}
          onStop={player.stop}
          onPlay={() =>
            player.play(
              chords.map((c, i) => ({
                beats: i === chords.length - 1 ? 2 : 1,
                play: (at: number) => c.forEach((m) => playNote(m, i === chords.length - 1 ? 1.4 : 0.55, at)),
              })),
              kind === 'triad' ? 80 : 110,
            )
          }
        />
      }
    >
      <Keyboard x={20} y={30} octaves={2} keyW={28} marks={spec.marks} blackMarks={spec.black} lit={lit} tc={tc} />
      {kind === 'sharps' && <Callout x={48} y={40} tx={120} ty={176} text={tc('До♯ = Ре♭')} />}
    </Figure>
  );
}

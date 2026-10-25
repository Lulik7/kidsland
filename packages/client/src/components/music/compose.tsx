import { useEffect, useState } from 'react';
import { useLoop } from './player';
import { playDrum, playVoice, type Voice } from './sound';
import type { Tc } from './parts';

const STEPS = 16;

type ScaleId = 'major' | 'minor' | 'penta';

const SCALES: Record<ScaleId, { name: string; mood: string; notes: [number, string][] }> = {
  major: {
    name: 'Мажор',
    mood: 'весело и светло',
    notes: [[60, 'До'], [62, 'Ре'], [64, 'Ми'], [65, 'Фа'], [67, 'Соль'], [69, 'Ля'], [71, 'Си'], [72, 'До']],
  },
  minor: {
    name: 'Минор',
    mood: 'грустно и загадочно',
    notes: [[60, 'До'], [62, 'Ре'], [63, 'Ми♭'], [65, 'Фа'], [67, 'Соль'], [68, 'Ля♭'], [70, 'Си♭'], [72, 'До']],
  },
  penta: {
    name: 'Пентатоника',
    mood: 'любые ноты звучат дружно',
    notes: [[60, 'До'], [62, 'Ре'], [64, 'Ми'], [67, 'Соль'], [69, 'Ля'], [72, 'До'], [74, 'Ре'], [76, 'Ми']],
  },
};

const VOICES: [Voice, string][] = [
  ['piano', 'Пианино'],
  ['bells', 'Колокольчики'],
  ['synth', 'Синтезатор'],
];

const DRUMS = [
  ['hat', 'Хай-хэт'],
  ['snare', 'Малый'],
  ['kick', 'Бочка'],
] as const;

const ROW_COLORS = ['#ff8a80', '#ffb74d', '#ffd54f', '#aed581', '#4dd0e1', '#64b5f6', '#9575cd', '#f06292'];

interface Song {
  scale: ScaleId;
  voice: Voice;
  bpm: number;
  /** notes[row][step], row 0 = the lowest note */
  notes: boolean[][];
  drums: boolean[][];
}

const empty = (rows: number) => Array.from({ length: rows }, () => Array<boolean>(STEPS).fill(false));

const fresh = (): Song => ({ scale: 'major', voice: 'piano', bpm: 100, notes: empty(8), drums: empty(3) });

/** «Twinkle, twinkle»: До До Соль Соль Ля Ля Соль, the first song many children compose around. */
function example(): Song {
  const s = fresh();
  [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -1].forEach((row, i) => row >= 0 && (s.notes[row][i] = true));
  [0, 4, 8, 12].forEach((i) => (s.drums[2][i] = true));
  [4, 12].forEach((i) => (s.drums[1][i] = true));
  return s;
}

/** A random melody that moves by small steps and comes home to До at the end. */
function idea(scale: ScaleId): Song['notes'] {
  const notes = empty(8);
  let row = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < STEPS - 2; i += Math.random() < 0.7 ? 2 : 1) {
    notes[row][i] = true;
    row = Math.min(7, Math.max(0, row + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
  }
  notes[scale === 'penta' ? 5 : 0][STEPS - 2] = true;
  return notes;
}

const KEY = 'kl-compose';

function load(): Song {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '') as Song;
    if (s.notes?.length === 8 && s.drums?.length === 3) return s;
  } catch {
    /* nothing saved yet */
  }
  return fresh();
}

/**
 * The child's own little studio: tap cells to put notes on a grid, add drums, choose a mood and a sound,
 * then play the melody in a loop. The song is kept in the browser.
 */
export function Composer({ tc, task }: { tc: Tc; task?: string }) {
  const [song, setSong] = useState<Song>(load);
  const [loop, setLoop] = useState(true);
  const scale = SCALES[song.scale];
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(song));
    } catch {
      /* private mode */
    }
  }, [song]);
  const clock = useLoop(song.bpm, (i, at) => {
    if (!loop && i >= STEPS) return false;
    const s = i % STEPS;
    song.notes.forEach((row, r) => row[s] && playVoice(song.voice, scale.notes[r][0], 0.25, at, 0.28));
    song.drums.forEach((row, d) => row[s] && playDrum(DRUMS[d][0], at));
    return true;
  });
  const now = clock.step >= 0 ? clock.step % STEPS : -1;
  const toggle = (kind: 'notes' | 'drums', r: number, i: number) => {
    const grid = song[kind].map((row) => [...row]);
    grid[r][i] = !grid[r][i];
    if (grid[r][i]) kind === 'notes' ? playVoice(song.voice, scale.notes[r][0], 0.3) : playDrum(DRUMS[r][0]);
    setSong({ ...song, [kind]: grid });
  };
  const count = song.notes.flat().filter(Boolean).length;
  return (
    <figure className="music-diagram composer">
      <figcaption className="md-title">{tc('Сочиняем музыку')}</figcaption>
      {task && <p className="cp-task">🎯 {tc(task)}</p>}
      <div className="cp-bar">
        {(Object.keys(SCALES) as ScaleId[]).map((id) => (
          <button key={id} type="button" className={`fchip${song.scale === id ? ' on' : ''}`} onClick={() => setSong({ ...song, scale: id })}>
            {tc(SCALES[id].name)}
          </button>
        ))}
        <span className="muted small">{tc(scale.mood)}</span>
      </div>
      <div className="cp-grid" style={{ ['--steps' as string]: STEPS }}>
        {[...scale.notes].reverse().map(([midi, name], k) => {
          const r = 7 - k;
          return (
            <div key={midi} className="cp-row">
              <button type="button" className="cp-name" onClick={() => playVoice(song.voice, midi, 0.4)}>
                {tc(name)}
              </button>
              {song.notes[r].map((on, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${tc(name)} ${i + 1}`}
                  aria-pressed={on}
                  className={`cp-cell${on ? ' on' : ''}${i === now ? ' now' : ''}${i % 4 === 0 ? ' beat' : ''}`}
                  style={on ? { background: ROW_COLORS[r] } : undefined}
                  onClick={() => toggle('notes', r, i)}
                />
              ))}
            </div>
          );
        })}
        <div className="cp-gap" />
        {DRUMS.map(([kind, name], d) => (
          <div key={kind} className="cp-row drums">
            <button type="button" className="cp-name" onClick={() => playDrum(kind)}>
              {tc(name)}
            </button>
            {song.drums[d].map((on, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${tc(name)} ${i + 1}`}
                aria-pressed={on}
                className={`cp-cell${on ? ' on' : ''}${i === now ? ' now' : ''}${i % 4 === 0 ? ' beat' : ''}`}
                onClick={() => toggle('drums', d, i)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="cp-bar">
        <button type="button" className={`btn ${clock.running ? 'btn-light' : 'btn-go'} btn-small`} onClick={clock.running ? clock.stop : clock.start}>
          {clock.running ? `■ ${tc('Стоп')}` : `▶ ${tc('Играть')}`}
        </button>
        <label className="cp-check">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> {tc('По кругу')}
        </label>
        <label className="cp-tempo">
          {tc('Темп')}: <b>{song.bpm}</b>
          <input type="range" min={60} max={160} step={5} value={song.bpm} onChange={(e) => setSong({ ...song, bpm: Number(e.target.value) })} />
        </label>
        <select value={song.voice} onChange={(e) => setSong({ ...song, voice: e.target.value as Voice })} aria-label={tc('Звук')}>
          {VOICES.map(([v, name]) => (
            <option key={v} value={v}>
              {tc(name)}
            </option>
          ))}
        </select>
      </div>
      <div className="cp-bar">
        <button type="button" className="btn btn-light btn-small" onClick={() => setSong({ ...song, notes: idea(song.scale) })}>
          💡 {tc('Подскажи идею')}
        </button>
        <button type="button" className="btn btn-light btn-small" onClick={() => setSong(example())}>
          ⭐ {tc('Пример: «Звёздочка»')}
        </button>
        <button type="button" className="btn btn-light btn-small" onClick={() => setSong({ ...song, notes: empty(8), drums: empty(3) })}>
          🧽 {tc('Очистить')}
        </button>
        <span className="muted small">
          {tc('Нот в мелодии')}: {count}
        </span>
      </div>
      <ol className="md-notes">
        <li>{tc('Нажимай на клеточки: каждая строка это нота, каждый столбик это шаг во времени.')}</li>
        <li>{tc('Четыре столбика это один такт. Попробуй закончить мелодию на До: так она звучит законченно.')}</li>
        <li>{tc('Твоя мелодия сохраняется сама. Сыграй её родителям!')}</li>
      </ol>
    </figure>
  );
}

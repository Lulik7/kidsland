import { useEffect, useRef, useState } from 'react';
import { useLoop } from './player';
import { audio, playDrum, playNoise, playVoice, type Voice } from './sound';
import type { Tc } from './parts';

/** A one-bar loop; every track is in A minor, so any two of them sound good together. */
interface Track {
  name: string;
  icon: string;
  color: string;
  kick: number[];
  snare: number[];
  hat: number[];
  bass: [number, number][];
  chords: [number, number[]][];
  voice: Voice;
}

const AM = [57, 60, 64];
const F = [53, 57, 60];
const C = [55, 60, 64];
const G = [55, 59, 62];

const TRACKS: Track[] = [
  { name: 'Хаус', icon: '🏠', color: '#64b5f6', kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], bass: [[2, 33], [6, 33], [10, 36], [14, 38]], chords: [[0, AM], [6, AM]], voice: 'synth' },
  { name: 'Хип-хоп', icon: '🧢', color: '#ffb74d', kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [[0, 33], [10, 29]], chords: [[0, AM], [8, F]], voice: 'bells' },
  { name: 'Диско', icon: '🪩', color: '#f06292', kick: [0, 4, 8, 12], snare: [4, 12], hat: [1, 3, 5, 7, 9, 11, 13, 15], bass: [[0, 33], [2, 45], [4, 33], [6, 45], [8, 29], [10, 41], [12, 31], [14, 43]], chords: [[4, AM], [12, C]], voice: 'synth' },
  { name: 'Чилл', icon: '🌙', color: '#9575cd', kick: [0, 10], snare: [8], hat: [0, 4, 8, 12], bass: [[0, 33], [8, 31]], chords: [[0, [...AM, 67]], [8, [...G, 65]]], voice: 'bells' },
];

interface Deck {
  track: number;
  playing: boolean;
  volume: number;
  /** 0 = only the bass is heard, 1 = the filter is open */
  filter: number;
}

interface Nodes {
  input: GainNode;
  filter: BiquadFilterNode;
  volume: GainNode;
  fader: GainNode;
}

const cutoff = (f: number) => 150 * Math.pow(18000 / 150, f);

function DeckView({ tc, side, deck, beat, onChange }: { tc: Tc; side: 'A' | 'B'; deck: Deck; beat: number; onChange: (d: Deck) => void }) {
  const t = TRACKS[deck.track];
  return (
    <div className="dj-deck">
      <div className="dj-head">
        <b>{tc('Дека')} {side}</b>
        <span className="dj-lights">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={deck.playing && beat === i ? 'on' : ''} />
          ))}
        </span>
      </div>
      <button
        type="button"
        className={`dj-disc${deck.playing ? ' spin' : ''}`}
        style={{ ['--disc' as string]: t.color }}
        onClick={() => onChange({ ...deck, playing: !deck.playing })}
        aria-label={deck.playing ? tc('Пауза') : tc('Играть')}
      >
        <span>{t.icon}</span>
      </button>
      <button type="button" className={`btn ${deck.playing ? 'btn-light' : 'btn-go'} btn-small`} onClick={() => onChange({ ...deck, playing: !deck.playing })}>
        {deck.playing ? `⏸ ${tc('Пауза')}` : `▶ ${tc('Играть')}`}
      </button>
      <div className="dj-tracks">
        {TRACKS.map((tr, i) => (
          <button key={tr.name} type="button" className={`fchip${deck.track === i ? ' on' : ''}`} onClick={() => onChange({ ...deck, track: i })}>
            {tr.icon} {tc(tr.name)}
          </button>
        ))}
      </div>
      <label className="dj-knob">
        {tc('Громкость')}
        <input type="range" min={0} max={1} step={0.01} value={deck.volume} onChange={(e) => onChange({ ...deck, volume: Number(e.target.value) })} />
      </label>
      <label className="dj-knob">
        {tc('Фильтр')}
        <input type="range" min={0} max={1} step={0.01} value={deck.filter} onChange={(e) => onChange({ ...deck, filter: Number(e.target.value) })} />
      </label>
    </div>
  );
}

/**
 * A DJ console: two decks with loops that always stay in time, volume and filter on each deck,
 * a crossfader between them, a common tempo and effect pads.
 */
export function DjMixer({ tc, task }: { tc: Tc; task?: string }) {
  const [decks, setDecks] = useState<Deck[]>([
    { track: 0, playing: false, volume: 0.8, filter: 1 },
    { track: 1, playing: false, volume: 0.8, filter: 1 },
  ]);
  const [xf, setXf] = useState(0.5);
  const [bpm, setBpm] = useState(120);
  const nodes = useRef<{ master: GainNode; decks: Nodes[] } | null>(null);
  const graph = () => {
    const a = audio();
    if (!a) return null;
    if (!nodes.current) {
      const master = a.createGain();
      master.gain.value = 0.8;
      master.connect(a.destination);
      const make = (): Nodes => {
        const input = a.createGain();
        const filter = a.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 3;
        filter.frequency.value = 18000;
        const volume = a.createGain();
        const fader = a.createGain();
        input.connect(filter).connect(volume).connect(fader).connect(master);
        return { input, filter, volume, fader };
      };
      nodes.current = { master, decks: [make(), make()] };
    }
    return nodes.current;
  };
  useEffect(() => () => nodes.current?.master.disconnect(), []);
  // follow the knobs smoothly
  useEffect(() => {
    const g = nodes.current;
    const a = audio();
    if (!g || !a) return;
    decks.forEach((d, i) => {
      g.decks[i].volume.gain.setTargetAtTime(d.volume, a.currentTime, 0.03);
      g.decks[i].filter.frequency.setTargetAtTime(cutoff(d.filter), a.currentTime, 0.05);
    });
    g.decks[0].fader.gain.setTargetAtTime(Math.cos((xf * Math.PI) / 2), a.currentTime, 0.03);
    g.decks[1].fader.gain.setTargetAtTime(Math.sin((xf * Math.PI) / 2), a.currentTime, 0.03);
  }, [decks, xf]);
  const decksRef = useRef(decks);
  decksRef.current = decks;
  const clock = useLoop(bpm, (i, at) => {
    const g = nodes.current;
    if (!g) return false;
    const s = i % 16;
    decksRef.current.forEach((d, k) => {
      if (!d.playing) return;
      const t = TRACKS[d.track];
      const out = g.decks[k].input;
      if (t.kick.includes(s)) playDrum('kick', at, out);
      if (t.snare.includes(s)) playDrum('snare', at, out);
      if (t.hat.includes(s)) playDrum('hat', at, out);
      t.bass.forEach(([st, m]) => st === s && playVoice('bass', m, 0.18, at, 0.35, out));
      t.chords.forEach(([st, ch]) => st === s && ch.forEach((m) => playVoice(t.voice, m, 0.3, at, 0.1, out)));
    });
    return true;
  });
  const anyPlaying = decks.some((d) => d.playing);
  useEffect(() => {
    if (anyPlaying && !clock.running) {
      graph();
      clock.start();
    }
    if (!anyPlaying && clock.running) clock.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyPlaying]);
  const set = (i: number) => (d: Deck) => {
    graph();
    setDecks(decks.map((x, k) => (k === i ? d : x)));
  };
  const pad = (kind: string) => {
    const g = graph();
    const a = audio();
    if (!g || !a) return;
    const t = a.currentTime;
    if (kind === 'clap') playNoise(t, 0.18, 1500, 1200, 0.9, g.master);
    if (kind === 'scratch') {
      playNoise(t, 0.09, 500, 3500, 0.8, g.master);
      playNoise(t + 0.11, 0.09, 3500, 500, 0.8, g.master);
      playNoise(t + 0.24, 0.07, 700, 2800, 0.7, g.master);
    }
    if (kind === 'rise') playNoise(t, 2, 300, 9000, 0.35, g.master, 'highpass');
    if (kind === 'boom') {
      playDrum('kick', t, g.master);
      playVoice('bass', 33, 0.6, t, 0.5, g.master);
    }
    if (kind === 'siren') {
      const o = a.createOscillator();
      const v = a.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(600, t);
      [1200, 600, 1200, 600].forEach((f, k) => o.frequency.linearRampToValueAtTime(f, t + 0.25 * (k + 1)));
      v.gain.setValueAtTime(0.12, t);
      v.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      o.connect(v).connect(g.master);
      o.start(t);
      o.stop(t + 1.1);
    }
  };
  const beat = clock.step >= 0 ? Math.floor((clock.step % 16) / 4) : -1;
  return (
    <figure className="music-diagram dj-mixer">
      <figcaption className="md-title">{tc('Пульт диджея')}</figcaption>
      {task && <p className="cp-task">🎯 {tc(task)}</p>}
      <div className="dj-main">
        <DeckView tc={tc} side="A" deck={decks[0]} beat={beat} onChange={set(0)} />
        <div className="dj-center">
          <label className="dj-knob">
            {tc('Темп')}: <b>{bpm}</b> BPM
            <input type="range" min={80} max={140} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
          </label>
          <div className="dj-pads">
            {[
              ['clap', '👏', 'Хлопок'],
              ['scratch', '💿', 'Скретч'],
              ['rise', '🚀', 'Взлёт'],
              ['boom', '💥', 'Бум'],
              ['siren', '🚨', 'Сирена'],
            ].map(([k, icon, name]) => (
              <button key={k} type="button" className="dj-pad" onPointerDown={() => pad(k)}>
                <span>{icon}</span>
                {tc(name)}
              </button>
            ))}
          </div>
        </div>
        <DeckView tc={tc} side="B" deck={decks[1]} beat={beat} onChange={set(1)} />
      </div>
      <label className="dj-xf">
        <span>A</span>
        <input type="range" min={0} max={1} step={0.01} value={xf} onChange={(e) => (graph(), setXf(Number(e.target.value)))} aria-label={tc('Кроссфейдер')} />
        <span>B</span>
      </label>
      <p className="dj-xf-name muted small">{tc('Кроссфейдер: двигай, чтобы плавно перейти с одного трека на другой')}</p>
      <ol className="md-notes">
        <li>{tc('Включи деку A, потом деку B: треки всегда идут в одном темпе.')}</li>
        <li>{tc('Фильтр убирает высокие звуки: поверни его вниз и медленно открой обратно, это любимый приём диджеев.')}</li>
        <li>{tc('Пэды добавляют эффекты: нажимай их ровно на счёт «раз».')}</li>
        <li>{tc('Береги уши: слушай музыку негромко.')}</li>
      </ol>
    </figure>
  );
}

/** Small Web Audio synth for the music pictures: piano-like notes, metronome clicks and claps. */
let ctx: AudioContext | null = null;

export function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** A soft piano-like note. `at` is AudioContext time; 0 means now. */
export function playNote(midi: number, dur = 0.6, at = 0, volume = 0.35, out?: AudioNode) {
  const a = audio();
  if (!a) return;
  const t = Math.max(at, a.currentTime);
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(volume * 0.4, t + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.2) + 0.35);
  gain.connect(out ?? a.destination);
  for (const [type, mult, vol] of [
    ['triangle', 1, 1],
    ['sine', 2, 0.35],
    ['sine', 3, 0.12],
  ] as const) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq(midi) * mult;
    g.gain.value = vol;
    o.connect(g).connect(gain);
    o.start(t);
    o.stop(t + Math.max(dur, 0.2) + 0.4);
  }
}

/** A metronome tick; the first beat of a bar sounds higher. */
export function playClick(at = 0, strong = false, soft = false) {
  const a = audio();
  if (!a) return;
  const t = Math.max(at, a.currentTime);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'square';
  o.frequency.value = strong ? 1760 : soft ? 880 : 1175;
  const v = soft ? 0.06 : strong ? 0.3 : 0.18;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.06);
}

/** A hand clap made of filtered noise. */
export function playClap(at = 0, volume = 0.6) {
  const a = audio();
  if (!a) return;
  const t = Math.max(at, a.currentTime);
  const len = Math.floor(a.sampleRate * 0.15);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1400;
  f.Q.value = 0.8;
  const g = a.createGain();
  g.gain.value = volume;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

/** White key index (0 = До of the first octave) to MIDI number; До4 = 60. */
export const whiteMidi = (i: number) => 60 + 12 * Math.floor(i / 7) + [0, 2, 4, 5, 7, 9, 11][((i % 7) + 7) % 7];

/**
 * Plays steps one after another and calls `onStep` with each index as it sounds (and -1 at the end).
 * Returns a function that stops the playback.
 */
export function playSteps(steps: { beats: number; play: (at: number) => void }[], bpm: number, onStep: (i: number) => void): () => void {
  const a = audio();
  if (!a) return () => {};
  const beat = 60 / bpm;
  let t = a.currentTime + 0.1;
  const timers: number[] = [];
  steps.forEach((s, i) => {
    s.play(t);
    timers.push(window.setTimeout(() => onStep(i), (t - a.currentTime) * 1000));
    t += s.beats * beat;
  });
  timers.push(window.setTimeout(() => onStep(-1), (t - a.currentTime) * 1000));
  return () => {
    timers.forEach(clearTimeout);
    onStep(-1);
  };
}

/** Simple synthesized drums for the rock beat. */
export function playDrum(kind: 'kick' | 'snare' | 'hat', at = 0, out?: AudioNode) {
  const a = audio();
  if (!a) return;
  const t = Math.max(at, a.currentTime);
  const dest = out ?? a.destination;
  if (kind === 'kick') {
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.32);
    return;
  }
  const len = Math.floor(a.sampleRate * (kind === 'hat' ? 0.05 : 0.18));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = kind === 'hat' ? 'highpass' : 'bandpass';
  f.frequency.value = kind === 'hat' ? 7000 : 1800;
  const g = a.createGain();
  g.gain.value = kind === 'hat' ? 0.25 : 0.6;
  src.connect(f).connect(g).connect(dest);
  src.start(t);
  if (kind === 'snare') {
    const o = a.createOscillator();
    const og = a.createGain();
    o.frequency.value = 190;
    og.gain.setValueAtTime(0.3, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og).connect(dest);
    o.start(t);
    o.stop(t + 0.12);
  }
}

/** Plays notes of a chord one after another quickly, like a strum. */
export function strum(midis: number[], at = 0) {
  const a = audio();
  if (!a) return;
  const t = Math.max(at, a.currentTime);
  midis.forEach((m, i) => playNote(m, 1.2, t + i * 0.035, 0.22));
}

/** Sound colours for the composer and the DJ decks. */
export type Voice = 'piano' | 'bells' | 'synth' | 'bass';

/** One note in a chosen sound colour, sent to `out` (the speakers by default). */
export function playVoice(voice: Voice, midi: number, dur = 0.3, at = 0, volume = 0.3, out?: AudioNode) {
  if (voice === 'piano') return playNote(midi, dur, at, volume, out);
  const a = audio();
  if (!a) return;
  const t = Math.max(at, a.currentTime);
  const g = a.createGain();
  const end = t + dur + (voice === 'bells' ? 0.9 : 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  g.gain.exponentialRampToValueAtTime(voice === 'bells' ? volume * 0.3 : volume * 0.7, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  let last: AudioNode = g;
  if (voice === 'synth' || voice === 'bass') {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(voice === 'bass' ? 900 : 3200, t);
    f.frequency.exponentialRampToValueAtTime(voice === 'bass' ? 220 : 900, end);
    f.Q.value = 6;
    g.connect(f);
    last = f;
  }
  last.connect(out ?? a.destination);
  const parts: [OscillatorType, number, number][] =
    voice === 'bells' ? [['sine', 1, 1], ['sine', 4, 0.25], ['sine', 2.76, 0.15]] : voice === 'bass' ? [['sawtooth', 1, 1], ['square', 0.5, 0.5]] : [['sawtooth', 1, 0.6], ['sawtooth', 1.006, 0.6]];
  for (const [type, mult, vol] of parts) {
    const o = a.createOscillator();
    const og = a.createGain();
    o.type = type;
    o.frequency.value = freq(midi) * mult;
    og.gain.value = vol;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(end + 0.05);
  }
}

/** A noise burst swept through a filter: claps, scratches and risers for the DJ pads. */
export function playNoise(at: number, dur: number, from: number, to: number, volume: number, out?: AudioNode, type: BiquadFilterType = 'bandpass') {
  const a = audio();
  if (!a) return;
  const t = Math.max(at, a.currentTime);
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = 4;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out ?? a.destination);
  src.start(t);
}

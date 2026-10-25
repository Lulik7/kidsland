import { audio } from './music/sound';

/**
 * Animal and nature sounds made with the Web Audio API (no recordings needed).
 * Each recipe schedules its sound from `at` into `out` and returns how long it lasts in seconds.
 */
type Recipe = (ac: AudioContext, out: AudioNode, at: number) => number;

let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  return src;
}

/** A gain node with an attack-hold-release envelope. */
function env(ac: AudioContext, out: AudioNode, at: number, attack: number, hold: number, release: number, peak: number) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.setValueAtTime(peak, at + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
  g.connect(out);
  return g;
}

function tone(ac: AudioContext, out: AudioNode, at: number, type: OscillatorType, freqs: [number, number][], dur: number, peak: number, attack = 0.03, release = 0.12) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freqs[0][1], at);
  for (const [t, f] of freqs.slice(1)) o.frequency.linearRampToValueAtTime(f, at + t);
  o.connect(env(ac, out, at, attack, Math.max(0, dur - attack - release), release, peak));
  o.start(at);
  o.stop(at + dur + 0.05);
  return o;
}

function noiseBand(ac: AudioContext, out: AudioNode, at: number, dur: number, type: BiquadFilterType, freq: number, q: number, peak: number, attack = 0.01, release = 0.05) {
  const n = noise(ac);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  n.connect(f).connect(env(ac, out, at, attack, Math.max(0, dur - attack - release), release, peak));
  n.start(at, Math.random());
  n.stop(at + dur + 0.05);
  return f;
}

const vibrato = (ac: AudioContext, o: OscillatorNode, at: number, rate: number, depth: number, dur: number) => {
  const l = ac.createOscillator();
  const g = ac.createGain();
  l.frequency.value = rate;
  g.gain.value = depth;
  l.connect(g).connect(o.frequency);
  l.start(at);
  l.stop(at + dur);
};

const SOUNDS: Record<string, Recipe> = {
  woodpecker: (ac, out, at) => {
    for (const start of [0, 1.1]) for (let i = 0; i < 14; i++) noiseBand(ac, out, at + start + i * 0.045, 0.02, 'bandpass', 1400, 6, 0.9, 0.002, 0.015);
    return 1.9;
  },
  cuckoo: (ac, out, at) => {
    for (let i = 0; i < 3; i++) {
      const t = at + i * 1.0;
      tone(ac, out, t, 'sine', [[0, 690]], 0.28, 0.35, 0.04, 0.12);
      tone(ac, out, t + 0.33, 'sine', [[0, 560]], 0.42, 0.35, 0.04, 0.2);
    }
    return 3;
  },
  owl: (ac, out, at) => {
    const hoots: [number, number][] = [[0, 0.7], [1.0, 0.25], [1.35, 0.25], [1.7, 0.8]];
    for (const [t, d] of hoots) {
      const o = tone(ac, out, at + t, 'sine', [[0, 380], [d, 340]], d, 0.4, 0.08, 0.25);
      vibrato(ac, o, at + t, 6, 6, d);
    }
    return 2.6;
  },
  birds: (ac, out, at) => {
    let t = 0;
    for (let i = 0; i < 16; i++) {
      const f = 2600 + Math.random() * 2400;
      tone(ac, out, at + t, 'sine', [[0, f], [0.07, f * (Math.random() > 0.5 ? 1.35 : 0.75)]], 0.08, 0.18, 0.005, 0.04);
      t += i % 4 === 3 ? 0.35 : 0.1;
    }
    return t + 0.2;
  },
  rain: (ac, out, at) => {
    noiseBand(ac, out, at, 3, 'highpass', 1800, 0.5, 0.18, 0.4, 0.8);
    for (let i = 0; i < 40; i++) noiseBand(ac, out, at + Math.random() * 3, 0.015, 'bandpass', 2500 + Math.random() * 3000, 4, 0.4, 0.001, 0.01);
    return 3;
  },
  stream: (ac, out, at) => {
    const f = noiseBand(ac, out, at, 3.2, 'bandpass', 900, 1.2, 0.35, 0.4, 0.8);
    const l = ac.createOscillator();
    const g = ac.createGain();
    l.frequency.value = 3.3;
    g.gain.value = 400;
    l.connect(g).connect(f.frequency);
    l.start(at);
    l.stop(at + 3.3);
    return 3.2;
  },
  wind: (ac, out, at) => {
    const f = noiseBand(ac, out, at, 3.5, 'bandpass', 300, 3, 0.45, 1, 1.2);
    f.frequency.setValueAtTime(300, at);
    f.frequency.linearRampToValueAtTime(900, at + 1.7);
    f.frequency.linearRampToValueAtTime(400, at + 3.5);
    return 3.5;
  },
  sea: (ac, out, at) => {
    for (const t of [0, 1.8]) noiseBand(ac, out, at + t, 2.2, 'lowpass', 700, 0.7, 0.5, 0.9, 1);
    return 4;
  },
  thunder: (ac, out, at) => {
    noiseBand(ac, out, at, 2.5, 'lowpass', 160, 1, 1, 0.05, 2);
    return 2.6;
  },
  frog: (ac, out, at) => {
    for (const t of [0, 0.45, 1.3]) {
      const o = ac.createOscillator();
      const f = ac.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(140, at + t);
      o.frequency.linearRampToValueAtTime(110, at + t + 0.25);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(500, at + t);
      f.frequency.linearRampToValueAtTime(1200, at + t + 0.12);
      f.frequency.linearRampToValueAtTime(400, at + t + 0.25);
      f.Q.value = 4;
      o.connect(f).connect(env(ac, out, at + t, 0.02, 0.15, 0.08, 0.6));
      o.start(at + t);
      o.stop(at + t + 0.3);
    }
    return 1.7;
  },
  cricket: (ac, out, at) => {
    for (let c = 0; c < 6; c++) for (let i = 0; i < 4; i++) tone(ac, out, at + c * 0.45 + i * 0.035, 'sine', [[0, 4400]], 0.025, 0.12, 0.003, 0.012);
    return 2.8;
  },
  bee: (ac, out, at) => {
    const o = tone(ac, out, at, 'sawtooth', [[0, 210], [1, 240], [2, 200]], 2.2, 0.08, 0.3, 0.5);
    vibrato(ac, o, at, 9, 8, 2.3);
    return 2.3;
  },
  cat: (ac, out, at) => {
    for (const t of [0, 1.1]) {
      const o = ac.createOscillator();
      const f = ac.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(480, at + t);
      o.frequency.linearRampToValueAtTime(760, at + t + 0.25);
      o.frequency.linearRampToValueAtTime(430, at + t + 0.75);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(900, at + t);
      f.frequency.linearRampToValueAtTime(2200, at + t + 0.3);
      f.frequency.linearRampToValueAtTime(800, at + t + 0.75);
      f.Q.value = 3;
      o.connect(f).connect(env(ac, out, at + t, 0.06, 0.45, 0.25, 0.5));
      o.start(at + t);
      o.stop(at + t + 0.85);
    }
    return 2;
  },
  dog: (ac, out, at) => {
    for (const t of [0, 0.32, 1.0]) {
      const o = tone(ac, out, at + t, 'sawtooth', [[0, 420], [0.12, 260]], 0.16, 0.25, 0.005, 0.08);
      void o;
      noiseBand(ac, out, at + t, 0.12, 'bandpass', 1100, 1.5, 0.35, 0.004, 0.08);
    }
    return 1.4;
  },
  wolf: (ac, out, at) => {
    const o = tone(ac, out, at, 'sine', [[0, 380], [0.6, 720], [2.2, 650], [3, 420]], 3, 0.35, 0.3, 0.8);
    vibrato(ac, o, at + 0.6, 5, 7, 2.4);
    return 3.1;
  },
  horse: (ac, out, at) => {
    const o = tone(ac, out, at, 'sawtooth', [[0, 900], [0.15, 1300], [1.2, 500]], 1.3, 0.12, 0.05, 0.4);
    vibrato(ac, o, at, 22, 60, 1.3);
    return 1.4;
  },
  cow: (ac, out, at) => {
    const o = ac.createOscillator();
    const f = ac.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(140, at);
    o.frequency.linearRampToValueAtTime(110, at + 1.4);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(400, at);
    f.frequency.linearRampToValueAtTime(1100, at + 0.5);
    f.frequency.linearRampToValueAtTime(350, at + 1.4);
    o.connect(f).connect(env(ac, out, at, 0.15, 0.9, 0.4, 0.5));
    o.start(at);
    o.stop(at + 1.5);
    return 1.5;
  },
  rooster: (ac, out, at) => {
    const parts: [number, number, number, number][] = [[0, 0.15, 700, 900], [0.17, 0.15, 900, 1000], [0.34, 0.6, 1000, 700]];
    for (const [t, d, a, b] of parts) {
      const o = tone(ac, out, at + t, 'sawtooth', [[0, a], [d, b]], d, 0.12, 0.02, 0.08);
      vibrato(ac, o, at + t, 30, 25, d);
    }
    return 1.1;
  },
  duck: (ac, out, at) => {
    for (const t of [0, 0.3, 0.6]) {
      const o = ac.createOscillator();
      const f = ac.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(320, at + t);
      o.frequency.linearRampToValueAtTime(260, at + t + 0.18);
      f.type = 'bandpass';
      f.frequency.value = 1300;
      f.Q.value = 6;
      o.connect(f).connect(env(ac, out, at + t, 0.01, 0.1, 0.08, 0.8));
      o.start(at + t);
      o.stop(at + t + 0.22);
    }
    return 1;
  },
};

/** Words in a lesson text and the sounds they name, in the order the sounds are tried. */
const WORDS: [RegExp, string][] = [
  [/дятел|дятл/i, 'woodpecker'],
  [/кукушк|кукует/i, 'cuckoo'],
  [/сов[аыуе]?\b|филин|ухают/i, 'owl'],
  [/пени[ея] птиц|птиц[аы]? поют|соловей|щебет|чирик|трел/i, 'birds'],
  [/дожд/i, 'rain'],
  [/ручей|ручья|журч|рек[аиу]\b/i, 'stream'],
  [/ветер|ветр/i, 'wind'],
  [/мор[ея]\b|волн[ыа]/i, 'sea'],
  [/гром|гроз/i, 'thunder'],
  [/лягушк|квак/i, 'frog'],
  [/сверч|кузнечик|стрекоч/i, 'cricket'],
  [/пчел|пчёл|жужж|шмел/i, 'bee'],
  [/мяука|мурлы|кошк|котен|котён/i, 'cat'],
  [/ла[ея]т|лай|гав/i, 'dog'],
  [/волк|вой\b|воет/i, 'wolf'],
  [/ржёт|ржет|ржани|лошад/i, 'horse'],
  [/корова|мычит|мычан/i, 'cow'],
  [/петух|кукарек/i, 'rooster'],
  [/утк[аи]|крякает|кря\b/i, 'duck'],
];

/** The sounds a piece of text talks about, in the order it mentions them (at most 4). */
export function soundsIn(text: string): string[] {
  const found = WORDS.map(([re, id]) => ({ id, at: text.search(re) })).filter((x) => x.at >= 0);
  return [...new Set(found.sort((a, b) => a.at - b.at).map((x) => x.id))].slice(0, 4);
}

let current: GainNode | null = null;

/** Plays the sounds one after another; calls `done` when they end. Starting again stops the previous play. */
export function playSounds(ids: string[], done?: () => void): () => void {
  const ac = audio();
  if (!ac) return () => {};
  stopSounds();
  const master = ac.createGain();
  master.gain.value = 0.8;
  master.connect(ac.destination);
  current = master;
  let t = ac.currentTime + 0.05;
  for (const id of ids) t += (SOUNDS[id]?.(ac, master, t) ?? 0) + 0.5;
  const timer = window.setTimeout(() => {
    if (current === master) current = null;
    done?.();
  }, (t - ac.currentTime) * 1000);
  return () => {
    window.clearTimeout(timer);
    stopSounds();
  };
}

export function stopSounds() {
  if (!current) return;
  const g = current;
  current = null;
  try {
    g.gain.setTargetAtTime(0, g.context.currentTime, 0.05);
    window.setTimeout(() => g.disconnect(), 300);
  } catch {
    /* already gone */
  }
}

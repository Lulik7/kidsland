/** Reading lesson texts aloud: recorded voices where we have them, otherwise the browser's voices. */
import { genderOf, isRecorded, recordingUrl } from './voices';

let current: HTMLAudioElement | null = null;
let currentPace = 1;

/** Recordings that came out a little slow are played this much faster at «normal» speed. */
const RECORDED_PACE: Record<string, number> = { el: 1.12 };

/** Reading speed the child picked: slower, normal or faster. Remembered on this computer. */
export const SPEEDS = [0.7, 1, 1.25] as const;
let speed = 1;
try {
  speed = Number(localStorage.getItem('kl-speed')) || 1;
} catch {
  /* storage blocked: keep normal speed */
}
const speedListeners = new Set<(s: number) => void>();
export const getSpeed = () => speed;
export function setSpeed(s: number) {
  speed = s;
  try {
    localStorage.setItem('kl-speed', String(s));
  } catch {
    /* storage blocked */
  }
  if (current) current.playbackRate = s * currentPace;
  speedListeners.forEach((f) => f(s));
}
export function onSpeed(f: (s: number) => void) {
  speedListeners.add(f);
  return () => void speedListeners.delete(f);
}

/** Plays a recorded line; resolves false when there is no recording, so the browser voice can step in. */
function playRecording(text: string, lang: string, speaker: string | undefined): Promise<boolean> {
  const base = lang.split('-')[0];
  if (!isRecorded(base, speaker) || typeof Audio === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    current?.pause();
    const a = new Audio(recordingUrl(base, text, speaker));
    current = a;
    // Recordings already have a natural pace: only the child's speed choice changes it, keeping the pitch.
    a.preservesPitch = true;
    currentPace = RECORDED_PACE[base] ?? 1;
    a.playbackRate = speed * currentPace;
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}

function voicesOf(lang: string): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return [];
  const base = lang.split('-')[0];
  const all = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(base));
  // Natural-sounding voices first, then the exact accent (en-GB before en-US).
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online|google|premium|enhanced/i.test(v.name) ? 0 : 2) + (v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase() ? 0 : 1);
  return [...all].sort((a, b) => score(a) - score(b));
}

export const canSpeak = () => typeof speechSynthesis !== 'undefined';

/** Women's voices in Windows, macOS, Chrome and Edge, recognised by name. */
const FEMALE_VOICE =
  /female|zira|hazel|susan|heera|catherine|linda|aria|jenny|michelle|sonia|libby|maisie|natasha|clara|emily|hila|carmit|elsa|isabella|helena|laura|sabina|dalia|elvira|hortense|julie|denise|eloise|vivienne|hedda|katja|amala|seraphina|louisa|gisela|haruka|ayumi|nanami|huihui|yaoyao|xiaoxiao|xiaoyi|hsiaochen|tracy|athina|melina|eka|irina|svetlana|dariya|milena|samantha|karen|moira|tessa|fiona|victoria|amelie|anna|alice|federica|paola|monica|paulina|kyoko|o-ren|ting-ting|mei-jia|sin-ji|yuna|marie|amélie|lucia|elena|ximena|salome/i;

/** Picks a voice for the speaker: a woman's or a man's voice when the computer has one, the best voice otherwise. */
function voiceFor(lang: string, speaker?: string): { voice?: SpeechSynthesisVoice; exact: boolean } {
  const voices = voicesOf(lang);
  if (!speaker) return { voice: voices[0], exact: true };
  const female = genderOf(speaker) === 'f';
  const match = voices.find((v) => FEMALE_VOICE.test(v.name) === female);
  return match ? { voice: match, exact: true } : { voice: voices[0], exact: false };
}

const NATURAL = /natural|neural|online|premium|enhanced/i;

/** A natural-sounding browser voice of the speaker's gender, when this computer or phone has one. */
function naturalVoice(lang: string, speaker?: string) {
  const female = genderOf(speaker) === 'f';
  return voicesOf(lang).find((v) => NATURAL.test(v.name) && (!speaker || FEMALE_VOICE.test(v.name) === female));
}

/**
 * Says `text` in `lang` with the best voice the computer has. In dialogues a woman's or a man's voice is chosen
 * by the speaker; when the computer has only one voice, the second speaker gets it a little higher.
 */
export async function say(text: string, lang: string, who = 0, rate = 0.9, speaker?: string): Promise<void> {
  // A natural browser voice (Edge, Safari, phones) beats our recordings; otherwise recordings beat robotic voices.
  if (!naturalVoice(lang, speaker) && (await playRecording(text, lang, speaker))) return;
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const { voice, exact } = voiceFor(lang, speaker);
    if (voice) u.voice = voice;
    // Calm and friendly: a bit slower than normal, never squeaky.
    u.rate = rate * 0.92 * speed;
    if (!speaker && who % 2) u.pitch = 1.3;
    else if (!exact && who % 2) u.pitch = 1.15;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  current?.pause();
  if (canSpeak()) speechSynthesis.cancel();
}

/** Words lesson lines look like «cat [кэт] — кошка»: only the foreign part is read aloud. */
export const foreignPart = (text: string) =>
  text
    .split('\n')
    .map((l) => l.split(' [')[0].split(' — ')[0].trim())
    .filter(Boolean);

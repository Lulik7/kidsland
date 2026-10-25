/** Reading lesson texts aloud: recorded voices where we have them, otherwise the browser's voices. */
import { genderOf, isRecorded, recordingUrl } from './voices';

let current: HTMLAudioElement | null = null;

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
  if (current) current.playbackRate = Math.min(1, (current as HTMLAudioElement & { baseRate?: number }).baseRate ?? 1) * s;
  speedListeners.forEach((f) => f(s));
}
export function onSpeed(f: (s: number) => void) {
  speedListeners.add(f);
  return () => void speedListeners.delete(f);
}

/** Plays a recorded line; resolves false when there is no recording, so the browser voice can step in. */
function playRecording(text: string, lang: string, speaker: string | undefined, rate: number): Promise<boolean> {
  const base = lang.split('-')[0];
  if (!isRecorded(base, speaker) || typeof Audio === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    current?.pause();
    const a = new Audio(recordingUrl(base, text, speaker));
    current = a;
    (a as HTMLAudioElement & { baseRate?: number }).baseRate = rate + 0.1;
    a.playbackRate = Math.min(1, rate + 0.1) * speed;
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

/**
 * Says `text` in `lang` with the best voice the computer has. In dialogues a woman's or a man's voice is chosen
 * by the speaker; when the computer has only one voice, the second speaker gets it a little higher.
 */
export async function say(text: string, lang: string, who = 0, rate = 0.9, speaker?: string): Promise<void> {
  if (await playRecording(text, lang, speaker, rate)) return;
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

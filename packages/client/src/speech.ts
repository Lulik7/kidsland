/** Reading lesson texts aloud with the browser's voices (dialogues, words, listening tasks). */

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

/**
 * Says `text` in `lang` with the best voice the computer has. `who` 1 is the second speaker of a dialogue
 * (usually the child): the same good voice, a little higher and livelier, like a child.
 */
export function say(text: string, lang: string, who = 0, rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voices = voicesOf(lang);
    if (voices.length) u.voice = voices[0];
    if (who % 2) {
      u.pitch = 1.45;
      u.rate = rate * 1.05;
    } else u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}

/** Words lesson lines look like «cat [кэт] — кошка»: only the foreign part is read aloud. */
export const foreignPart = (text: string) =>
  text
    .split('\n')
    .map((l) => l.split(' [')[0].split(' — ')[0].trim())
    .filter(Boolean);

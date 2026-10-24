/** Reading lesson texts aloud with the browser's voices (dialogues, words, listening tasks). */

function voicesOf(lang: string): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return [];
  const base = lang.split('-')[0];
  const all = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(base));
  // The exact accent first (en-GB before en-US), then the rest.
  return [...all.filter((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()), ...all.filter((v) => v.lang.replace('_', '-').toLowerCase() !== lang.toLowerCase())];
}

export const canSpeak = () => typeof speechSynthesis !== 'undefined';

/**
 * Says `text` in `lang`. `who` picks a voice: speaker 0 and 1 of a dialogue sound different
 * (another voice when the computer has one, otherwise another pitch).
 */
export function say(text: string, lang: string, who = 0, rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voices = voicesOf(lang);
    if (voices.length) u.voice = voices[who % voices.length];
    if (voices.length < 2 && who % 2) u.pitch = 1.5;
    u.rate = rate;
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

// Every line of a language course that the site reads aloud, with the speaker's gender and its recording file name.
import { COURSES } from '../packages/shared/src/index.ts';
import { GEORGIAN } from '../packages/client/src/components/interactive/geoData.ts';
import { GREEK } from '../packages/client/src/components/interactive/greekData.ts';
import { genderOf, textHash } from '../packages/client/src/voices.ts';

export function voiceLines(lang: string) {
  const foreignPart = (text: string) =>
    text
      .split('\n')
      .map((l) => l.split(' [')[0].split(' — ')[0].trim())
      .filter(Boolean);
  const out = new Map<string, { text: string; g: 'f' | 'm'; file: string }>();
  const add = (text: string, speaker?: string) => {
    const g = genderOf(speaker);
    out.set(g + text, { text, g, file: `${textHash(text)}-${g}` });
  };
  for (const c of COURSES.filter((c) => c.id.startsWith(`lang-${lang}-`)))
    for (const l of c.lessons) {
      for (const s of l.sections) {
        if (!s.speak?.startsWith(lang)) continue;
        if (s.dialog) for (const d of s.dialog) add(d.line, d.who);
        else if (s.translation) add(s.text);
        else for (const w of foreignPart(s.text)) add(w);
      }
      for (const q of [...l.practice, ...l.quiz]) if (q.audio && (q.audioLang ?? '').startsWith(lang)) add(q.audio);
    }
  // The copybook reads each Georgian letter and its word.
  if (lang === 'ka') for (const g of GEORGIAN) for (const t of [g.ch, g.word]) add(t);
  if (lang === 'el') for (const g of GREEK) for (const t of [g.name, g.word]) add(t);
  return [...out.values()];
}

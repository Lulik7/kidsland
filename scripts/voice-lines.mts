// Lists every line of a language course that the site reads aloud, with the speaker's gender,
// for scripts/record_voices.py. Usage: npx tsx scripts/voice-lines.mts fr > /tmp/fr-lines.json
import { COURSES } from '../packages/shared/src/index.ts';
import { genderOf, textHash } from '../packages/client/src/voices.ts';

const lang = process.argv[2];
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
console.log(JSON.stringify([...out.values()]));

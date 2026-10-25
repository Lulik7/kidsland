/**
 * Lesson and article texts are written in Russian. For other interface languages they are
 * machine-translated line by line into public/content/<lang>.json (see scripts/translate-content).
 */

/** Keys whose values are never translated: ids and other data. Code is translated line by line (strings and comments). */
const SKIP = new Set(['id', 'color', 'subject', 'topic', 'level', 'section', 'read', 'reading', 'speak']);
const CYRILLIC = /[а-яё]/i;
/** A word line of a language course: «hola [ола] — привет». The Cyrillic reading only helps Russian readers. */
const WORD_LINE = /^(.+?) \[[^\]]*\] — (.+)$/;

export type ContentDict = Record<string, string>;

/** The pieces of a text that go to the translator. */
export function segmentsOf(text: string): string[] {
  return text.split('\n').flatMap((line) => {
    const t = line.trim();
    if (!CYRILLIC.test(t)) return [];
    const w = WORD_LINE.exec(t);
    return [w ? w[2] : t];
  });
}

export function translateText(text: string, dict: ContentDict): string {
  if (!CYRILLIC.test(text)) return text;
  return text
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!CYRILLIC.test(t)) return line;
      const w = WORD_LINE.exec(t);
      const indent = line.slice(0, line.length - line.trimStart().length);
      return indent + (w ? `${w[1]} — ${dict[w[2]] ?? w[2]}` : (dict[t] ?? t));
    })
    .join('\n');
}

/** Every translatable string inside a course, lesson or article. */
export function collectStrings(value: unknown, out: Set<string>): Set<string> {
  if (typeof value === 'string') segmentsOf(value).forEach((s) => out.add(s));
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (!SKIP.has(k)) collectStrings(v, out);
  return out;
}

/** A copy of the object with its texts translated; ids, code and numbers stay as they are. */
export function translateDeep<T>(value: T, dict: ContentDict): T {
  if (typeof value === 'string') return translateText(value, dict) as T;
  if (Array.isArray(value)) return value.map((v) => translateDeep(v, dict)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = SKIP.has(k) ? v : translateDeep(v, dict);
    return out as T;
  }
  return value;
}

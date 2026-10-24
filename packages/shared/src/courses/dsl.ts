import type { Lesson, LessonSection, Question } from './types';

/**
 * Lessons written as plain text, so long courses stay readable:
 *
 *   # Lesson title
 *   Section title :: section text
 *   ! tip for the section above
 *   ? Question | right answer | wrong | wrong
 *
 * Every lesson needs at least three sections; questions become the lesson quiz.
 */
export function lessonsFromText(prefix: string, firstNumber: number, text: string, minutes = 10): Lesson[] {
  const lessons: Lesson[] = [];
  let cur: Lesson | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('# ')) {
      const n = firstNumber + lessons.length;
      cur = { id: `${prefix}-${n}`, title: line.slice(2).trim(), minutes, sections: [], practice: [], quiz: [] };
      lessons.push(cur);
      continue;
    }
    if (!cur) throw new Error(`Text before the first lesson in ${prefix}: ${line}`);
    if (line.startsWith('! ')) {
      const last = cur.sections[cur.sections.length - 1];
      if (!last) throw new Error(`Tip without a section in ${cur.id}`);
      last.tip = line.slice(2).trim();
    } else if (line.startsWith('? ')) {
      const [prompt, right, ...wrong] = line.slice(2).split('|').map((s) => s.trim());
      const at = (lessons.length + cur.quiz.length) % (wrong.length + 1);
      const options = [...wrong];
      options.splice(at, 0, right);
      const q: Question = { id: `${cur.id}-q${cur.quiz.length + 1}`, kind: 'single', prompt, options, answer: at };
      cur.quiz.push(q);
    } else {
      const i = line.indexOf('::');
      const section: LessonSection = i < 0 ? { text: line } : { title: line.slice(0, i).trim(), text: line.slice(i + 2).trim() };
      cur.sections.push(section);
    }
  }
  return lessons;
}

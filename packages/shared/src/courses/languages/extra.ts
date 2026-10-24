import type { DialogLine, LessonSection, Question } from '../types';

/**
 * The full lesson format for a language: grammar, four dialogues, a reading text and practice tasks.
 * Written as text, one block per plan lesson:
 *
 * ```
 * ## 1
 * G Глагол to be :: I am, you are...            grammar card: title :: rule
 * D Tom/Ann                                      a dialogue between two people, lines follow
 * Hi! I'm Tom. = Привет! Я Том.
 * Hello! = Здравствуй!
 * T                                              the reading text, sentences follow
 * My name is Tom. = Меня зовут Том.
 * R Сколько лет Тому? | seven | six              reading question, the right answer first
 * Q I ___ a boy. | am | is | are                 grammar question, the right answer first
 * W I am a boy.                                  put the words in order
 * P cat | cut | cap                              listen and choose, the spoken word first
 * S Напиши по-английски «кошка» | cat            write the answer, several right answers by «,»
 * ```
 */
export interface LessonExtra {
  grammar?: { title: string; text: string };
  dialogs: { a: string; b: string; lines: DialogLine[] }[];
  text: { line: string; tr: string; read?: string }[];
  practice: Question[];
}

/** Puts the right answer at a position that changes from question to question. */
function placed(right: string, wrong: string[], seed: number): { options: string[]; answer: number } {
  const options = [...wrong];
  const at = seed % (wrong.length + 1);
  options.splice(at, 0, right);
  return { options, answer: at };
}

/** «line = translation», or «line [reading] = translation» for languages with their own script. */
const pair = (raw: string, where: string) => {
  const i = raw.indexOf(' = ');
  if (i < 0) throw new Error(`No « = » translation in «${raw}» (${where})`);
  const left = raw.slice(0, i).trim();
  const tr = raw.slice(i + 3).trim();
  const m = /^(.*?)\s*\[([^\]]+)\]$/.exec(left);
  return m ? { line: m[1], tr, read: m[2] } : { line: left, tr };
};

export function parseExtra(text: string, lessonIds: string[], speak: string): Map<number, LessonExtra> {
  const out = new Map<number, LessonExtra>();
  const blocks = text.split(/^## /m).slice(1);
  for (const block of blocks) {
    const [head, ...rows] = block.split('\n');
    const n = Number(head.trim()) - 1;
    const id = lessonIds[n];
    if (!id) throw new Error(`Lesson ${head.trim()} is outside the plan`);
    const extra: LessonExtra = { dialogs: [], text: [], practice: [] };
    let mode: 'dialog' | 'text' | null = null;
    let q = 0;
    const qid = () => `${id}-x${++q}`;
    for (const raw of rows) {
      const row = raw.trim();
      if (!row) continue;
      const where = `${id}: ${row.slice(0, 40)}`;
      const tag = row.split(' ')[0];
      const rest = row.slice(tag.length).trim();
      const parts = rest.split('|').map((p) => p.trim());
      switch (tag) {
        case 'G': {
          const [title, rule] = rest.split('::').map((p) => p.trim());
          if (!rule) throw new Error(`Grammar needs «title :: rule» (${where})`);
          extra.grammar = { title, text: rule };
          mode = null;
          break;
        }
        case 'D': {
          const [a, b] = rest.split('/').map((p) => p.trim());
          extra.dialogs.push({ a, b, lines: [] });
          mode = 'dialog';
          break;
        }
        case 'T':
          mode = 'text';
          break;
        case 'R':
        case 'Q':
        case 'P': {
          if (parts.length < 3) throw new Error(`Needs a prompt and at least two answers (${where})`);
          if (tag === 'P') {
            const [right, ...wrong] = parts;
            const { options, answer } = placed(right, wrong, n + q);
            extra.practice.push({ id: qid(), kind: 'single', prompt: 'Послушай и выбери, что прозвучало.', options, answer, audio: right, audioLang: speak });
          } else {
            const [prompt, right, ...wrong] = parts;
            const { options, answer } = placed(right, wrong, n + q);
            extra.practice.push({ id: qid(), kind: 'single', prompt, options, answer });
          }
          mode = null;
          break;
        }
        case 'W': {
          const items = rest.split(/\s+/);
          if (new Set(items).size !== items.length) throw new Error(`Words repeat in «${rest}» (${where})`);
          extra.practice.push({ id: qid(), kind: 'order', prompt: 'Составь предложение из слов.', items, audio: rest, audioLang: speak });
          mode = null;
          break;
        }
        case 'S': {
          const [prompt, answers] = parts;
          if (!answers) throw new Error(`Needs «prompt | answer» (${where})`);
          extra.practice.push({ id: qid(), kind: 'text', prompt, answer: answers.split(',').map((a) => a.trim()) });
          mode = null;
          break;
        }
        default:
          if (mode === 'dialog') {
            const d = extra.dialogs[extra.dialogs.length - 1];
            const { line, tr } = pair(row, where);
            d.lines.push({ who: d.lines.length % 2 ? d.b : d.a, line, tr });
          } else if (mode === 'text') {
            extra.text.push(pair(row, where));
          } else {
            throw new Error(`Unknown line (${where})`);
          }
      }
    }
    out.set(n, extra);
  }
  return out;
}

/** Lesson sections made from the extra block. */
export function extraSections(extra: LessonExtra, speak: string): { before: LessonSection[]; after: LessonSection[] } {
  const before: LessonSection[] = [];
  if (extra.grammar) before.push({ title: `Грамматика: ${extra.grammar.title}`, text: extra.grammar.text });
  extra.dialogs.forEach((d, i) =>
    before.push({ title: `Диалог ${i + 1}`, text: '', dialog: d.lines, speak }),
  );
  const after: LessonSection[] = [];
  if (extra.text.length)
    after.push({
      title: 'Текст для чтения',
      text: extra.text.map((t) => t.line).join(' '),
      translation: extra.text.map((t) => t.tr).join(' '),
      ...(extra.text.some((t) => t.read) ? { reading: extra.text.map((t) => t.read ?? '').join(' ') } : {}),
      speak,
    });
  return { before, after };
}

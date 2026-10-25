import type { Course, Question } from './courses/types';

/** Bonuses for each homework answer that is right the first time; see BONUS_FOR_DISCOUNT in billing.ts. */
export const BONUS_PER_ANSWER = 5;
export const HOMEWORK_SIZE = 5;

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

/** Shuffles a list with a fixed seed and returns the new order as indexes into the old list. */
function order(n: number, seed: string): number[] {
  let h = hash(seed);
  const out = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The same question with its options in another order, so homework is not a copy of the quiz. */
function reshuffle(q: Question, id: string): Question {
  if (q.kind !== 'single' && q.kind !== 'multi') return { ...q, id };
  const idx = order(q.options.length, id);
  const options = idx.map((i) => q.options[i]);
  if (q.kind === 'single') return { ...q, id, options, answer: idx.indexOf(q.answer) };
  return { ...q, id, options, answer: q.answer.map((a) => idx.indexOf(a)).sort((a, b) => a - b) };
}

/**
 * Homework after a lesson: questions about this lesson and the few before it, mixed and with shuffled
 * options. It is built the same way from a translated course, so the questions line up by position.
 * Lessons without any questions in or before them get no homework.
 */
export function homeworkFor(course: Course, index: number): Question[] {
  const lesson = course.lessons[index];
  if (!lesson) return [];
  const pool: { q: Question; key: string }[] = [];
  for (let i = index; i >= Math.max(0, index - 4); i--) {
    const l = course.lessons[i];
    for (const q of [...l.practice, ...l.quiz]) pool.push({ q, key: `${l.id}:${q.id}` });
  }
  if (!pool.length) return [];
  // Questions from this lesson go first in the pool; take two of them, then fill from the review.
  const own = lesson.practice.length + lesson.quiz.length;
  const ownOrder = order(own, `${lesson.id}:own`);
  const rest = order(pool.length - own, `${lesson.id}:rest`).map((i) => i + own);
  const picked = [...ownOrder.slice(0, 2), ...rest, ...ownOrder.slice(2)].slice(0, HOMEWORK_SIZE);
  return order(picked.length, `${lesson.id}:mix`).map((i, n) => reshuffle(pool[picked[i]].q, `hw${n + 1}`));
}

import { describe, expect, it } from 'vitest';
import { COURSES, SUBJECT_IDS, checkAnswer, findLesson, gradeLesson } from '../index';

describe('courses', () => {
  it('has unique ids and three levels per subject', () => {
    const ids = new Set<string>();
    for (const c of COURSES) {
      for (const id of [c.id, ...c.lessons.flatMap((l) => [l.id, ...l.practice.map((q) => q.id), ...l.quiz.map((q) => q.id)])]) {
        expect(ids.has(id), id).toBe(false);
        ids.add(id);
      }
    }
    for (const s of SUBJECT_IDS) {
      expect(COURSES.filter((c) => c.subject === s).map((c) => c.level).sort()).toEqual(['advanced', 'beginner', 'intermediate']);
    }
  });

  it('has valid answer indexes', () => {
    for (const c of COURSES)
      for (const l of c.lessons)
        for (const q of [...l.practice, ...l.quiz]) {
          if (q.kind === 'single') expect(q.answer, q.id).toBeLessThan(q.options.length);
          if (q.kind === 'multi') q.answer.forEach((a) => expect(a, q.id).toBeLessThan(q.options.length));
          if (q.kind === 'order') expect(new Set(q.items).size, q.id).toBe(q.items.length);
        }
  });

  it('grades every kind of question', () => {
    const { lesson } = findLesson('scratch-1')!;
    const [order, text] = lesson.practice;
    expect(checkAnswer(order, order.kind === 'order' ? order.items : [])).toBe(true);
    expect(checkAnswer(order, order.kind === 'order' ? [...order.items].reverse() : [])).toBe(false);
    expect(checkAnswer(text, '  Спрайты ')).toBe(true);
    expect(checkAnswer(text, 'коты')).toBe(false);
    const multi = findLesson('scratch-4')!.lesson.quiz[0];
    expect(checkAnswer(multi, [3, 1, 0])).toBe(true);
    expect(checkAnswer(multi, [0, 1])).toBe(false);

    const perfect: Record<string, unknown> = {};
    for (const q of [...lesson.practice, ...lesson.quiz]) {
      perfect[q.id] = q.kind === 'order' ? q.items : q.answer instanceof Array && q.kind === 'text' ? q.answer[0] : q.answer;
    }
    const g = gradeLesson(lesson, perfect as never);
    expect(g).toMatchObject({ score: g.max, passed: true });
    expect(gradeLesson(lesson, {}).passed).toBe(false);
  });
});

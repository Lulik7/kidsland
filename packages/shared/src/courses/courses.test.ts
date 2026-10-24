import { describe, expect, it } from 'vitest';
import { ARTICLES, COURSES, SECTIONS, SUBJECTS, TOPIC_IDS, checkAnswer, findLesson, gradeLesson } from '../index';

describe('courses', () => {
  it('has unique ids and three levels per subject', () => {
    const ids = new Set<string>();
    for (const c of COURSES) {
      for (const id of [c.id, ...c.lessons.flatMap((l) => [l.id, ...l.practice.map((q) => q.id), ...l.quiz.map((q) => q.id)])]) {
        expect(ids.has(id), id).toBe(false);
        ids.add(id);
      }
    }
    for (const s of SUBJECTS.filter((x) => x.section === 'coding')) {
      expect(COURSES.filter((c) => c.subject === s.id).map((c) => c.level).sort()).toEqual(['advanced', 'beginner', 'intermediate']);
    }
    for (const s of SUBJECTS) expect(COURSES.some((c) => c.subject === s.id), s.id).toBe(true);
    for (const c of COURSES) if (c.topic) expect(TOPIC_IDS).toContain(c.topic);
  });

  it('has three levels with at least 20 lessons in every course section', () => {
    // Languages are being filled language by language.
    for (const sec of SECTIONS.filter((x) => !x.articlesOnly && x.id !== 'languages')) {
      const courses = COURSES.filter((c) => SUBJECTS.find((s) => s.id === c.subject)?.section === sec.id);
      for (const level of ['beginner', 'intermediate', 'advanced']) {
        const n = courses.filter((c) => c.level === level).reduce((k, c) => k + c.lessons.length, 0);
        expect(n, `${sec.id} ${level}`).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('has articles for every topic of article-only sections', () => {
    for (const s of SECTIONS.filter((x) => x.articlesOnly)) {
      expect(TOPIC_IDS.some((id) => s.topics.some((t) => t.id === id)), s.id).toBe(false);
      for (const t of s.topics) expect(ARTICLES.some((a) => a.section === s.id && a.topic === t.id), t.id).toBe(true);
    }
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length);
  });

  it('has valid answer indexes', () => {
    for (const c of COURSES)
      for (const l of c.lessons)
        for (const q of [...l.practice, ...l.quiz]) {
          if (q.kind === 'single') expect(q.answer, q.id).toBeLessThan(q.options.length);
          if (q.kind === 'multi') {
            q.answer.forEach((a) => expect(a, q.id).toBeLessThan(q.options.length));
            expect(new Set(q.options).size, q.id).toBe(q.options.length);
          }
          if (q.kind === 'single') expect(new Set(q.options).size, q.id).toBe(q.options.length);
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

describe('theory', () => {
  it('has at least three theory sections in every lesson', async () => {
    const { EXTRA_THEORY } = await import('./extraTheory');
    for (const id of Object.keys(EXTRA_THEORY)) expect(findLesson(id), id).toBeDefined();
    for (const c of COURSES) for (const l of c.lessons) expect(l.sections.length, l.id).toBeGreaterThanOrEqual(3);
  });
});

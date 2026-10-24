import type { SubjectId } from '../marketplace';
import type { Answer, Answers, Course, CourseLevel, Lesson, Question } from './types';
import { scratchCourse } from './scratch';
import { scratchMidCourse, scratchProCourse } from './scratchMore';
import { pythonCourse } from './python';
import { pythonMidCourse, pythonProCourse } from './pythonMore';
import { webCourse } from './web';
import { webMidCourse, webProCourse } from './webMore';
import { gamesCourse } from './games';
import { gamesMidCourse, gamesProCourse } from './gamesMore';
import { logicCourse } from './logic';
import { logicMidCourse, logicProCourse } from './logicMore';
import { computerCourse, computerMidCourse, computerProCourse } from './computer';
import { robloxCourse, robloxMidCourse, robloxProCourse } from './roblox';
import { unityCourse, unityMidCourse, unityProCourse } from './unity';
import { EXTRA_THEORY } from './extraTheory';
import { MORE_CODING_LESSONS } from './codingMore';
import { MUSIC_COURSES } from './music';
import { INTRO_COURSES } from './intro';
import { SCIENCE_COURSES, SCIENCE_MORE } from './science';
import { CHESS_COURSES, CHESS_MORE } from './chess';
import { ART_COURSES, ART_MORE } from './art';
import { LEISURE_COURSES, LEISURE_MORE } from './leisure';
import { ANIMALS_COURSES, ANIMALS_MORE } from './animals';
import { MUSIC_LEVEL_COURSES } from './musicLevels';
import { PYTHON_PRO_MORE } from './pythonExtra';
import { LANGUAGE_COURSES } from './languages';

/** Extra lessons for the short intro courses, keyed by course id. */
const MORE_LESSONS: Record<string, Lesson[]> = { 'python-pro': PYTHON_PRO_MORE, ...SCIENCE_MORE, ...CHESS_MORE, ...ART_MORE, ...LEISURE_MORE, ...ANIMALS_MORE };
const EXTRA_COURSES: Course[] = [...SCIENCE_COURSES, ...CHESS_COURSES, ...ART_COURSES, ...LEISURE_COURSES, ...ANIMALS_COURSES, ...MUSIC_LEVEL_COURSES, ...LANGUAGE_COURSES];

export * from './types';

export const COURSE_LEVELS: { id: CourseLevel; name: string }[] = [
  { id: 'beginner', name: 'Начальный' },
  { id: 'intermediate', name: 'Средний' },
  { id: 'advanced', name: 'Продвинутый' },
];

const withExtraTheory = (c: Course): Course => ({
  ...c,
  lessons: [...c.lessons, ...(MORE_CODING_LESSONS[c.id] ? [MORE_CODING_LESSONS[c.id]] : [])].map((l) => ({
    ...l,
    sections: [...l.sections, ...(EXTRA_THEORY[l.id] ?? [])],
  })),
});

export const COURSES: Course[] = [
  computerCourse, computerMidCourse, computerProCourse,
  scratchCourse, scratchMidCourse, scratchProCourse,
  robloxCourse, robloxMidCourse, robloxProCourse,
  pythonCourse, pythonMidCourse, pythonProCourse,
  webCourse, webMidCourse, webProCourse,
  gamesCourse, gamesMidCourse, gamesProCourse,
  unityCourse, unityMidCourse, unityProCourse,
  logicCourse, logicMidCourse, logicProCourse,
]
  .map(withExtraTheory)
  .concat(MUSIC_COURSES, INTRO_COURSES, EXTRA_COURSES)
  .map((c) => (MORE_LESSONS[c.id] ? { ...c, lessons: [...c.lessons, ...MORE_LESSONS[c.id]] } : c));

/** Share of points needed to pass a lesson. */
export const LESSON_PASS_RATIO = 0.6;
export const LESSON_REWARD = { xp: 15, coins: 10 };

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function coursesBySubject(subject: SubjectId): Course[] {
  return COURSES.filter((c) => c.subject === subject);
}

export function findLesson(lessonId: string): { course: Course; lesson: Lesson; index: number } | undefined {
  for (const course of COURSES) {
    const index = course.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) return { course, lesson: course.lessons[index], index };
  }
  return undefined;
}

export function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}

export function checkAnswer(q: Question, a: Answer | undefined): boolean {
  if (a === undefined) return false;
  switch (q.kind) {
    case 'single':
      return a === q.answer;
    case 'multi': {
      if (!Array.isArray(a)) return false;
      const got = [...new Set(a as number[])].sort();
      const want = [...q.answer].sort();
      return got.length === want.length && got.every((v, i) => v === want[i]);
    }
    case 'text':
      return typeof a === 'string' && q.answer.some((ok) => normalizeText(ok) === normalizeText(a));
    case 'order':
      return Array.isArray(a) && a.length === q.items.length && a.every((v, i) => v === q.items[i]);
  }
}

export interface LessonGrade {
  score: number;
  max: number;
  passed: boolean;
  results: Record<string, boolean>;
}

export type LessonPart = 'practice' | 'quiz';

export function gradeQuestions(questions: Question[], answers: Answers): LessonGrade {
  const results: Record<string, boolean> = {};
  let score = 0;
  for (const q of questions) {
    const ok = checkAnswer(q, answers[q.id]);
    results[q.id] = ok;
    if (ok) score++;
  }
  const max = questions.length;
  return { score, max, passed: score >= Math.ceil(max * LESSON_PASS_RATIO), results };
}

/** Grades one part of a lesson (tasks or quiz), or the whole lesson when no part is given. */
export function gradeLesson(lesson: Lesson, answers: Answers, part?: LessonPart): LessonGrade {
  return gradeQuestions(part ? lesson[part] : [...lesson.practice, ...lesson.quiz], answers);
}

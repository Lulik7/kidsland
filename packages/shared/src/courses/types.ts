import type { SubjectId } from '../marketplace';

interface QuestionBase {
  id: string;
  prompt: string;
  /** Optional code shown under the prompt. */
  code?: string;
  /** Shown after answering, right or wrong. */
  explain?: string;
}

export type Question =
  | (QuestionBase & { kind: 'single'; options: string[]; answer: number })
  | (QuestionBase & { kind: 'multi'; options: string[]; answer: number[] })
  /** Free text; any of `answer` is accepted after trimming, lower-casing and collapsing spaces. */
  | (QuestionBase & { kind: 'text'; answer: string[]; placeholder?: string })
  /** `items` are listed in the correct order; the page shuffles them. */
  | (QuestionBase & { kind: 'order'; items: string[] });

export type Answer = number | number[] | string | string[];
export type Answers = Record<string, Answer>;

export interface LessonSection {
  title?: string;
  text: string;
  code?: string;
  tip?: string;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  sections: LessonSection[];
  /** Hands-on tasks: ordering code, typing answers. */
  practice: Question[];
  /** Quick check of the theory. */
  quiz: Question[];
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  id: string;
  subject: SubjectId;
  /** For sections with many topics (like music), the topic this course belongs to. */
  topic?: string;
  level: CourseLevel;
  title: string;
  tagline: string;
  description: string;
  ageMin: number;
  ageMax: number;
  color: string;
  lessons: Lesson[];
  faq: { q: string; a: string }[];
}

export const SUBJECTS = [
  { id: 'scratch', name: 'Scratch' },
  { id: 'python', name: 'Python' },
  { id: 'web', name: 'Сайты (HTML, CSS, JS)' },
  { id: 'games', name: 'Создание игр' },
  { id: 'logic', name: 'Логика и алгоритмы' },
] as const;

export const LANGUAGES = [
  { id: 'ru', name: 'Русский' },
  { id: 'en', name: 'English' },
  { id: 'kk', name: 'Қазақша' },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]['id'];
export type LanguageId = (typeof LANGUAGES)[number]['id'];

export const SUBJECT_IDS = SUBJECTS.map((s) => s.id) as SubjectId[];
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as LanguageId[];

export type BookingStatus = 'scheduled' | 'completed' | 'cancelled';

/** Free levels are the "base course"; finishing them triggers the free-lesson invitation. */
export const TRIAL_LESSON_PRICE = 0;

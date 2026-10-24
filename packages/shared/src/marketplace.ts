export const SUBJECTS = [
  { id: 'computer', name: 'Компьютерная грамотность' },
  { id: 'scratch', name: 'Scratch' },
  { id: 'roblox', name: 'Roblox' },
  { id: 'python', name: 'Python' },
  { id: 'web', name: 'Web-программирование' },
  { id: 'games', name: 'Создание игр' },
  { id: 'unity', name: 'C# | Unity' },
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

/** Catalogue card facts for each subject: from what age, which school grades, what the child learns. */
export const SUBJECT_INFO: Record<SubjectId, { ageFrom: number; grades: string; points: string[] }> = {
  computer: { ageFrom: 7, grades: '1–6 класс', points: ['Используем компьютер для учёбы', 'Осваиваем программы и сервисы', 'Учимся безопасной работе онлайн'] },
  scratch: { ageFrom: 6, grades: '1–4 класс', points: ['Собираем программы из блоков', 'Делаем мультфильмы и игры', 'Учимся мыслить алгоритмами'] },
  roblox: { ageFrom: 7, grades: '1–7 класс', points: ['Учим программировать на языке Lua', 'Осваиваем 3D и дизайн', 'Создаём свои игры'] },
  python: { ageFrom: 9, grades: '3–9 класс', points: ['Учим кодить с нуля', 'Создаём игры и рисунки', 'Пишем настоящие программы'] },
  web: { ageFrom: 8, grades: '2–11 класс', points: ['Учим создавать сайты и приложения', 'Осваиваем HTML, CSS и JavaScript', 'Собираем портфолио проектов'] },
  games: { ageFrom: 8, grades: '2–8 класс', points: ['Придумываем правила и уровни', 'Разбираем физику и врагов', 'Учимся делать игры интересными'] },
  unity: { ageFrom: 10, grades: '5–11 класс', points: ['Учим делать игры в Unity', 'Создаём проекты в 2D и 3D', 'Пишем код на C#'] },
  logic: { ageFrom: 7, grades: '1–8 класс', points: ['Решаем головоломки', 'Учим циклы, условия и перебор', 'Готовимся к олимпиадам'] },
};

export type BookingStatus = 'scheduled' | 'completed' | 'cancelled';

/** Free levels are the "base course"; finishing them triggers the free-lesson invitation. */
export const TRIAL_LESSON_PRICE = 0;

/** Reasons offered when a lesson is cancelled. The other side sees the reason and the optional note. */
export const CANCEL_REASONS = {
  parent: [
    { id: 'sick', label: 'Ребёнок заболел' },
    { id: 'time', label: 'Не успеваем в это время' },
    { id: 'plans', label: 'Изменились планы' },
    { id: 'tech', label: 'Технические проблемы' },
    { id: 'tutor', label: 'Хотим другого наставника' },
    { id: 'other', label: 'Другая причина' },
  ],
  tutor: [
    { id: 'sick', label: 'Наставник заболел' },
    { id: 'urgent', label: 'Срочные дела' },
    { id: 'tech', label: 'Технические проблемы' },
    { id: 'reschedule', label: 'Предлагаю перенести на другое время' },
    { id: 'other', label: 'Другая причина' },
  ],
} as const;
export type CancelSide = keyof typeof CANCEL_REASONS;

export function cancelReasonLabel(side: CancelSide, id: string): string {
  return (CANCEL_REASONS[side] as readonly { id: string; label: string }[]).find((r) => r.id === id)?.label ?? 'Другая причина';
}

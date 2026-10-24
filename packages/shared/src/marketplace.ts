/** Course tracks. Coding tracks have three levels; the other sections start with intro courses. */
export const SUBJECTS = [
  { id: 'computer', name: 'Компьютерная грамотность', section: 'coding' },
  { id: 'scratch', name: 'Scratch', section: 'coding' },
  { id: 'roblox', name: 'Roblox', section: 'coding' },
  { id: 'python', name: 'Python', section: 'coding' },
  { id: 'web', name: 'Web-программирование', section: 'coding' },
  { id: 'games', name: 'Создание игр', section: 'coding' },
  { id: 'unity', name: 'C# | Unity', section: 'coding' },
  { id: 'logic', name: 'Логика и алгоритмы', section: 'coding' },
  { id: 'music', name: 'Музыка', section: 'music' },
  { id: 'art', name: 'Рисование', section: 'art' },
  { id: 'leisure', name: 'Досуг и рукоделие', section: 'leisure' },
  { id: 'languages', name: 'Иностранные языки', section: 'languages' },
  { id: 'animals', name: 'Животные', section: 'animals' },
  { id: 'spirit', name: 'Духовное развитие', section: 'spirit' },
] as const;

export const LANGUAGES = [
  { id: 'ru', name: 'Русский' },
  { id: 'en', name: 'English' },
  { id: 'kk', name: 'Қазақша' },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]['id'];
export type LanguageId = (typeof LANGUAGES)[number]['id'];

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
  music: { ageFrom: 5, grades: '1–11 класс', points: ['Девять инструментов и вокал', 'Учим ноты, ритм и первые мелодии', 'Играем любимые песни'] },
  art: { ageFrom: 5, grades: '1–9 класс', points: ['Рисуем карандашом и красками', 'Учимся цвету и композиции', 'Придумываем своих персонажей'] },
  leisure: { ageFrom: 6, grades: '1–9 класс', points: ['Собираем гербарий и лепим', 'Плетём макраме и вяжем узлы', 'Делаем поделки своими руками'] },
  languages: { ageFrom: 5, grades: '1–11 класс', points: ['11 языков от английского до иврита', 'Первые слова и фразы', 'Учимся говорить без страха'] },
  animals: { ageFrom: 6, grades: '1–9 класс', points: ['Как ухаживать за питомцем', 'Дрессировка собак добрым способом', 'Понимаем язык животных'] },
  spirit: { ageFrom: 6, grades: '1–9 класс', points: ['Понимаем свои чувства', 'Учимся доброте и дружбе', 'Находим спокойствие и благодарность'] },
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

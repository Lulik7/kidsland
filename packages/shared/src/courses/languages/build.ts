import type { Course, CourseLevel, Lesson, Question } from '../types';
import { PLAN } from './curriculum';

/**
 * A foreign language filled into the common plan. `lines` has one line per plan lesson (60):
 * five words and the phrase of the lesson, separated by «;», each with its reading in square
 * brackets, for example `cat [кэт]`. `notes` adds a language-specific section to a lesson (0-based).
 */
export interface LanguageData {
  topic: string;
  /** «Английский» */
  name: string;
  /** «по-английски» */
  inName: string;
  color: string;
  lines: string[];
  notes?: Record<number, string>;
}

interface Item {
  word: string;
  reading: string;
}

function parseItem(raw: string, where: string): Item {
  const m = raw.trim().match(/^(.+?)\s*\[(.+)\]$/);
  if (!m) throw new Error(`No reading in brackets: «${raw}» (${where})`);
  return { word: m[1].trim(), reading: m[2].trim() };
}

const LEVELS: { level: CourseLevel; suffix: string; tagline: string; ages: [number, number] }[] = [
  { level: 'beginner', suffix: 'первые шаги', tagline: 'Приветствия, числа, цвета, семья и животные', ages: [6, 11] },
  { level: 'intermediate', suffix: 'говорим о жизни', tagline: 'Время, хобби, магазин, кафе и вопросы', ages: [8, 13] },
  { level: 'advanced', suffix: 'свободное общение', tagline: 'Путешествия, мнение, рассказы и письма', ages: [10, 14] },
];

/** Puts the right answer at a position that changes from question to question. */
function single(id: string, prompt: string, right: string, wrong: string[], seed: number): Question {
  const options = [...wrong];
  const at = seed % (wrong.length + 1);
  options.splice(at, 0, right);
  return { id, kind: 'single', prompt, options, answer: at };
}

export function languageCourses(lang: LanguageData): Course[] {
  if (lang.lines.length !== PLAN.length) throw new Error(`${lang.topic}: ${lang.lines.length} lines, expected ${PLAN.length}`);
  const parsed = lang.lines.map((line, i) => {
    const parts = line.split(';').map((p) => p.trim()).filter(Boolean);
    if (parts.length !== 6) throw new Error(`${lang.topic} line ${i + 1}: ${parts.length} items, expected 6`);
    return parts.map((p) => parseItem(p, `${lang.topic} line ${i + 1}`));
  });

  return LEVELS.map(({ level, suffix, tagline, ages }, li) => {
    const id = `${lang.topic}-${li + 1}`;
    const lessons: Lesson[] = PLAN.slice(li * 20, li * 20 + 20).map((plan, k) => {
      const n = li * 20 + k;
      const items = parsed[n];
      const words = items.slice(0, 5);
      const phrase = items[5];
      const lessonId = `${id}-${k + 1}`;
      const sections = [
        { title: 'Новые слова', text: words.map((w, j) => `${w.word} [${w.reading}] — ${plan.words[j]}`).join('\n') },
        { title: 'Фраза урока', text: `${phrase.word} [${phrase.reading}] — ${plan.phrase}` },
        { title: 'Как запомнить', text: plan.tip },
      ];
      if (lang.notes?.[n]) sections.splice(2, 0, { title: 'Это интересно', text: lang.notes[n] });
      const a = n % 5;
      const b = (n + 2) % 5;
      const other = (m: number) => parsed[(n + m) % parsed.length][5].word;
      const quiz: Question[] = [
        single(`${lessonId}-q1`, `Как ${lang.inName} «${plan.words[a]}»?`, words[a].word, [words[(a + 1) % 5].word, words[(a + 3) % 5].word], n),
        single(`${lessonId}-q2`, `Что значит «${words[b].word}»?`, plan.words[b], [plan.words[(b + 1) % 5], plan.words[(b + 4) % 5]], n + 1),
        single(`${lessonId}-q3`, `Как ${lang.inName} «${plan.phrase}»?`, phrase.word, [other(1), other(7)], n + 2),
      ];
      return { id: lessonId, title: plan.title, minutes: 10, sections, practice: [], quiz };
    });
    return {
      id,
      subject: 'languages',
      topic: lang.topic,
      level,
      title: `${lang.name}: ${suffix}`,
      tagline,
      description: `${lang.name} язык для детей: в каждом уроке пять новых слов с подсказкой, как их читать, фраза урока и короткая викторина.`,
      ageMin: ages[0],
      ageMax: ages[1],
      color: lang.color,
      lessons,
      faq: [
        { q: 'Нужно ли знать язык заранее?', a: li === 0 ? 'Нет, курс начинается с первых слов.' : 'Лучше сначала пройти предыдущий уровень этого языка.' },
        { q: 'Можно ли заниматься с наставником?', a: 'Да. В разделе «Иностранные языки» есть наставники, первый урок бесплатный.' },
      ],
    } satisfies Course;
  });
}

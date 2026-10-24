import { SUBJECTS } from './marketplace';

export interface Topic {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  topics: Topic[];
  /** No tutors or courses here, only articles to read. */
  articlesOnly?: boolean;
}

/**
 * The big areas of Kidsland. Each topic is something a tutor can teach; tutors are filtered by topic,
 * and a section shows every tutor whose topics fall into it.
 */
export const SECTIONS: Section[] = [
  {
    id: 'coding',
    name: 'Программирование',
    tagline: 'Игры, сайты и первые программы',
    description: 'От блоков Scratch до настоящего кода на Python, C# и JavaScript. Ребёнок делает свои игры, сайты и проекты.',
    color: '#6c4cff',
    topics: SUBJECTS.filter((s) => s.section === 'coding').map((s) => ({ id: s.id, name: s.name })),
  },
  {
    id: 'science',
    name: 'Наука и опыты',
    tagline: 'Космос, физика, опыты и фокусы',
    description: 'Изучаем звёзды и планеты, узнаём, как устроен мир вокруг, ставим безопасные опыты из того, что есть дома, и учимся показывать фокусы.',
    color: '#0fa3b1',
    topics: [
      { id: 'astronomy', name: 'Астрономия' },
      { id: 'physics', name: 'Физика' },
      { id: 'experiments', name: 'Опыты и эксперименты' },
      { id: 'magic', name: 'Фокусы' },
    ],
  },
  {
    id: 'chess',
    name: 'Шахматы',
    tagline: 'Фигуры, тактика и первые победы',
    description: 'Учимся ходить фигурами, ставить мат, решать задачи и думать на несколько ходов вперёд.',
    color: '#5b5f73',
    topics: [
      { id: 'chess-basics', name: 'Шахматы с нуля' },
      { id: 'chess-tactics', name: 'Тактика и задачи' },
      { id: 'chess-openings', name: 'Дебюты и планы' },
      { id: 'chess-tournaments', name: 'Подготовка к турнирам' },
    ],
  },
  {
    id: 'music',
    name: 'Музыка',
    tagline: 'Инструменты и вокал',
    description: 'Учимся играть на инструменте или петь: ноты, ритм, первые мелодии и любимые песни.',
    color: '#ff5a8a',
    topics: [
      { id: 'guitar', name: 'Гитара' },
      { id: 'piano', name: 'Фортепиано' },
      { id: 'violin', name: 'Скрипка' },
      { id: 'drums', name: 'Барабаны' },
      { id: 'flute', name: 'Флейта' },
      { id: 'saxophone', name: 'Саксофон' },
      { id: 'ukulele', name: 'Укулеле' },
      { id: 'accordion', name: 'Аккордеон' },
      { id: 'cello', name: 'Виолончель' },
      { id: 'vocal', name: 'Вокал' },
    ],
  },
  {
    id: 'art',
    name: 'Рисование',
    tagline: 'Карандаш, краски и свои персонажи',
    description: 'Рисуем карандашом, акварелью и гуашью, учимся видеть форму и цвет, придумываем героев и комиксы.',
    color: '#ff9a1f',
    topics: [
      { id: 'pencil', name: 'Рисунок карандашом' },
      { id: 'watercolor', name: 'Акварель' },
      { id: 'gouache', name: 'Гуашь и акрил' },
      { id: 'sketching', name: 'Скетчинг' },
      { id: 'digital-art', name: 'Цифровое рисование' },
      { id: 'comics', name: 'Комиксы и персонажи' },
    ],
  },
  {
    id: 'leisure',
    name: 'Досуг',
    tagline: 'Рукоделие, кухня и шитьё',
    description: 'Занятия руками, которые успокаивают и развивают: гербарий, лепка, макраме, узлы, вязание, шитьё, кулинария и поделки.',
    color: '#2fb59a',
    topics: [
      { id: 'herbarium', name: 'Гербарий' },
      { id: 'modeling', name: 'Лепка' },
      { id: 'macrame', name: 'Макраме' },
      { id: 'knots', name: 'Узлы' },
      { id: 'crochet', name: 'Вязание крючком' },
      { id: 'knitting', name: 'Вязание спицами' },
      { id: 'crafts', name: 'Поделки' },
      { id: 'cooking', name: 'Кулинария' },
      { id: 'sewing', name: 'Шитьё' },
    ],
  },
  {
    id: 'languages',
    name: 'Иностранные языки',
    tagline: '11 языков мира',
    description: 'Первые слова, фразы и разговор с носителями: от английского и китайского до грузинского и иврита.',
    color: '#3b8cff',
    topics: [
      { id: 'lang-ru', name: 'Русский' },
      { id: 'lang-en', name: 'Английский' },
      { id: 'lang-fr', name: 'Французский' },
      { id: 'lang-de', name: 'Немецкий' },
      { id: 'lang-it', name: 'Итальянский' },
      { id: 'lang-es', name: 'Испанский' },
      { id: 'lang-ja', name: 'Японский' },
      { id: 'lang-zh', name: 'Китайский' },
      { id: 'lang-el', name: 'Греческий' },
      { id: 'lang-ka', name: 'Грузинский' },
      { id: 'lang-he', name: 'Иврит' },
    ],
  },
  {
    id: 'animals',
    name: 'Животные',
    tagline: 'Уход, дрессировка и дружба',
    description: 'Как заботиться о питомце, понимать его поведение и дрессировать собаку добрыми методами.',
    color: '#a0703c',
    topics: [
      { id: 'dogs', name: 'Собаки' },
      { id: 'cats', name: 'Кошки' },
      { id: 'fish', name: 'Рыбки' },
      { id: 'birds', name: 'Птицы' },
      { id: 'turtles', name: 'Черепахи' },
      { id: 'pets', name: 'Домашние животные' },
      { id: 'dog-training', name: 'Дрессировка собак' },
      { id: 'pet-care', name: 'Уход за животными' },
    ],
  },
  {
    id: 'spirit',
    name: 'Духовное развитие',
    tagline: 'Чувства, доброта и спокойствие',
    description: 'Учимся понимать себя и других: эмоции, дружба, благодарность, спокойствие, детская йога и семейные ценности.',
    color: '#8e5bd6',
    articlesOnly: true,
    topics: [
      { id: 'emotions', name: 'Эмоции и чувства' },
      { id: 'kindness', name: 'Доброта и дружба' },
      { id: 'mindfulness', name: 'Спокойствие и внимательность' },
      { id: 'gratitude', name: 'Благодарность' },
      { id: 'values', name: 'Семейные ценности и традиции' },
      { id: 'stories', name: 'Мудрые сказки и притчи' },
      { id: 'yoga', name: 'Детская йога' },
    ],
  },
];

/** Sections with courses and tutors (personal growth only has articles). */
export const TUTOR_SECTIONS = SECTIONS.filter((s) => !s.articlesOnly);

/** Everything a tutor can teach, across all sections. */
export const TOPICS: (Topic & { section: string })[] = TUTOR_SECTIONS.flatMap((s) => s.topics.map((t) => ({ ...t, section: s.id })));
export const TOPIC_IDS = TOPICS.map((t) => t.id);
export const SECTION_IDS = TUTOR_SECTIONS.map((s) => s.id);

export const findSection = (id: string) => SECTIONS.find((s) => s.id === id);
export const topicName = (id: string) => SECTIONS.flatMap((s) => s.topics).find((t) => t.id === id)?.name ?? id;
export const topicsOfSection = (id: string) => findSection(id)?.topics.map((t) => t.id) ?? [];

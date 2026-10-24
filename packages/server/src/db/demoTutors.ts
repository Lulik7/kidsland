import type { Db } from './pool';

interface DemoTutor {
  email: string;
  displayName: string;
  headline: string;
  bio: string;
  avatar: string;
  subjects: string[];
  languages: string[];
  ageMin: number;
  ageMax: number;
  hourlyRate: number;
  rating: number;
  reviews: number;
  /** Lesson start hours (Moscow time) this tutor usually offers. */
  hours: number[];
}

const DEMO_TUTORS: DemoTutor[] = [
  {
    email: 'anna.demo@kidsland.local',
    displayName: 'Анна Смирнова',
    headline: 'Scratch для самых маленьких',
    bio: 'Пять лет учу детей 6–9 лет первым шагам в программировании. Уроки в форме игры: делаем мультфильмы и мини-игры в Scratch.',
    avatar: 'monster-5',
    subjects: ['scratch', 'logic'],
    languages: ['ru'],
    ageMin: 6,
    ageMax: 9,
    hourlyRate: 1200,
    rating: 4.9,
    reviews: 87,
    hours: [10, 12, 16],
  },
  {
    email: 'dmitry.demo@kidsland.local',
    displayName: 'Дмитрий Орлов',
    headline: 'Python и первые настоящие программы',
    bio: 'Разработчик и преподаватель. Помогаю перейти от блоков к коду: черепашья графика, текстовые игры, чат-боты.',
    avatar: 'monster-3',
    subjects: ['python', 'logic'],
    languages: ['ru', 'en'],
    ageMin: 9,
    ageMax: 14,
    hourlyRate: 1800,
    rating: 4.8,
    reviews: 54,
    hours: [12, 17, 19],
  },
  {
    email: 'aigerim.demo@kidsland.local',
    displayName: 'Айгерим Нурланова',
    headline: 'Свой первый сайт за 4 урока',
    bio: 'Фронтенд-разработчик. Вместе с ребёнком делаем страничку о любимом хобби и публикуем её в интернете.',
    avatar: 'monster-6',
    subjects: ['web', 'scratch'],
    languages: ['ru', 'kk'],
    ageMin: 8,
    ageMax: 13,
    hourlyRate: 1500,
    rating: 5.0,
    reviews: 31,
    hours: [11, 15, 18],
  },
  {
    email: 'max.demo@kidsland.local',
    displayName: 'Максим Ли',
    headline: 'Создаём игры: от идеи до уровня',
    bio: 'Геймдизайнер. Учу придумывать правила, рисовать уровни и собирать игры в Scratch и на Python (Pygame Zero).',
    avatar: 'monster-7',
    subjects: ['games', 'scratch', 'python'],
    languages: ['ru'],
    ageMin: 8,
    ageMax: 12,
    hourlyRate: 1600,
    rating: 4.7,
    reviews: 42,
    hours: [14, 16, 18],
  },
  {
    email: 'emily.demo@kidsland.local',
    displayName: 'Emily Carter',
    headline: 'Coding in English for kids',
    bio: 'Native speaker. Scratch and Python lessons in simple English: two skills at once.',
    avatar: 'monster-4',
    subjects: ['scratch', 'python'],
    languages: ['en'],
    ageMin: 7,
    ageMax: 12,
    hourlyRate: 2200,
    rating: 4.9,
    reviews: 19,
    hours: [13, 17],
  },
  {
    email: 'olga.demo@kidsland.local',
    displayName: 'Ольга Ким',
    headline: 'Логика, алгоритмы и олимпиадные задачки',
    bio: 'Учитель информатики. Развиваю алгоритмическое мышление: задачи на циклы и условия, подготовка к олимпиадам.',
    avatar: 'monster-1',
    subjects: ['logic', 'python'],
    languages: ['ru'],
    ageMin: 7,
    ageMax: 12,
    hourlyRate: 1400,
    rating: 4.8,
    reviews: 66,
    hours: [10, 15, 17],
  },
];

const MOSCOW_OFFSET_H = 3;
const DAYS_AHEAD = 14;

/**
 * Demo tutors so the marketplace is not empty in development. Their accounts cannot log in
 * (no valid password hash). Future slots are topped up on every start.
 */
export async function seedDemoTutors(db: Db, now = new Date()): Promise<void> {
  for (const t of DEMO_TUTORS) {
    const { rows: users } = await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, '!demo', 'tutor')
       ON CONFLICT (email) DO UPDATE SET role = 'tutor' RETURNING id`,
      [t.email],
    );
    const { rows: profiles } = await db.query(
      `INSERT INTO tutor_profiles
         (user_id, display_name, headline, bio, avatar, subjects, languages, age_min, age_max, hourly_rate, rating, reviews_count, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = EXCLUDED.display_name, headline = EXCLUDED.headline, bio = EXCLUDED.bio, avatar = EXCLUDED.avatar,
         subjects = EXCLUDED.subjects, languages = EXCLUDED.languages, age_min = EXCLUDED.age_min, age_max = EXCLUDED.age_max,
         hourly_rate = EXCLUDED.hourly_rate, rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count
       RETURNING id`,
      [users[0].id, t.displayName, t.headline, t.bio, t.avatar, t.subjects, t.languages, t.ageMin, t.ageMax, t.hourlyRate, t.rating, t.reviews],
    );
    const times: Date[] = [];
    for (let d = 1; d <= DAYS_AHEAD; d++) {
      for (const h of t.hours) {
        const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d, h - MOSCOW_OFFSET_H));
        // Skip some slots so calendars look realistic rather than uniformly full.
        if ((d + h) % 4 !== 0) times.push(day);
      }
    }
    await db.query(
      `INSERT INTO tutor_slots (tutor_id, starts_at)
       SELECT $1, unnest($2::timestamptz[]) ON CONFLICT DO NOTHING`,
      [profiles[0].id, times],
    );
  }
}

import type { Theme } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type LevelSummary } from '../api';
import { useAuth } from '../auth';
import { DemoBoard } from '../components/DemoBoard';
import { Sprite } from '../components/Sprite';
import { avatarSvg, COIN, GOAL, HERO, WALL } from '../game/sprites';
import { plural } from '../plural';
import { THEMES } from '../themes';

const STEPS = [
  { n: 1, title: 'Собери программу', text: 'Перетаскивай цветные блоки-команды. Никакого набора текста.', color: '#4c97ff' },
  { n: 2, title: 'Нажми «Запустить»', text: 'Герой выполняет команды шаг за шагом, а текущий блок подсвечивается.', color: '#ffab19' },
  { n: 3, title: 'Получи звёзды', text: 'Короткая программа приносит больше звёзд, монет и опыта.', color: '#40bf4a' },
];

const SKILLS = [
  { title: 'Последовательности', text: 'Порядок действий решает всё', color: '#4c97ff' },
  { title: 'Циклы', text: 'Повторять, а не копировать', color: '#40bf4a' },
  { title: 'Условия', text: 'Если стена впереди, повернуть', color: '#9966ff' },
  { title: 'Отладка', text: 'Найти ошибку и попробовать снова', color: '#ff6680' },
];

const Check = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <circle cx="12" cy="12" r="11" fill="#43d68a" />
    <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Landing() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  useEffect(() => {
    api.publicLevels().then((r) => setLevels(r.levels)).catch(() => setLevels([]));
  }, []);
  const free = levels.filter((l) => !l.isPremium).length;
  const playLink = user ? '/kids' : '/register';

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-sky" aria-hidden>
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} className="twinkle" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 85}%`, animationDelay: `${(i % 7) * 0.4}s` }} />
          ))}
          <div className="planet planet-a" />
          <div className="planet planet-b" />
          <Sprite svg={HERO.space('right')} size={90} className="float rocket-fly" />
        </div>
        <div className="hero-inner">
          <div className="hero-text">
            <span className="pill">Для детей 6–11 лет · первые уровни бесплатно</span>
            <h1>
              Учимся программировать, <span className="hl">играя</span>
            </h1>
            <p>
              Ребёнок собирает программу из блоков, а ракета, подводная лодка или робот выполняют её. Так в игре
              осваиваются циклы, условия и алгоритмы.
            </p>
            <div className="hero-cta">
              <Link to={playLink} className="btn btn-primary btn-xl">
                {user ? 'Продолжить игру' : 'Играть бесплатно'}
              </Link>
              {!user && (
                <Link to="/login" className="btn btn-light btn-xl">
                  Уже играем
                </Link>
              )}
            </div>
            <ul className="hero-points">
              <li><Check /> Без рекламы</li>
              <li><Check /> {free || 6} бесплатных уровней</li>
              <li><Check /> Прогресс для родителей</li>
            </ul>
          </div>
          <div className="hero-demo">
            <div className="window">
              <div className="window-bar">
                <i /><i /><i />
                <span>Уровень «Лестница»</span>
              </div>
              <DemoBoard />
            </div>
          </div>
        </div>
        <svg className="wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden>
          <path d="M0 40 C240 90 480 0 720 30 C960 60 1200 10 1440 40 V90 H0Z" fill="var(--bg)" />
        </svg>
      </section>

      <section className="wrap">
        <h2 className="section-title">Как это работает</h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div key={s.n} className="step">
              <div className="step-n" style={{ background: s.color }}>{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap">
        <h2 className="section-title">Три мира приключений</h2>
        <div className="worlds">
          {(Object.keys(THEMES) as Theme[]).map((key) => {
            const t = THEMES[key];
            const count = levels.filter((l) => l.theme === key).length;
            return (
              <div key={key} className="world" style={{ background: `linear-gradient(150deg, ${t.bg2}, ${t.bg})` }}>
                <div className="world-art">
                  <Sprite svg={WALL[key]} size={56} className="world-wall" />
                  <Sprite svg={HERO[key]('right')} size={110} className="world-hero" />
                  <Sprite svg={GOAL[key]} size={60} className="world-goal" />
                </div>
                <h3>{t.name}</h3>
                <p>{t.tagline}</p>
                {count > 0 && <span className="world-count">{count} {plural(count, ['уровень', 'уровня', 'уровней'])}</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="wrap">
        <h2 className="section-title">Чему научится ребёнок</h2>
        <div className="skills">
          {SKILLS.map((s) => (
            <div key={s.title} className="skill" style={{ borderColor: s.color }}>
              <span className="skill-dot" style={{ background: s.color }} />
              <div>
                <b>{s.title}</b>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="parents">
          <div className="parents-text">
            <span className="pill pill-dark">Для родителей</span>
            <h2>Видно, чему ребёнок уже научился</h2>
            <p>
              В кабинете родителя видно пройденные уровни и освоенные темы. Когда базовый курс пройден, можно
              записаться на бесплатный урок с наставником.
            </p>
          </div>
          <div className="parents-card">
            <div className="pc-head">
              <Sprite svg={avatarSvg('monster-3')} size={52} />
              <div>
                <b>Маша, 8 лет</b>
                <span>Пройдено 6 из 10 уровней</span>
              </div>
            </div>
            {[
              ['Последовательности', 100, '#4c97ff'],
              ['Циклы', 70, '#40bf4a'],
              ['Условия', 25, '#9966ff'],
            ].map(([label, v, c]) => (
              <div key={label} className="pc-bar">
                <span>{label}</span>
                <div><i style={{ width: `${v}%`, background: c as string }} /></div>
              </div>
            ))}
            <div className="pc-nudge">
              <Sprite svg={COIN} size={26} /> Базовые уровни пройдены! Запишитесь на бесплатный урок.
            </div>
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="final-cta">
          <Sprite svg={HERO.robot('down')} size={96} className="float" />
          <div>
            <h2>Первый уровень проходится за 2 минуты</h2>
            <p>Регистрация бесплатная, банковская карта не нужна.</p>
          </div>
          <Link to={playLink} className="btn btn-primary btn-xl">
            Начать
          </Link>
        </div>
      </section>

      <footer className="footer">© {new Date().getFullYear()} Kidsland. Программирование для детей.</footer>
    </main>
  );
}

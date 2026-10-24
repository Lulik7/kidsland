import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type LevelSummary } from '../api';
import { useAuth } from '../auth';
import { THEMES } from '../themes';

const STEPS = [
  { icon: '🧩', title: 'Собирай блоки', text: 'Перетаскивай команды мышкой, никакого набора текста.' },
  { icon: '▶️', title: 'Запускай', text: 'Смотри, как герой выполняет твою программу шаг за шагом.' },
  { icon: '⭐', title: 'Получай звёзды', text: 'Чем короче программа, тем больше звёзд, монет и опыта.' },
];

export function Landing() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  useEffect(() => {
    api.publicLevels().then((r) => setLevels(r.levels)).catch(() => setLevels([]));
  }, []);
  const free = levels.filter((l) => !l.isPremium).length;

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Программирование, <span className="grad">в которое хочется играть</span>
          </h1>
          <p>
            Kidsland учит детей 6–11 лет думать как программисты: последовательности, циклы и условия в ярких
            играх про космос, океан и роботов.
          </p>
          <div className="hero-cta">
            <Link to={user ? '/kids' : '/register'} className="btn btn-primary btn-lg">
              {user ? 'Продолжить игру' : 'Играть бесплатно'}
            </Link>
            {levels.length > 0 && (
              <span className="muted">
                {free} бесплатных уровней из {levels.length}
              </span>
            )}
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="orbit">
            <span>🚀</span>
            <span>🐠</span>
            <span>🤖</span>
          </div>
          <div className="code-card">
            <div className="blk blk-start">▶ Старт</div>
            <div className="blk blk-loop">🔁 Повторить 4 раза</div>
            <div className="blk blk-move indent">⬆️ Шаг вперёд</div>
            <div className="blk blk-coin indent">🪙 Собрать монету</div>
            <div className="blk blk-move">↪️ Повернуть направо</div>
          </div>
        </div>
      </section>

      <section className="steps">
        {STEPS.map((s) => (
          <div key={s.title} className="card step">
            <div className="step-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="section-title">Три мира приключений</h2>
        <div className="worlds">
          {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((key) => {
            const t = THEMES[key];
            return (
              <div key={key} className="world" style={{ background: `linear-gradient(135deg, ${t.bg}, ${t.cell})` }}>
                <div className="world-hero">{t.hero}</div>
                <h3>{t.name}</h3>
                <p>{levels.filter((l) => l.theme === key).length || '…'} уровней</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="parents card">
        <div>
          <h2>Для родителей</h2>
          <p>
            Видите, какие темы ребёнок уже освоил, а когда базовые уровни пройдены, можно записаться на бесплатный
            урок с наставником. Кабинет родителя и наставники появятся совсем скоро.
          </p>
        </div>
        <div className="parents-icon">👨‍👩‍👧</div>
      </section>
    </main>
  );
}

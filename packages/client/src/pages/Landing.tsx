import { CHILD_SAFETY_TIPS, SECTIONS, SUBJECTS, type Theme } from '@kidsland/shared';
import { CONTACTS } from '../contacts';
import { SubjectCard } from '../components/SubjectCard';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type LevelSummary, type Tutor } from '../api';
import { useAuth } from '../auth';
import { HeroCarousel } from '../components/HeroCarousel';
import { RobotGuide } from '../components/RobotGuide';
import { WorldScene } from '../components/WorldScene';
import { Globe } from '../components/Globe';
import { WcBalloon, WcBird, WcBirds, WcBlob, WcCloud, WcFlowers, WcHills, WcHorse, WcHouse, WcLeaves, WcStar, WcWhale } from '../components/Watercolor';
import { Sprite } from '../components/Sprite';
import { TutorCard } from '../components/TutorCard';
import { avatarSvg, COIN, GOAL, HERO, WALL } from '../game/sprites';
import { plural } from '../plural';
import { THEMES } from '../themes';
import { Pic } from '../pics';
import { useT } from '../i18n';

const FEATURES = [
  { to: '/kids', title: 'Игры', text: '3 мира и 10 уровней: собирай программу из блоков и веди героя к цели.', icon: '🎮', color: '#4c97ff' },
  { to: '/courses', title: 'Курсы', text: 'Программирование, наука, шахматы, музыка, языки и ещё 5 разделов: теория, задания и викторины.', icon: '📚', color: '#2fc46b' },
  { to: '/tutors', title: 'Наставники', text: 'Живые уроки с видео, общей доской и чатом. Первый урок бесплатно.', icon: '👩‍🏫', color: '#ff6b3d' },
  { to: '/parent', title: 'Кабинет родителя', text: 'Прогресс по темам, пройденные уроки и запись на занятия.', icon: '📈', color: '#9966ff' },
];

const Check = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <circle cx="12" cy="12" r="11" fill="#43d68a" />
    <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Landing() {
  const t = useT();
  const { user } = useAuth();
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  useEffect(() => {
    api.publicLevels().then((r) => setLevels(r.levels)).catch(() => setLevels([]));
    api.tutors({ sort: 'rating' }).then((r) => setTutors(r.tutors.slice(0, 3))).catch(() => setTutors([]));
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
          <WcBalloon className="wc-balloon float" size={150} />
          <WcBirds className="wc-birds" />
          <WcCloud className="wc-c1" size={130} />
          <WcCloud className="wc-c2" size={160} color="#b9dbe9" />
          <WcCloud className="wc-c3" size={110} color="#f6cbb5" />
          <WcStar className="wc-s1" size={44} />
          <WcStar className="wc-s2" size={30} color="#7fbad6" />
          <WcStar className="wc-s3" size={36} color="#f2c879" />
          <Pic code="2708" size={120} className="wc-plane" />
        </div>
        <div className="hero-inner">
          <div className="hero-text">
            <span className="pill">{t('Для детей 6–14 лет · игры, курсы и наставники')}</span>
            <div className="hero-slogan">
              <span className="hs-main">
                <b>Kidsland</b> {t('— это страна науки и творчества!')}
              </span>
              <span className="hs-sub">{t('Давай учиться вместе!')}</span>
            </div>
            <div className="hero-cta">
              <Link to={playLink} className="btn btn-primary btn-xl">
                {user ? t('Продолжить игру') : t('Играть бесплатно')}
              </Link>
              <a href="#guide" className="btn btn-light btn-xl">
                {t('▶ Смотреть видео')}
              </a>
            </div>
            <ul className="hero-points">
              <li><Check />{' '}{t('Без рекламы')}</li>
              <li><Check /> {free || 6}{' '}{t('бесплатных уровней')}</li>
              <li><Check />{' '}{t('Прогресс для родителей')}</li>
            </ul>
          </div>
          <div className="hero-demo">
            <HeroCarousel />
          </div>
        </div>
        <WcHills />
      </section>

      <section className="wrap globe-section">
        <Globe />
        <div className="globe-text">
          <span className="pill pill-dark">{t('Разделы Kidsland')}</span>
          <h2>{t('Целый мир занятий для ребёнка')}</h2>
          <p className="muted">{t('Программирование, наука и опыты, музыка, рисование, языки, животные и многое другое: курсы для самостоятельной учёбы и живые уроки с наставниками.')}</p>
          <div className="section-chips">
            {SECTIONS.map((s) => (
              <Link key={s.id} to={`/sections/${s.id}`} className="section-chip" style={{ ['--c' as string]: s.color }}>
                {t(s.name)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap guide-section" id="guide">
        <div className="guide-text">
          <span className="pill pill-dark">{t('Видео-знакомство')}</span>
          <h2>{t('Робот Кидди покажет, как всё устроено')}</h2>
          <p className="muted">
            {t('Включите вместе с ребёнком: за пару минут Кидди расскажет про игры, курсы, уроки с наставником и правила безопасности.')}
          </p>
          <ul className="guide-list">
            <li><Check />{' '}{t('Где играть и как получать звёзды')}</li>
            <li><Check />{' '}{t('Как проходить курсы и викторины')}</li>
            <li><Check />{' '}{t('Как устроен урок с наставником')}</li>
            <li><Check />{' '}{t('Почему нельзя писать телефон и отправлять фото')}</li>
          </ul>
        </div>
        <RobotGuide />
      </section>

      <section className="wrap">
        <h2 className="section-title">{t('Всё для учёбы в одном месте')}</h2>
        <div className="features">
          {FEATURES.map((f) => (
            <Link key={f.title} to={user || f.to === '/courses' || f.to === '/tutors' ? f.to : '/register'} className="feature" style={{ ['--c' as string]: f.color }}>
              <span className="feature-icon" aria-hidden>{f.icon}</span>
              <h3>{t(f.title)}</h3>
              <p>{t(f.text)}</p>
              <span className="feature-go">{t('Открыть →')}</span>
            </Link>
          ))}
        </div>
      </section>


      <section className="wrap">
        <h2 className="section-title">{t('Три мира приключений')}</h2>
        <div className="worlds">
          {(Object.keys(THEMES) as Theme[]).map((key) => {
            const th = THEMES[key];
            const count = levels.filter((l) => l.theme === key).length;
            // A parent plays with a child profile so stars are saved; a guest gets the first free level as a trial.
            const first = levels.find((l) => l.theme === key && !l.isPremium);
            const to = user?.role === 'parent' ? '/kids' : first ? `/play/${first.slug}` : '/register';
            return (
              <Link key={key} to={to} className="world" style={{ background: `linear-gradient(150deg, ${th.bg2}, ${th.bg})` }}>
                <WorldScene theme={key} />
                <div className="world-art">
                  <Sprite svg={WALL[key]} size={56} className="world-wall" />
                  <Sprite svg={HERO[key]('right')} size={110} className={`world-hero world-hero-${key}`} />
                  <Sprite svg={GOAL[key]} size={60} className="world-goal" />
                </div>
                <h3>{t(th.name)}</h3>
                <p>{t(th.tagline)}</p>
                {count > 0 && <span className="world-count">{count} {plural(count, [t('уровень'), t('уровня'), t('уровней')])}</span>}
                <span className="world-play">{t('Играть →')}</span>
              </Link>
            );
          })}
        </div>
      </section>


      <section className="wrap">
        <h2 className="section-title">{t('Курсы для самостоятельного обучения')}</h2>
        <p className="section-sub">{t('Восемь направлений, в каждом три уровня. Ребёнок учится в своём темпе, а за пройденные уроки получает опыт и монеты.')}</p>
        <div className="subject-cards">
          {SUBJECTS.map((sub) => (
            <SubjectCard key={sub.id} subject={sub.id} to={`/courses?subject=${sub.id}`} />
          ))}
        </div>
        <div className="center-row">
          <Link to="/courses" className="btn btn-primary btn-xl">
            {t('Все курсы')}
          </Link>
        </div>
      </section>

      <section className="wrap">
        <div className="parents">
          <div className="parents-text">
            <span className="pill pill-dark">{t('Для родителей')}</span>
            <h2>{t('Видно, чему ребёнок уже научился')}</h2>
            <p>
              {t('В кабинете родителя видно пройденные уровни и освоенные темы. Когда базовый курс пройден, можно записаться на бесплатный урок с наставником.')}
            </p>
          </div>
          <div className="parents-card">
            <div className="pc-head">
              <Sprite svg={avatarSvg('monster-3')} size={52} />
              <div>
                <b>{t('Маша, 8 лет')}</b>
                <span>{t('Пройдено 6 из 10 уровней')}</span>
              </div>
            </div>
            {[
              [t('Последовательности'), 100, '#4c97ff'],
              [t('Циклы'), 70, '#40bf4a'],
              [t('Условия'), 25, '#9966ff'],
            ].map(([label, v, c]) => (
              <div key={label} className="pc-bar">
                <span>{label}</span>
                <div><i style={{ width: `${v}%`, background: c as string }} /></div>
              </div>
            ))}
            <div className="pc-nudge">
              <Sprite svg={COIN} size={26} />{' '}{t('Базовые уровни пройдены! Запишитесь на бесплатный урок.')}
            </div>
          </div>
        </div>
      </section>

      {tutors.length > 0 && (
        <section className="wrap">
          <h2 className="section-title">{t('Наставники для живых уроков')}</h2>
          <p className="section-sub">{t('Когда игра пройдена, наставник поможет перейти к Scratch, Python или созданию сайтов. Первый урок бесплатно.')}</p>
          <div className="tutor-grid">
            {tutors.map((tu) => (
              <TutorCard key={tu.id} tutor={tu} />
            ))}
          </div>
          <div className="center-row">
            <Link to="/tutors" className="btn btn-light btn-xl">
              {t('Все наставники')}
            </Link>
            <Link to="/lessons/demo" className="btn btn-primary btn-xl">
              {t('Посмотреть демо-урок')}
            </Link>
          </div>
        </section>
      )}

      <section className="wrap">
        <div className="safety">
          <WcBird className="safety-bird" size={84} />
          <WcWhale className="safety-whale" size={230} />
          <WcBlob className="safety-wash" color="#bfdcea" />
          <div className="safety-text">
            <h2>{t('Безопасность детей на первом месте')}</h2>
            <p>
              {t('Общение с наставником идёт только на сайте. Система блокирует сообщения с телефонами, почтой, адресами, ссылками на мессенджеры и просьбами прислать фото, а модератор видит каждую такую попытку.')}
            </p>
            <ul>
              {CHILD_SAFETY_TIPS.slice(0, 2).map((tip) => <li key={tip}>{t(tip)}</li>)}
            </ul>
          </div>
          <Link to="/support" className="btn btn-light">
            {t('Служба поддержки')}
          </Link>
        </div>
      </section>

      <section className="wrap">
        <div className="final-cta">
          <WcLeaves className="cta-leaves" size={230} />
          <WcFlowers className="cta-flowers" size={240} />
          <WcBlob className="cta-blob" />
          <div className="cta-text">
            <p className="cta-kicker">{t('Регистрация бесплатная, банковская карта не нужна.')}</p>
            <h2>{t('Первый уровень проходится за 2 минуты')}</h2>
          </div>
          <Link to={playLink} className="btn btn-primary btn-xl">
            {t('Начать')}
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="sf-scene" aria-hidden>
          <WcBalloon className="sf-balloon" size={86} />
          <WcCloud className="sf-cloud1" size={120} />
          <WcCloud className="sf-cloud2" size={90} color="#f4c9b8" />
          <WcHorse className="sf-horse" size={190} />
          <WcHouse className="sf-house" size={150} />
          <WcHills />
        </div>
        <div className="sf-cols">
          <div>
            <b className="sf-logo">Kids<span>land</span></b>
            <p>{t('Программирование для детей 6–14 лет: игры, курсы и уроки с наставниками.')}</p>
          </div>
          <nav>
            <b>{t('Учиться')}</b>
            <Link to="/kids">{t('Игры')}</Link>
            <Link to="/courses">{t('Курсы')}</Link>
            <Link to="/lessons/demo">{t('Демо-урок')}</Link>
          </nav>
          <nav>
            <b>{t('Наставники')}</b>
            <Link to="/tutors">{t('Выбрать наставника')}</Link>
            <Link to="/register?role=tutor">{t('Стать наставником')}</Link>
          </nav>
          <nav>
            <b>{t('Помощь')}</b>
            <Link to="/support">{t('Служба поддержки')}</Link>
            <a href="#guide">{t('Видео о сайте')}</a>
          </nav>
          <div className="sf-contacts" id="contacts">
            <b>{t('Контакты')}</b>
            <a href={`tel:${CONTACTS.phone.replace(/[^\d+]/g, '')}`}>{CONTACTS.phone}</a>
            <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>
            <span>{t(CONTACTS.address)}</span>
            <span>{t(CONTACTS.hours)}</span>
            <div className="sf-socials">
              {CONTACTS.socials.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                  {t(s.name)}
                </a>
              ))}
            </div>
          </div>
        </div>
        <span className="sf-copy">© {new Date().getFullYear()} Kidsland</span>
      </footer>
    </main>
  );
}

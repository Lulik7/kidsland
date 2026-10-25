import { WcBranch, WcCloud } from '../components/Watercolor';
import { articlesOfSection, COURSES, findSection, SECTIONS, SUBJECTS, type Article, type Section } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Tutor } from '../api';
import { CourseCard } from '../components/CourseCard';
import { HeroBg, SECTION_BG, TOPIC_PHOTO } from '../components/HeroBg';
import { TutorCard } from '../components/TutorCard';
import { useTc } from '../content';
import { useT } from '../i18n';
import { Pic, sectionPic } from '../pics';
import { plural } from '../plural';

const coursesOf = (s: Section) => {
  const subjects = SUBJECTS.filter((x) => x.section === s.id).map((x) => x.id as string);
  return COURSES.filter((c) => subjects.includes(c.subject));
};

/** All big areas of Kidsland with their topics. */
export function SectionsPage() {
  const t = useT();
  return (
    <main className="page sections-page">
      <section className="courses-hero">
      <WcBranch className="banner-branch" size={190} />
        <span className="pill pill-dark">{t('Разделы Kidsland')}</span>
        <h1>{t('Выбери, чему учиться')}</h1>
        <p>{t('В каждом разделе есть курсы для самостоятельной учёбы и наставники для живых уроков. Первый урок с наставником бесплатный.')}</p>
      </section>
      <div className="section-grid">
        {SECTIONS.map((s) => {
          const lessons = coursesOf(s).reduce((n, c) => n + c.lessons.length, 0);
          return (
            <Link key={s.id} to={`/sections/${s.id}`} className="section-card" style={{ ['--c' as string]: s.color }}>
              <span className="sec-art">
                <WcCloud className="sec-cloud" size={120} color="#bfe0f0" />
                <span className="sec-circle">
                  <Pic code={sectionPic(s.id)} size={70} />
                </span>
                <WcBranch className="sec-leaves" size={120} />
              </span>
              <span className="sec-body">
              <h2>{t(s.name)}</h2>
              <p>{t(s.tagline)}</p>
              <div className="sec-topics">
                {s.topics.slice(0, 6).map((tp) => (
                  <span key={tp.id}>{t(tp.name)}</span>
                ))}
                {s.topics.length > 6 && <span>+{s.topics.length - 6}</span>}
              </div>
              <b className="sec-count">
                {s.articlesOnly
                  ? `${articlesOfSection(s.id).length} ${plural(articlesOfSection(s.id).length, [t('статья'), t('статьи'), t('статей')])}`
                  : `${lessons} ${plural(lessons, [t('урок'), t('урока'), t('уроков')])}`}
              </b>
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function SectionHero({ section }: { section: Section }) {
  const t = useT();
  return (
    <section className={`section-hero${SECTION_BG[section.id] ? ' has-bg' : ''}`} style={{ ['--c' as string]: section.color }}>
      <HeroBg media={SECTION_BG[section.id]} />
      {!SECTION_BG[section.id] && <WcBranch className="banner-branch" size={190} />}
      <span className="sec-icon sec-icon-xl">
        <Pic code={sectionPic(section.id)} size={84} />
      </span>
      <div>
        <Link to="/sections" className="back-link">← {t('Все разделы')}</Link>
        <h1>{t(section.name)}</h1>
        <p>{t(section.description)}</p>
      </div>
    </section>
  );
}

/** A section without tutors: topics filter a list of articles to read. */
function ArticlesSection({ section }: { section: Section }) {
  const t = useT();
  const [topic, setTopic] = useState('');
  const articles = articlesOfSection(section.id).filter((a) => !topic || a.topic === topic);
  return (
    <main className="page sections-page">
      <SectionHero section={section} />
      <div className="topic-chips" role="group" aria-label={t('Темы')}>
        <button className={topic ? 'topic-chip' : 'topic-chip on'} style={{ ['--c' as string]: section.color }} onClick={() => setTopic('')}>
          {t('Все темы')}
        </button>
        {section.topics.map((tp) => (
          <button key={tp.id} className={topic === tp.id ? 'topic-chip on' : 'topic-chip'} style={{ ['--c' as string]: section.color }} onClick={() => setTopic(tp.id)}>
            {t(tp.name)}
          </button>
        ))}
      </div>
      <h2 className="track-title">{t('Статьи')}</h2>
      <ArticleGrid section={section} articles={articles} />
    </main>
  );
}

function ArticleGrid({ section, articles }: { section: Section; articles: Article[] }) {
  const t = useT();
  const tc = useTc();
  return (
    <div className="article-grid">
      {articles.map((a) => (
        <Link key={a.id} to={`/articles/${a.id}`} className="article-card" style={{ ['--c' as string]: section.color }}>
          <span className="article-topic">{t(section.topics.find((tp) => tp.id === a.topic)?.name ?? '')}</span>
          <h3>{tc(a.title)}</h3>
          <p>{tc(a.summary)}</p>
          <span className="muted small">{t('{n} мин чтения', { n: a.minutes })}</span>
        </Link>
      ))}
    </div>
  );
}

/** One section: topics, its courses and tutors who teach it. */
export function SectionPage() {
  const t = useT();
  const { sectionId } = useParams();
  const section = findSection(sectionId ?? '');
  const [tutors, setTutors] = useState<Tutor[] | null>(null);
  useEffect(() => {
    if (!section || section.articlesOnly) return;
    setTutors(null);
    api.tutors({ section: section.id, sort: 'rating' }).then((r) => setTutors(r.tutors)).catch(() => setTutors([]));
  }, [section]);

  if (!section) return <div className="center-note">{t('Такого раздела нет.')} <Link to="/sections">{t('Все разделы')}</Link></div>;
  if (section.articlesOnly) return <ArticlesSection section={section} />;
  const courses = coursesOf(section);

  return (
    <main className="page sections-page">
      <SectionHero section={section} />

      <h2 className="track-title">{t('Темы')}</h2>
      <div className="topic-chips">
        {section.topics.map((tp) => (
          <Link key={tp.id} to={`/tutors?subject=${tp.id}`} className={`topic-chip${TOPIC_PHOTO[tp.id] ? ' with-photo' : ''}`} style={{ ['--c' as string]: section.color }}>
            {TOPIC_PHOTO[tp.id] && <img src={TOPIC_PHOTO[tp.id].image} alt="" style={{ objectPosition: TOPIC_PHOTO[tp.id].pos }} />}
            {t(tp.name)}
          </Link>
        ))}
      </div>
      <p className="muted small">{t('Нажми на тему, чтобы найти наставника по ней.')}</p>

      <h2 className="track-title">{t('Курсы')}</h2>
      <div className="track-row">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} to={`/courses/${c.id}`} />
        ))}
      </div>

      {articlesOfSection(section.id).length > 0 && (
        <>
          <h2 className="track-title">{t('Статьи')}</h2>
          <ArticleGrid section={section} articles={articlesOfSection(section.id)} />
        </>
      )}

      <h2 className="track-title">{t('Наставники')}</h2>
      {!tutors ? (
        <div className="center-note">{t('Ищем наставников…')}</div>
      ) : tutors.length === 0 ? (
        <div className="center-note">{t('Скоро здесь появятся наставники.')}</div>
      ) : (
        <div className="tutor-grid">
          {tutors.slice(0, 6).map((tu) => (
            <TutorCard key={tu.id} tutor={tu} />
          ))}
        </div>
      )}
      <div className="sec-more">
        <Link to={`/tutors?section=${section.id}`} className="btn btn-primary">
          {t('Все наставники раздела')}
        </Link>
      </div>
    </main>
  );
}

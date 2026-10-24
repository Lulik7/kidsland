import { COURSE_LEVELS, COURSES, SUBJECTS, type CourseLevel, type SubjectId } from '@kidsland/shared';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { CourseCard } from '../components/CourseCard';
import { KidHud } from '../components/KidHud';
import { SubjectCard } from '../components/SubjectCard';
import { SubjectIcon } from '../components/SubjectIcon';
import { coursesBase } from '../courses/meta';
import { useCourseProgress } from '../courses/useChild';
import { useT } from '../i18n';

export function CoursesPage() {
  const t = useT();
  const { childId } = useParams();
  const { user } = useAuth();
  const { child, progress, error } = useCourseProgress(childId);
  const [params] = useSearchParams();
  const initial = SUBJECTS.find((s) => s.id === params.get('subject'))?.id ?? '';
  const [subject, setSubject] = useState<SubjectId | ''>(initial);
  const [level, setLevel] = useState<CourseLevel | ''>('');

  if (!progress) return <div className="center-note">{error ?? t('Загружаем курсы…')}</div>;
  const done = (courseId: string) => progress.filter((p) => p.courseId === courseId && p.completed).length;
  const base = coursesBase(childId);
  const subjects = SUBJECTS.filter((s) => !subject || s.id === subject);

  return (
    <main className="page courses-page">
      {childId ? (
        <KidHud childId={childId} child={child} />
      ) : (
        <section className="courses-hero">
          <div>
            <span className="pill pill-dark">{t('Учись сам, в своём темпе')}</span>
            <h1>{t('Курсы Kidsland')}</h1>
            <p>
              {t('Программирование, наука и опыты, музыка, рисование, рукоделие, кулинария, языки, животные и духовное развитие. В уроках есть теория, задания, викторины и ответы на частые вопросы.')}
            </p>
            {!user && (
              <div className="hero-cta">
                <Link to="/register" className="btn btn-primary btn-xl">
                  {t('Начать бесплатно')}
                </Link>
                <span className="muted small">{t('Без регистрации можно читать уроки и решать задания, но прогресс не сохранится.')}</span>
              </div>
            )}
            {user?.role === 'parent' && (
              <Link to="/kids" className="btn btn-primary">
                {t('Выбрать ребёнка и сохранять прогресс')}
              </Link>
            )}
          </div>
        </section>
      )}

      {!subject && (
        <section className="courses-directions">
          <h2 className="track-title">{t('Направления')}</h2>
          <div className="subject-cards">
            {SUBJECTS.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s.id}
                onMore={() => {
                  setSubject(s.id);
                  setTimeout(() => document.getElementById('course-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
                }}
              />
            ))}
          </div>
        </section>
      )}

      <div className="filters course-filters" id="course-filters">
        <div className="chips-row">
          <button className={subject === '' ? 'fchip on' : 'fchip'} onClick={() => setSubject('')}>
            {t('Все направления')}
          </button>
          {SUBJECTS.map((s) => (
            <button key={s.id} className={subject === s.id ? 'fchip on' : 'fchip'} onClick={() => setSubject(s.id)}>
              {t(s.name)}
            </button>
          ))}
        </div>
        <div className="chips-row">
          <button className={level === '' ? 'fchip on' : 'fchip'} onClick={() => setLevel('')}>
            {t('Все уровни')}
          </button>
          {COURSE_LEVELS.map((l) => (
            <button key={l.id} className={level === l.id ? 'fchip on' : 'fchip'} onClick={() => setLevel(l.id)}>
              {t(l.name)}
            </button>
          ))}
        </div>
      </div>

      {subjects.map((s) => {
        const list = COURSES.filter((c) => c.subject === s.id && (!level || c.level === level));
        if (!list.length) return null;
        return (
          <section key={s.id} className="track">
            <h2 className="track-title">
              <span className="track-icon" style={{ background: list[0].color }}>
                <SubjectIcon subject={s.id} size={28} />
              </span>
              {t(s.name)}
            </h2>
            <div className="track-row">
              {list.map((c) => (
                <CourseCard key={c.id} course={c} to={`${base}/${c.id}`} done={childId ? done(c.id) : undefined} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

import { COURSE_LEVELS, COURSES, SUBJECTS, type CourseLevel, type SubjectId } from '@kidsland/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { CourseCard } from '../components/CourseCard';
import { KidHud } from '../components/KidHud';
import { SubjectIcon } from '../components/SubjectIcon';
import { coursesBase } from '../courses/meta';
import { useCourseProgress } from '../courses/useChild';

export function CoursesPage() {
  const { childId } = useParams();
  const { user } = useAuth();
  const { child, progress, error } = useCourseProgress(childId);
  const [subject, setSubject] = useState<SubjectId | ''>('');
  const [level, setLevel] = useState<CourseLevel | ''>('');

  if (!progress) return <div className="center-note">{error ?? 'Загружаем курсы…'}</div>;
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
            <span className="pill pill-dark">Учись сам, в своём темпе</span>
            <h1>Курсы по программированию</h1>
            <p>
              Пять направлений и три уровня в каждом: от первых блоков до настоящего кода. В уроках есть теория,
              задания, викторины и ответы на частые вопросы.
            </p>
            {!user && (
              <div className="hero-cta">
                <Link to="/register" className="btn btn-primary btn-xl">
                  Начать бесплатно
                </Link>
                <span className="muted small">Без регистрации можно читать уроки и решать задания, но прогресс не сохранится.</span>
              </div>
            )}
            {user?.role === 'parent' && (
              <Link to="/kids" className="btn btn-primary">
                Выбрать ребёнка и сохранять прогресс
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="filters course-filters">
        <div className="chips-row">
          <button className={subject === '' ? 'fchip on' : 'fchip'} onClick={() => setSubject('')}>
            Все направления
          </button>
          {SUBJECTS.map((s) => (
            <button key={s.id} className={subject === s.id ? 'fchip on' : 'fchip'} onClick={() => setSubject(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="chips-row">
          <button className={level === '' ? 'fchip on' : 'fchip'} onClick={() => setLevel('')}>
            Все уровни
          </button>
          {COURSE_LEVELS.map((l) => (
            <button key={l.id} className={level === l.id ? 'fchip on' : 'fchip'} onClick={() => setLevel(l.id)}>
              {l.name}
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
              {s.name}
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

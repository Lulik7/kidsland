import { coursesBySubject, getCourse, SUBJECTS } from '@kidsland/shared';
import { Link, Navigate, useParams } from 'react-router-dom';
import { LevelBadge } from '../components/CourseCard';
import { Faq } from '../components/Faq';
import { courseBg, courseGallery, HeroBg, PhotoGallery } from '../components/HeroBg';
import { LockIcon } from '../components/Icons';
import { KidHud } from '../components/KidHud';
import { coursePic, Pic } from '../pics';
import { coursesBase, levelName } from '../courses/meta';
import { useCourseProgress } from '../courses/useChild';
import { subjectName } from '../format';
import { useLocal, useTc } from '../content';
import { useT } from '../i18n';

export function CoursePage() {
  const t = useT();
  const { childId, courseId = '' } = useParams();
  const course = getCourse(courseId);
  const shown = useLocal(course);
  const tc = useTc();
  const { child, progress, error } = useCourseProgress(childId);
  const base = coursesBase(childId);
  if (!course) return <Navigate to={base} replace />;
  if (!progress) return <div className="center-note">{error ?? t('Загружаем курс…')}</div>;

  const passed = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const best = new Map(progress.map((p) => [p.lessonId, p]));
  // In a child's space lessons open one after another; the public preview shows them all.
  const unlocked = (i: number) => !childId || i === 0 || passed.has(course.lessons[i - 1].id);
  const doneCount = course.lessons.filter((l) => passed.has(l.id)).length;
  const next = course.lessons.find((l, i) => unlocked(i) && !passed.has(l.id));
  // Languages and instruments share one subject: list only this language's or instrument's levels.
  const siblings = coursesBySubject(course.subject).filter((c) => !course.topic || c.topic === course.topic);
  const coding = SUBJECTS.find((s) => s.id === course.subject)?.section === 'coding';
  const tutorsLink = coding ? `/tutors?subject=${course.subject}` : course.subject === 'music' && course.topic ? `/tutors?subject=${course.topic}` : `/tutors?section=${course.subject}`;

  return (
    <main className="page course-page">
      {childId && <KidHud childId={childId} child={child} />}
      <Link to={base} className="back-link">
        {t('← Все курсы')}
      </Link>
      <section className={`course-hero${courseBg(course) ? ' has-bg' : ''}`} style={{ ['--c' as string]: course.color }}>
        <HeroBg media={courseBg(course)} />
        <div className="ch-icon">
          <Pic code={coursePic(course)} size={110} />
        </div>
        <div className="ch-text">
          <div className="chips">
            <span className="chip ch-chip">{t(subjectName(course.subject))}</span>
            <LevelBadge level={course.level} />
            <span className="chip ch-chip">
              {course.ageMin}–{course.ageMax}{' '}{t('лет')}
            </span>
          </div>
          <h1>{shown!.title}</h1>
          <p>{shown!.description}</p>
          {next && (
            <Link to={`${base}/${course.id}/${next.id}`} className="btn btn-light btn-xl">
              {doneCount > 0 ? t('Продолжить') : t('Начать курс')}
            </Link>
          )}
          {course.subject === 'languages' && (
            <Link to={`/courses/${course.id}/downloads`} className="btn btn-light">
              📥 {t('Комната скачивания')}
            </Link>
          )}
          {childId && doneCount === course.lessons.length && <div className="ch-done">{t('🏆 Курс пройден!')}</div>}
        </div>
      </section>

      {courseGallery(course) && <PhotoGallery title={t(courseGallery(course)!.title)} photos={courseGallery(course)!.photos} />}

      <div className="course-layout">
        <section>
          <h2 className="card-title">{t('Уроки')}</h2>
          <ol className="lesson-list">
            {course.lessons.map((l, i) => {
              const open = unlocked(i);
              const p = best.get(l.id);
              const tasks = l.practice.length + l.quiz.length;
              const body = (
                <>
                  <span className={`ll-num${passed.has(l.id) ? ' done' : ''}`}>{passed.has(l.id) ? '✓' : i + 1}</span>
                  <span className="ll-main">
                    <b>{shown!.lessons[i].title}</b>
                    <span className="muted small">
                      {l.practice.length > 0 ? (
                        <>
                          {l.minutes}{' '}{t('мин · теория,')}{' '}{l.practice.length}{' '}{t('задания, викторина ·')}{' '}{tasks}{' '}{t('вопросов')}
                        </>
                      ) : (
                        <>
                          {l.minutes}{' '}{t('мин · теория, викторина ·')}{' '}{tasks}{' '}{t('вопросов')}
                        </>
                      )}
                    </span>
                  </span>
                  <span className="ll-side">
                    {!open ? <LockIcon size={26} /> : p ? <span className="chip chip-muted">{p.bestScore} / {p.maxScore}</span> : null}
                  </span>
                </>
              );
              return (
                <li key={l.id}>
                  {open ? (
                    <Link to={`${base}/${course.id}/${l.id}`} className="ll">
                      {body}
                    </Link>
                  ) : (
                    <div className="ll locked" title={t('Сначала пройди предыдущий урок')}>
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <h2 className="card-title faq-title">{t('Вопросы и ответы')}</h2>
          <Faq items={shown!.faq} />
        </section>
        <aside className="course-side">
          <div className="card">
            <h3 className="card-title">{coding ? t('Уровни направления') : t('Курсы направления')}</h3>
            <div className="level-ladder">
              {siblings.map((c) => (
                <Link key={c.id} to={`${base}/${c.id}`} className={c.id === course.id ? 'rung on' : 'rung'}>
                  <LevelBadge level={c.level} />
                  <span>{tc(c.title)}</span>
                </Link>
              ))}
            </div>
            <p className="muted small">
              {t('Не уверен, какой уровень выбрать? Начни с уровня «')}{t(levelName('beginner'))}{t('»: если всё знакомо, викторины пройдутся быстро.')}
            </p>
          </div>
          <div className="card soft">
            <h3 className="card-title">{t('Нужна помощь?')}</h3>
            <p className="muted">{t('Наставник объяснит сложную тему на живом уроке. Первый урок бесплатный.')}</p>
            <Link to={tutorsLink} className="btn btn-primary">
              {t('Выбрать наставника')}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

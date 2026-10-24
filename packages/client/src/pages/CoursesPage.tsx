import { COURSE_LEVELS, COURSES, SECTIONS, SUBJECTS, type CourseLevel, type SubjectId } from '@kidsland/shared';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  const { child, progress, error } = useCourseProgress(childId);
  const [params, setParams] = useSearchParams();
  const initial = SUBJECTS.find((s) => s.id === params.get('subject'))?.id ?? '';
  const [subject, setSubject] = useState<SubjectId | ''>(initial);
  const [level, setLevel] = useState<CourseLevel | ''>('');
  // Big section tiles come first; a click opens that section's tracks and courses.
  const sectionId = params.get('section') ?? SUBJECTS.find((s) => s.id === initial)?.section ?? '';
  const section = SECTIONS.find((s) => s.id === sectionId && !s.articlesOnly);
  const openSection = (id: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('section', id);
    else next.delete('section');
    next.delete('subject');
    setParams(next);
    setSubject('');
    setLevel('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!progress) return <div className="center-note">{error ?? t('Загружаем курсы…')}</div>;
  const done = (courseId: string) => progress.filter((p) => p.courseId === courseId && p.completed).length;
  const base = coursesBase(childId);
  const sectionSubjects = SUBJECTS.filter((s) => s.section === section?.id);
  const subjects = sectionSubjects.filter((s) => !subject || s.id === subject);

  return (
    <main className="page courses-page">
      {childId && <KidHud childId={childId} child={child} />}
      {!section && <h1 className="page-title">{t('Курсы')}</h1>}

      {!section ? (
        <section className="course-sections">
          <div className="big-sections">
            {SECTIONS.map((sec) => {
              const icon = SUBJECTS.find((x) => x.section === sec.id)?.id ?? 'spirit';
              const body = (
                <>
                  <span className="bs-icon">
                    <SubjectIcon subject={icon} size={64} />
                  </span>
                  <h3>{t(sec.name)}</h3>
                </>
              );
              return sec.articlesOnly ? (
                <Link key={sec.id} to={`/sections/${sec.id}`} className="big-section" style={{ ['--c' as string]: sec.color }}>
                  {body}
                </Link>
              ) : (
                <button key={sec.id} className="big-section" style={{ ['--c' as string]: sec.color }} onClick={() => openSection(sec.id)}>
                  {body}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <div className="section-bar" style={{ ['--c' as string]: section.color }}>
            <button className="btn btn-light" onClick={() => openSection('')}>
              ← {t('Все разделы')}
            </button>
            <h2>{t(section.name)}</h2>
          </div>

          {sectionSubjects.length > 1 && !subject && (
            <section className="courses-directions">
              <h2 className="track-title">{t('Направления')}</h2>
              <div className="subject-cards">
                {sectionSubjects.map((s) => (
                  <SubjectCard
                    key={s.id}
                    subject={s.id}
                    onMore={() => {
                      setSubject(s.id);
                      setTimeout(
                        () =>
                          document.getElementById('course-filters')?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          }),
                        30,
                      );
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="filters course-filters" id="course-filters">
            {sectionSubjects.length > 1 && (
              <div className="chips-row">
                <button className={subject === '' ? 'fchip on' : 'fchip'} onClick={() => setSubject('')}>
                  {t('Все направления')}
                </button>
                {sectionSubjects.map((s) => (
                  <button key={s.id} className={subject === s.id ? 'fchip on' : 'fchip'} onClick={() => setSubject(s.id)}>
                    {t(s.name)}
                  </button>
                ))}
              </div>
            )}
            {section.id === 'coding' && (
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
            )}
          </div>

          {subjects.map((s) => {
            const list = COURSES.filter((c) => c.subject === s.id && (!level || c.level === level));
            if (!list.length) return null;
            return (
              <section key={s.id} className="track">
                {sectionSubjects.length > 1 && (
                  <h2 className="track-title">
                    <span className="track-icon" style={{ background: list[0].color }}>
                      <SubjectIcon subject={s.id} size={28} />
                    </span>
                    {t(s.name)}
                  </h2>
                )}
                <div className="track-row">
                  {list.map((c) => (
                    <CourseCard key={c.id} course={c} to={`${base}/${c.id}`} done={childId ? done(c.id) : undefined} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}

import { findLesson, getCourse, SECTIONS, SUBJECTS, type Course } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Booking, type Child, type ChildReport } from '../api';
import { BookingCard } from '../components/BookingCard';
import { LevelBadge } from '../components/CourseCard';
import { StarIcon } from '../components/Icons';
import { Sprite } from '../components/Sprite';
import { StarsChart } from '../components/StarsChart';
import { avatarSvg, COIN } from '../game/sprites';
import { relativeDays } from '../format';
import { useTc } from '../content';
import { useT } from '../i18n';

type DoneLesson = ChildReport['lessons'][number] & { title: string };

/** Finished lessons grouped by course, the most recently studied course first. */
function groupLessons(list: ChildReport['lessons']): { course: Course; lessons: DoneLesson[] }[] {
  const groups = new Map<string, { course: Course; lessons: DoneLesson[] }>();
  for (const l of list) {
    const found = findLesson(l.lessonId);
    if (!found) continue;
    const g = groups.get(found.course.id) ?? { course: found.course, lessons: [] };
    g.lessons.push({ ...l, title: found.lesson.title });
    groups.set(found.course.id, g);
  }
  return [...groups.values()];
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(document.documentElement.lang || 'ru', { day: 'numeric', month: 'short' });

export function ParentDashboard() {
  const t = useT();
  const tc = useTc();
  const [kids, setKids] = useState<Child[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [report, setReport] = useState<ChildReport | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .children()
      .then((r) => {
        setKids(r.children);
        setActive(r.children[0]?.id ?? null);
      })
      .catch((e) => setError(e.message));
    api.bookings().then((r) => setBookings(r.bookings)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    setReport(null);
    api.report(active).then(setReport).catch((e) => setError(e.message));
  }, [active]);

  if (!kids) return <div className="center-note">{error ?? t('Загружаем…')}</div>;
  if (kids.length === 0) {
    return (
      <main className="page">
        <div className="empty card">
          <h1>{t('Добавьте профиль ребёнка')}</h1>
          <p className="muted">{t('Здесь появится прогресс, как только ребёнок начнёт играть.')}</p>
          <Link to="/kids" className="btn btn-primary">
            {t('Добавить игрока')}
          </Link>
        </div>
      </main>
    );
  }

  const upcoming = bookings.filter(
    (b) => (b.status === 'scheduled' || b.status === 'cancelled') && new Date(b.startsAt).getTime() > Date.now() - 3_600_000,
  );
  const hasTrial = bookings.some((b) => b.isTrial && b.status !== 'cancelled');

  return (
    <main className="page dash">
      <div className="dash-head">
        <div>
          <h1 className="page-title left">{t('Кабинет родителя')}</h1>
          <p className="muted">{t('Что ребёнок уже умеет и что дальше.')}</p>
        </div>
        <div className="tabs" role="tablist">
          {kids.map((k) => (
            <button key={k.id} role="tab" aria-selected={k.id === active} className={k.id === active ? 'tab on' : 'tab'} onClick={() => setActive(k.id)}>
              <Sprite svg={avatarSvg(k.avatarUrl)} size={30} /> {k.nickname}
            </button>
          ))}
        </div>
      </div>

      <section className="lessons">
        <h2 className="card-title">{t('Ближайшие уроки')}</h2>
        {upcoming.length === 0 ? (
          <p className="muted">{t('Уроков пока нет.')}</p>
        ) : (
          <div className="booking-list">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} viewer="parent" onChange={(nb) => setBookings((all) => all.map((x) => (x.id === nb.id ? nb : x)))} />
            ))}
          </div>
        )}
      </section>

      {!report ? (
        <div className="center-note">{t('Загружаем отчёт…')}</div>
      ) : (
        <>

          <div className="tiles">
            <div className="tile">
              <span className="tile-label">{t('Пройдено уровней')}</span>
              <b>
                {report.totals.completed}
                <small> / {report.totals.levels}</small>
              </b>
            </div>
            <div className="tile">
              <span className="tile-label">{t('Звёзды')}</span>
              <b>
                <StarIcon on size={26} /> {report.totals.stars}
                <small> / {report.totals.levels * 3}</small>
              </b>
            </div>
            <div className="tile">
              <span className="tile-label">{t('Опыт и монеты')}</span>
              <b>
                {report.child.xp} XP <Sprite svg={COIN} size={24} /> {report.child.coins}
              </b>
            </div>
            <div className="tile">
              <span className="tile-label">{t('Последняя игра')}</span>
              <b className="tile-text">{relativeDays(report.lastPlayedAt, t)}</b>
            </div>
          </div>

          <div className="dash-grid">
            <section className="card">
              <h2 className="card-title">{t('Пройденные темы и уроки')}</h2>
              {report.lessons.length === 0 ? (
                <p className="muted">
                  {t('Пока нет пройденных уроков. Когда ребёнок отметит урок прочитанным или сдаст викторину, он появится здесь.')}{' '}
                  <Link to={`/kids/${report.child.id}/courses`}>{t('Открыть курсы')}</Link>
                </p>
              ) : (
                <div className="done-topics">
                  {groupLessons(report.lessons).map(({ course, lessons }) => {
                    const section = SECTIONS.find((x) => x.id === SUBJECTS.find((sub) => sub.id === course.subject)?.section);
                    return (
                      <div key={course.id} className="done-course" style={{ ['--c' as string]: course.color }}>
                        <div className="concept-row">
                          <span>
                            {section && <span className="muted small">{t(section.name)} · </span>}
                            <b>{tc(course.title)}</b>
                          </span>
                          <b>
                            {lessons.length} / {course.lessons.length}
                          </b>
                        </div>
                        <ul className="done-lessons">
                          {lessons.slice(0, 6).map((l) => (
                            <li key={l.lessonId}>
                              <span className="done-mark">✓</span>
                              <span>{tc(l.title)}</span>
                              {l.max > 0 && <span className="muted small">{l.score}/{l.max}</span>}
                              <span className="muted small">{formatDate(l.completedAt)}</span>
                            </li>
                          ))}
                          {lessons.length > 6 && <li className="muted small">{t('и ещё {n}', { n: lessons.length - 6 })}</li>}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <section className="card">
              <h2 className="card-title">{t('Звёзды по уровням')}</h2>
              <StarsChart levels={report.levels} />
              <p className="muted small chart-note">{t('Три звезды значат, что ребёнок нашёл самое короткое решение. Наведите на столбик, чтобы увидеть уровень.')}</p>
            </section>
          </div>

          {report.baseCourseCompleted && (
            <div className="nudge">
              <Sprite svg={avatarSvg(report.child.avatarUrl)} size={72} className="float" />
              <div>
                <h2>{report.child.nickname} прошёл(а) все базовые уровни!</h2>
                <p>
                  {hasTrial
                    ? t('Самое время продолжить с наставником: Scratch, Python или создание игр.')
                    : t('Запишитесь на бесплатный пробный урок с наставником: он поможет перейти к следующей ступени.')}
                </p>
              </div>
              <Link to={`/tutors?child=${report.child.id}`} className="btn btn-primary btn-xl">
                {hasTrial ? t('Выбрать наставника') : t('Бесплатный урок')}
              </Link>
            </div>
          )}
          {!report.baseCourseCompleted && (
            <div className="soft-cta">
              <span>
                {t('После базовых уровней мы предложим бесплатный урок с наставником. А можно выбрать наставника уже сейчас.')}
              </span>
              <Link to={`/tutors?child=${report.child.id}`} className="btn btn-light">
                {t('Наставники')}
              </Link>
            </div>
          )}

          <section className="card dash-courses">
            <div className="concept-row">
              <h2 className="card-title">{t('Курсы')}</h2>
              <Link to={`/kids/${report.child.id}/courses`} className="btn btn-light">
                {t('Открыть курсы')}
              </Link>
            </div>
            {report.courses.length === 0 ? (
              <p className="muted">
                {report.child.nickname} ещё не начинал(а) курсы. В них теория, задания и викторины по Scratch, Roblox, Python, Unity, сайтам
                и логике на трёх уровнях сложности.
              </p>
            ) : (
              <div className="concepts">
                {report.courses.map((c) => {
                  const pct = Math.round((c.completed / c.lessons) * 100);
                  return (
                    <div key={c.courseId} className="concept">
                      <div className="concept-row">
                        <span>
                          <b>{tc(c.title)}</b> <LevelBadge level={c.level} />
                        </span>
                        <b>
                          {c.completed} / {c.lessons}
                        </b>
                      </div>
                      <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={c.title}>
                        <i style={{ width: `${pct}%`, background: getCourse(c.courseId)?.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>


        </>
      )}

    </main>
  );
}

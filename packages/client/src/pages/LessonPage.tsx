import { findLesson, gradeLesson, normalizeText, LESSON_PASS_RATIO, type Answer, type Answers, type Lesson, type LessonPart, type Question } from '@kidsland/shared';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Confetti } from '../components/Confetti';
import { Homework } from '../components/Homework';
import { Workspace, workspaceFor } from '../components/interactive/workspace';
import { KidHud } from '../components/KidHud';
import { QuestionView, shuffled } from '../components/QuestionView';
import { Sprite } from '../components/Sprite';
import { coursesBase } from '../courses/meta';
import { useCourseProgress } from '../courses/useChild';
import { COIN, HERO } from '../game/sprites';
import { useLang } from '../i18n';
import { ChessBoard } from '../components/ChessBoard';
import { Dialog, ReadingText, WordsListen } from '../components/LessonExtras';
import { lessonCopybook, lessonScene } from '../components/interactive';
import { musicDiagrams, musicSectionPicture } from '../components/music';
import { useLocal, useTc } from '../content';
import { CHESS_DIAGRAMS } from '../content/chess';
import { cardPic, lessonPic, Pic } from '../pics';

type Tab = 'theory' | LessonPart | 'homework';

const freshAnswers = (questions: Question[]): Answers =>
  Object.fromEntries(questions.filter((q) => q.kind === 'order').map((q) => [q.id, shuffled(q.kind === 'order' ? q.items : [], q.id)]));

interface Outcome {
  score: number;
  max: number;
  passed: boolean;
  results: Record<string, boolean>;
  rewards?: { xp: number; coins: number };
}

/**
 * Answers are kept against the original (Russian) lesson so the server grades them as usual;
 * a typed answer that matches a translated one is swapped for the original.
 */
function canonical(orig: Lesson, shown: Lesson, answers: Answers): Answers {
  const out: Answers = { ...answers };
  for (const q of [...shown.practice, ...shown.quiz]) {
    const a = answers[q.id];
    if (q.kind !== 'text' || typeof a !== 'string' || !q.answer.some((x) => normalizeText(x) === normalizeText(a))) continue;
    const o = [...orig.practice, ...orig.quiz].find((x) => x.id === q.id);
    if (o?.kind === 'text') out[q.id] = o.answer[0];
  }
  return out;
}

const isAnswered = (a: Answer | undefined) => a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);

export function LessonPage() {
  const { childId, courseId = '', lessonId = '' } = useParams();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const found = findLesson(lessonId);
  const { child, setChild, progress } = useCourseProgress(childId);
  const [tab, setTab] = useState<Tab>('theory');
  const [answers, setAnswers] = useState<Answers>({});
  const [outcomes, setOutcomes] = useState<Partial<Record<LessonPart, Outcome>>>({});
  const [readLocally, setReadLocally] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const view = useLocal(found);
  const tc = useTc();

  useEffect(() => {
    if (found) setAnswers(freshAnswers([...found.lesson.practice, ...found.lesson.quiz]));
    setOutcomes({});
    setReadLocally(false);
    setTab('theory');
    setError(null);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const base = coursesBase(childId);
  if (!found || found.course.id !== courseId) return <Navigate to={base} replace />;
  const { course, lesson, index } = found;
  // Texts in the interface language; ids, grading and pictures use the original lesson.
  const shown = view ?? found;
  const diagrams = course.subject === 'chess' ? (CHESS_DIAGRAMS[lesson.title] ?? []) : [];
  const music = musicDiagrams(course, lesson.title, tc);
  const nextLesson = course.lessons[index + 1];
  const done = readLocally || Boolean(progress?.find((p) => p.lessonId === lesson.id)?.completed);

  const open = (next: Tab) => {
    setTab(next);
    setError(null);
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const markRead = async () => {
    setBusy(true);
    setError(null);
    try {
      if (childId) await api.completeLesson(childId, lesson.id);
      setReadLocally(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    } finally {
      setBusy(false);
    }
  };

  const check = async (part: LessonPart) => {
    setBusy(true);
    setError(null);
    try {
      if (childId) {
        const r = await api.submitLesson(childId, lesson.id, canonical(lesson, shown.lesson, answers), part);
        setOutcomes((o) => ({ ...o, [part]: r }));
        setChild((c) => (c ? { ...c, xp: r.child.xp, coins: r.child.coins } : c));
      } else {
        setOutcomes((o) => ({ ...o, [part]: gradeLesson(lesson, canonical(lesson, shown.lesson, answers), part) }));
      }
      if (gradeLesson(lesson, canonical(lesson, shown.lesson, answers), part).passed) setReadLocally(true);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    } finally {
      setBusy(false);
    }
  };

  const retry = (part: LessonPart) => {
    setAnswers((a) => ({ ...a, ...freshAnswers(lesson[part]) }));
    setAnswers((a) => Object.fromEntries(Object.entries(a).filter(([id]) => !lesson[part].some((q) => q.id === id && q.kind !== 'order'))));
    setOutcomes((o) => ({ ...o, [part]: undefined }));
    open(part);
  };

  const set = (id: string) => (a: Answer) => setAnswers((x) => ({ ...x, [id]: a }));

  const nextLink = nextLesson ? (
    <Link to={`${base}/${course.id}/${nextLesson.id}`} className="btn btn-primary">
      {t('Следующий урок')} →
    </Link>
  ) : (
    <Link to={`${base}/${course.id}`} className="btn btn-primary">
      {t('К курсу')}
    </Link>
  );

  const partView = (part: LessonPart) => {
    const questions = shown.lesson[part];
    const outcome = outcomes[part];
    const answered = questions.filter((q) => isAnswered(answers[q.id])).length;
    return (
      <section className="lesson-part">
        <p className="muted part-intro">
          {part === 'practice'
            ? t('Задания помогают закрепить теорию. Они необязательные, но за первый зачёт дают награду.')
            : t('Викторина проверяет, что ты запомнил(а). Она необязательная, но за первый зачёт дают награду.')}
        </p>
        {questions.map((q, i) => (
          <QuestionView key={q.id} q={q} orig={lesson[part][i]} n={i + 1} value={answers[q.id]} onChange={set(q.id)} result={outcome?.results[q.id]} />
        ))}
        {!outcome ? (
          <div className="check-bar">
            <span className="muted">
              {t('Отвечено {a} из {n}. Для зачёта нужно {need} верных.', {
                a: answered,
                n: questions.length,
                need: Math.ceil(questions.length * LESSON_PASS_RATIO),
              })}
            </span>
            <button className="btn btn-go btn-xl" onClick={() => check(part)} disabled={busy || answered === 0}>
              {busy ? t('Проверяем…') : t('Проверить ответы')}
            </button>
          </div>
        ) : (
          <div ref={resultRef} className={`result-card ${outcome.passed ? 'pass' : 'fail'}`}>
            {outcome.passed && <Confetti />}
            <Sprite svg={HERO.robot(outcome.passed ? 'down' : 'left')} size={92} className={outcome.passed ? 'pop-in' : 'wobble'} />
            <div className="rc-text">
              <h2>
                {outcome.passed ? (part === 'practice' ? t('Задания выполнены!') : t('Викторина пройдена!')) : t('Почти получилось!')}
              </h2>
              <p>
                {t('Верно {s} из {m}.', { s: outcome.score, m: outcome.max })}{' '}
                {outcome.passed ? t('Отличная работа.') : t('Посмотри подсказки под заданиями и попробуй ещё раз.')}
              </p>
              {outcome.rewards && (outcome.rewards.xp > 0 || outcome.rewards.coins > 0) && (
                <div className="rewards">
                  <span className="chip chip-xp">+{outcome.rewards.xp} XP</span>
                  <span className="chip chip-coin">
                    <Sprite svg={COIN} size={20} /> +{outcome.rewards.coins}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-light" onClick={() => retry(part)}>
                {t('Пройти заново')}
              </button>
              {part === 'practice' && (
                <button className="btn btn-light" onClick={() => open('quiz')}>
                  {t('К викторине')}
                </button>
              )}
              {outcome.passed && (
                <button className="btn btn-go" onClick={() => open('homework')}>
                  📝 {t('Домашнее задание')}
                </button>
              )}
              {outcome.passed && nextLink}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="page lesson-page" style={{ ['--c' as string]: course.color }}>
      {childId && <KidHud childId={childId} child={child} />}
      <Link to={`${base}/${course.id}`} className="back-link">
        ← {shown.course.title}
      </Link>
      <header className="lesson-top">
        <span className="lt-step">
          {t('Урок {i} из {n} · {m} мин', { i: index + 1, n: course.lessons.length, m: lesson.minutes })}
        </span>
        <div className="lt-head">
          <h1>{shown.lesson.title}</h1>
          <Pic code={lessonPic(course, lesson.title)} size={120} className="lt-pic" />
        </div>
        <div className="lt-progress" aria-hidden>
          {course.lessons.map((l, i) => (
            <i key={l.id} className={i < index ? 'done' : i === index ? 'on' : ''} />
          ))}
        </div>
      </header>

      {!childId && (
        <div className="soft-cta">
          <span>{t('Это пробный режим: ответы проверяются, но прогресс и награды не сохраняются.')}</span>
          {user?.role === 'parent' ? (
            <Link to="/kids" className="btn btn-light">{t('Выбрать ребёнка')}</Link>
          ) : !user ? (
            <Link to="/register" className="btn btn-light">{t('Зарегистрироваться')}</Link>
          ) : null}
        </div>
      )}

      <div className="tabs lesson-tabs" role="tablist" ref={tabsRef}>
        <button role="tab" aria-selected={tab === 'theory'} className={tab === 'theory' ? 'tab on' : 'tab'} onClick={() => open('theory')}>
          {t('Теория')} {done && <span className="tab-ok">✓</span>}
        </button>
        {lesson.practice.length > 0 && (
          <button role="tab" aria-selected={tab === 'practice'} className={tab === 'practice' ? 'tab on' : 'tab'} onClick={() => open('practice')}>
            {t('Задания')} <span className="tab-n">{lesson.practice.length}</span>
            {outcomes.practice?.passed && <span className="tab-ok">✓</span>}
          </button>
        )}
        <button role="tab" aria-selected={tab === 'quiz'} className={tab === 'quiz' ? 'tab on' : 'tab'} onClick={() => open('quiz')}>
          {t('Викторина')} <span className="tab-n">{lesson.quiz.length}</span>
          {outcomes.quiz?.passed && <span className="tab-ok">✓</span>}
        </button>
        {done && (
          <button role="tab" aria-selected={tab === 'homework'} className={tab === 'homework' ? 'tab on' : 'tab'} onClick={() => open('homework')}>
            📝 {t('Домашка')}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {tab === 'theory' ? (
        <section className="theory">
          {index === 0 && workspaceFor(course.subject) && (
            <article className="theory-card">
              <Workspace subject={course.subject} tc={tc} />
            </article>
          )}
          {shown.lesson.sections.map((s, i) => {
            const title = lesson.sections[i]?.title;
            const pic = i > 0 && title ? cardPic(course, title) : undefined;
            return (
            <article key={i} className="theory-card">
              {pic && <Pic code={pic} size={72} className="tc-pic" />}
              {s.title && <h3>{s.title}</h3>}
              {s.dialog ? (
                <Dialog lines={s.dialog} lang={s.speak ?? 'en-GB'} />
              ) : s.translation ? (
                <ReadingText text={s.text} translation={s.translation} reading={s.reading} lang={s.speak} />
              ) : (
                s.text && <p>{s.text}</p>
              )}
              {s.speak && !s.dialog && !s.translation && <WordsListen text={s.text} lang={s.speak} />}
              {s.code && <pre className="code">{s.code}</pre>}
              {s.tip && <div className="tip">⭐ {s.tip}</div>}
            {i === 0 && diagrams.length > 0 && (
              <div className="chess-diagrams">
                {diagrams.map((d, k) => (
                  <ChessBoard key={k} {...d} caption={d.caption && tc(d.caption)} />
                ))}
              </div>
            )}
            {i === 0 && music.length > 0 && <div className="music-diagrams">{music.map((d, k) => <Fragment key={k}>{d}</Fragment>)}</div>}
            {(() => {
              const live = musicSectionPicture(course, title, tc) ?? lessonScene(course, lesson.id, title, tc);
              return live && <div className="music-diagrams">{live}</div>;
            })()}
            </article>
            );
          })}
          {(() => {
            const book = lessonCopybook(course, index, tc);
            return book && <article className="theory-card">{book}</article>;
          })()}
          <a
            className="video-card"
            href={`https://www.youtube.com/results?${new URLSearchParams({ search_query: `${shown.lesson.title} ${shown.course.title} ${t('для детей')}`, hl: lang })}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Pic code="1f3ac" size={64} />
            <span>
              <b>{t('Видео по теме урока')}</b>
              <small>{t('Откроется YouTube с подборкой видео. Смотрите вместе со взрослым.')}</small>
            </span>
          </a>
          <div className={`read-card${done ? ' done' : ''}`}>
            {done ? (
              <>
                <div>
                  <h2>{t('Урок пройден!')}</h2>
                  <p className="muted">{t('Хочешь закрепить? Выбери задания или викторину. Это по желанию.')}</p>
                </div>
                <div className="modal-actions">
                  {lesson.practice.length > 0 && (
                    <button className="btn btn-light" onClick={() => open('practice')}>
                      {t('Задания')}
                    </button>
                  )}
                  <button className="btn btn-light" onClick={() => open('quiz')}>
                    {t('Викторина')}
                  </button>
                  <button className="btn btn-go" onClick={() => open('homework')}>
                    📝 {t('Домашнее задание')}
                  </button>
                  {nextLink}
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2>{t('Прочитал(а) теорию?')}</h2>
                  <p className="muted">{t('Отметь урок, и откроется следующий. Задания и викторина по желанию.')}</p>
                </div>
                <button className="btn btn-go btn-xl" onClick={markRead} disabled={busy}>
                  {t('Я прочитал(а) урок')} ✓
                </button>
              </>
            )}
          </div>
        </section>
      ) : tab === 'homework' ? (
        <Homework course={course} shownCourse={shown.course} index={index} childId={childId} onBonus={(bonus) => setChild((c) => (c ? { ...c, bonus } : c))} />
      ) : (
        partView(tab)
      )}
    </main>
  );
}

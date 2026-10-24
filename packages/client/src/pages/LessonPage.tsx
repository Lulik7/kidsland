import { findLesson, gradeLesson, LESSON_PASS_RATIO, type Answer, type Answers, type Lesson } from '@kidsland/shared';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Confetti } from '../components/Confetti';
import { KidHud } from '../components/KidHud';
import { QuestionView, shuffled } from '../components/QuestionView';
import { Sprite } from '../components/Sprite';
import { coursesBase } from '../courses/meta';
import { useCourseProgress } from '../courses/useChild';
import { COIN, HERO } from '../game/sprites';

const freshAnswers = (lesson: Lesson): Answers =>
  Object.fromEntries(
    [...lesson.practice, ...lesson.quiz].filter((q) => q.kind === 'order').map((q) => [q.id, shuffled(q.kind === 'order' ? q.items : [], q.id)]),
  );

interface Outcome {
  score: number;
  max: number;
  passed: boolean;
  results: Record<string, boolean>;
  rewards?: { xp: number; coins: number };
}

export function LessonPage() {
  const { childId, courseId = '', lessonId = '' } = useParams();
  const { user } = useAuth();
  const found = findLesson(lessonId);
  const { child, setChild } = useCourseProgress(childId);
  const [answers, setAnswers] = useState<Answers>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (found) setAnswers(freshAnswers(found.lesson));
    setOutcome(null);
    setError(null);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const base = coursesBase(childId);
  if (!found || found.course.id !== courseId) return <Navigate to={base} replace />;
  const { course, lesson, index } = found;
  const nextLesson = course.lessons[index + 1];
  const questions = [...lesson.practice, ...lesson.quiz];
  const answered = questions.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
  }).length;

  const set = (id: string) => (a: Answer) => setAnswers((x) => ({ ...x, [id]: a }));

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      if (childId) {
        const r = await api.submitLesson(childId, lesson.id, answers);
        setOutcome(r);
        setChild((c) => (c ? { ...c, xp: r.child.xp, coins: r.child.coins } : c));
      } else {
        setOutcome(gradeLesson(lesson, answers));
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const retry = () => {
    setAnswers(freshAnswers(lesson));
    setOutcome(null);
    window.scrollTo({ top: document.getElementById('practice')?.offsetTop ?? 0, behavior: 'smooth' });
  };

  let n = 0;
  const block = (list: typeof questions) =>
    list.map((q) => (
      <QuestionView key={q.id} q={q} n={++n} value={answers[q.id]} onChange={set(q.id)} result={outcome?.results[q.id]} />
    ));

  return (
    <main className="page lesson-page" style={{ ['--c' as string]: course.color }}>
      {childId && <KidHud childId={childId} child={child} />}
      <Link to={`${base}/${course.id}`} className="back-link">
        ← {course.title}
      </Link>
      <header className="lesson-top">
        <span className="lt-step">
          Урок {index + 1} из {course.lessons.length} · {lesson.minutes} мин
        </span>
        <h1>{lesson.title}</h1>
        <div className="lt-progress" aria-hidden>
          {course.lessons.map((l, i) => (
            <i key={l.id} className={i < index ? 'done' : i === index ? 'on' : ''} />
          ))}
        </div>
      </header>

      {!childId && (
        <div className="soft-cta">
          <span>Это пробный режим: ответы проверяются, но прогресс и награды не сохраняются.</span>
          {user?.role === 'parent' ? (
            <Link to="/kids" className="btn btn-light">Выбрать ребёнка</Link>
          ) : !user ? (
            <Link to="/register" className="btn btn-light">Зарегистрироваться</Link>
          ) : null}
        </div>
      )}

      <section className="theory">
        <h2 className="lp-h">📖 Теория</h2>
        {lesson.sections.map((s, i) => (
          <article key={i} className="theory-card">
            {s.title && <h3>{s.title}</h3>}
            <p>{s.text}</p>
            {s.code && <pre className="code">{s.code}</pre>}
            {s.tip && <div className="tip">⭐ {s.tip}</div>}
          </article>
        ))}
      </section>

      <section id="practice">
        <h2 className="lp-h">🛠 Задания</h2>
        {block(lesson.practice)}
      </section>

      <section>
        <h2 className="lp-h">❓ Викторина</h2>
        {block(lesson.quiz)}
      </section>

      {error && <div className="error">{error}</div>}

      {!outcome ? (
        <div className="check-bar">
          <span className="muted">
            Отвечено {answered} из {questions.length}. Для зачёта нужно {Math.ceil(questions.length * LESSON_PASS_RATIO)} верных.
          </span>
          <button className="btn btn-go btn-xl" onClick={check} disabled={busy || answered === 0}>
            {busy ? 'Проверяем…' : 'Проверить ответы'}
          </button>
        </div>
      ) : (
        <div ref={resultRef} className={`result-card ${outcome.passed ? 'pass' : 'fail'}`}>
          {outcome.passed && <Confetti />}
          <Sprite svg={HERO.robot(outcome.passed ? 'down' : 'left')} size={92} className={outcome.passed ? 'pop-in' : 'wobble'} />
          <div className="rc-text">
            <h2>{outcome.passed ? 'Урок пройден!' : 'Почти получилось!'}</h2>
            <p>
              Верно {outcome.score} из {outcome.max}.{' '}
              {outcome.passed ? 'Отличная работа.' : 'Посмотри подсказки под заданиями и попробуй ещё раз.'}
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
            <button className="btn btn-light" onClick={retry}>
              Пройти заново
            </button>
            {outcome.passed && nextLesson ? (
              <Link to={`${base}/${course.id}/${nextLesson.id}`} className="btn btn-primary">
                Следующий урок →
              </Link>
            ) : outcome.passed ? (
              <Link to={`${base}/${course.id}`} className="btn btn-primary">
                К курсу
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}

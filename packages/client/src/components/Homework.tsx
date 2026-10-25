import { BONUS_DISCOUNT, BONUS_FOR_DISCOUNT, BONUS_PER_ANSWER, gradeQuestions, homeworkFor, normalizeText, type Answer, type Answers, type Course } from '@kidsland/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type HomeworkResult } from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';
import { Confetti } from './Confetti';
import { QuestionView } from './QuestionView';

/**
 * Homework after a lesson: a few questions about it and the lessons before, done alone at home.
 * After checking, the right answers are shown. Each answer that is right for the first time gives bonuses.
 */
export function Homework({ course, shownCourse, index, childId, onBonus }: { course: Course; shownCourse: Course; index: number; childId?: string; onBonus?: (bonus: number) => void }) {
  const t = useT();
  const { user } = useAuth();
  const questions = useMemo(() => homeworkFor(course, index), [course, index]);
  const shown = useMemo(() => homeworkFor(shownCourse, index), [shownCourse, index]);
  const lessonId = course.lessons[index].id;
  const [answers, setAnswers] = useState<Answers>({});
  const [outcome, setOutcome] = useState<(Omit<HomeworkResult, 'earned' | 'bonus'> & Partial<HomeworkResult>) | null>(null);
  const [bonus, setBonus] = useState<number | null>(null);
  const [before, setBefore] = useState<{ earned: number; attempts: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnswers({});
    setOutcome(null);
    if (childId)
      api
        .homework(childId, lessonId)
        .then((h) => {
          setBonus(h.bonus);
          setBefore({ earned: h.earned, attempts: h.attempts });
        })
        .catch(() => undefined);
  }, [childId, lessonId]);

  if (!questions.length) return null;

  // A typed answer that matches the translated one is sent as the original, as in the lesson itself.
  const canonical = (): Answers => {
    const out: Answers = { ...answers };
    shown.forEach((q, i) => {
      const o = questions[i];
      const a = answers[q.id];
      if (q.kind === 'text' && o?.kind === 'text' && typeof a === 'string' && q.answer.some((x) => normalizeText(x) === normalizeText(a))) out[q.id] = o.answer[0];
    });
    return out;
  };

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      if (childId) {
        const r = await api.submitHomework(childId, lessonId, canonical());
        setOutcome(r);
        setBonus(r.bonus);
        onBonus?.(r.bonus);
      } else {
        setOutcome(gradeQuestions(questions, canonical()));
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    } finally {
      setBusy(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setOutcome(null);
  };

  const answered = shown.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
  }).length;
  const progress = bonus === null ? 0 : Math.min(100, Math.round(((bonus % BONUS_FOR_DISCOUNT) / BONUS_FOR_DISCOUNT) * 100));

  return (
    <section className="lesson-part homework">
      <div className="hw-head">
        <div>
          <h2>📝 {t('Домашнее задание')}</h2>
          <p className="muted">
            {t('Сделай сам, без подсказок. За каждый верный ответ +{n} бонусов. {b} бонусов = скидка {d}% на урок с любым наставником.', {
              n: BONUS_PER_ANSWER,
              b: BONUS_FOR_DISCOUNT,
              d: BONUS_DISCOUNT,
            })}
          </p>
        </div>
        {bonus !== null && (
          <div className="hw-bonus" title={t('Бонусы')}>
            <b>🎁 {bonus}</b>
            <span className="hw-bar">
              <i style={{ width: `${bonus >= BONUS_FOR_DISCOUNT ? 100 : progress}%` }} />
            </span>
            <small>
              {bonus >= BONUS_FOR_DISCOUNT ? t('Можно взять урок со скидкой!') : t('ещё {n} до скидки', { n: BONUS_FOR_DISCOUNT - bonus })}
            </small>
          </div>
        )}
      </div>
      {before && before.attempts > 0 && !outcome && (
        <p className="small muted">{t('Ты уже делал(а) это задание и получил(а) {n} бонусов. Можно ещё раз: бонусы дадут только за новые верные ответы.', { n: before.earned })}</p>
      )}
      {!childId && <p className="small muted">{t('Бонусы копятся, когда ребёнок занимается в своём профиле.')}</p>}
      {error && <div className="error">{error}</div>}
      {shown.map((q, i) => (
        <QuestionView
          key={`${lessonId}-${q.id}`}
          q={q}
          orig={questions[i]}
          n={i + 1}
          value={answers[q.id]}
          onChange={(a: Answer) => setAnswers((x) => ({ ...x, [q.id]: a }))}
          result={outcome?.results[q.id]}
        />
      ))}
      {!outcome ? (
        <div className="check-bar">
          <span className="muted">{t('Отвечено {a} из {n}.', { a: answered, n: shown.length })}</span>
          <button className="btn btn-go btn-xl" onClick={check} disabled={busy || answered === 0}>
            {busy ? t('Проверяем…') : t('Проверить и показать ответы')}
          </button>
        </div>
      ) : (
        <div ref={resultRef} className={`result-card ${outcome.passed ? 'pass' : 'fail'}`}>
          {outcome.passed && <Confetti />}
          <div className="rc-text">
            <h2>{outcome.score === outcome.max ? t('Всё верно!') : t('Верно {s} из {m}.', { s: outcome.score, m: outcome.max })}</h2>
            <p>{t('Правильные ответы отмечены зелёным. Посмотри, где ошибся(лась), и попробуй ещё раз.')}</p>
            {outcome.earned !== undefined && (
              <div className="rewards">
                <span className="chip chip-coin">🎁 +{outcome.earned} {t('бонусов')}</span>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={retry}>
              {t('Сделать ещё раз')}
            </button>
            {user?.role === 'parent' && bonus !== null && bonus >= BONUS_FOR_DISCOUNT && (
              <Link to="/billing" className="btn btn-primary">
                {t('Взять урок со скидкой {d}%', { d: BONUS_DISCOUNT })}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

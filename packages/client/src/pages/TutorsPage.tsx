import { LANGUAGES, SUBJECTS } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Tutor } from '../api';
import { TutorCard } from '../components/TutorCard';

const AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14];

export function TutorsPage() {
  const [params, setParams] = useSearchParams();
  const [tutors, setTutors] = useState<Tutor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subject = params.get('subject') ?? '';
  const language = params.get('language') ?? '';
  const age = params.get('age') ?? '';
  const sort = params.get('sort') ?? 'rating';
  const childId = params.get('child');

  useEffect(() => {
    setTutors(null);
    api
      .tutors({ subject, language, age: age ? Number(age) : undefined, sort })
      .then((r) => setTutors(r.tutors))
      .catch((e) => setError(e.message));
  }, [subject, language, age, sort]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <main className="page tutors-page">
      <section className="tutors-hero">
        <div>
          <span className="pill pill-dark">Наставники Kidsland</span>
          <h1>Живые уроки программирования один на один</h1>
          <p>Первый урок бесплатно. Наставник продолжит с того места, где ребёнок остановился в игре.</p>
        </div>
      </section>

      <div className="filters">
        <div className="chips-row" role="group" aria-label="Предмет">
          <button className={!subject ? 'fchip on' : 'fchip'} onClick={() => set('subject', '')}>
            Все предметы
          </button>
          {SUBJECTS.map((s) => (
            <button key={s.id} className={subject === s.id ? 'fchip on' : 'fchip'} onClick={() => set('subject', s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="selects">
          <label>
            Возраст
            <select value={age} onChange={(e) => set('age', e.target.value)}>
              <option value="">Любой</option>
              {AGES.map((a) => (
                <option key={a} value={a}>
                  {a} лет
                </option>
              ))}
            </select>
          </label>
          <label>
            Язык
            <select value={language} onChange={(e) => set('language', e.target.value)}>
              <option value="">Любой</option>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Сортировка
            <select value={sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="rating">По рейтингу</option>
              <option value="soonest">Ближайшее время</option>
              <option value="price">Сначала дешевле</option>
            </select>
          </label>
        </div>
      </div>

      {!tutors ? (
        <div className="center-note">{error ?? 'Ищем наставников…'}</div>
      ) : tutors.length === 0 ? (
        <div className="center-note">
          Под эти фильтры никого нет.{' '}
          <button className="btn btn-light" onClick={() => setParams(childId ? { child: childId } : {})}>
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="tutor-grid">
          {tutors.map((t) => (
            <TutorCard key={t.id} tutor={t} childId={childId} />
          ))}
        </div>
      )}
    </main>
  );
}

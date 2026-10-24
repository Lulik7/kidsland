import { LANGUAGES, SUBJECTS } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Tutor } from '../api';
import { TutorCard } from '../components/TutorCard';
import { useT } from '../i18n';

const AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14];

export function TutorsPage() {
  const t = useT();
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
          <span className="pill pill-dark">{t('Наставники Kidsland')}</span>
          <h1>{t('Живые уроки программирования один на один')}</h1>
          <p>{t('Первый урок бесплатно. Наставник продолжит с того места, где ребёнок остановился в игре.')}</p>
        </div>
      </section>

      <div className="filters">
        <div className="chips-row" role="group" aria-label={t('Предмет')}>
          <button className={!subject ? 'fchip on' : 'fchip'} onClick={() => set('subject', '')}>
            {t('Все предметы')}
          </button>
          {SUBJECTS.map((s) => (
            <button key={s.id} className={subject === s.id ? 'fchip on' : 'fchip'} onClick={() => set('subject', s.id)}>
              {t(s.name)}
            </button>
          ))}
        </div>
        <div className="selects">
          <label>
            {t('Возраст')}
            <select value={age} onChange={(e) => set('age', e.target.value)}>
              <option value="">{t('Любой')}</option>
              {AGES.map((a) => (
                <option key={a} value={a}>
                  {a}{' '}{t('лет')}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Язык')}
            <select value={language} onChange={(e) => set('language', e.target.value)}>
              <option value="">{t('Любой')}</option>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {t(l.name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Сортировка')}
            <select value={sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="rating">{t('По рейтингу')}</option>
              <option value="soonest">{t('Ближайшее время')}</option>
              <option value="price">{t('Сначала дешевле')}</option>
            </select>
          </label>
        </div>
      </div>

      {!tutors ? (
        <div className="center-note">{error ?? t('Ищем наставников…')}</div>
      ) : tutors.length === 0 ? (
        <div className="center-note">
          {t('Под эти фильтры никого нет.')}{' '}
          <button className="btn btn-light" onClick={() => setParams(childId ? { child: childId } : {})}>
            {t('Сбросить фильтры')}
          </button>
        </div>
      ) : (
        <div className="tutor-grid">
          {tutors.map((tu) => (
            <TutorCard key={tu.id} tutor={tu} childId={childId} />
          ))}
        </div>
      )}
    </main>
  );
}

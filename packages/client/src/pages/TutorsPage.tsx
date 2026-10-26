import { WcBranch } from '../components/Watercolor';
import { findSection, TOPICS, TUTOR_SECTIONS } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Tutor } from '../api';
import { TutorCard } from '../components/TutorCard';
import { countryName, money } from '../format';
import { useT } from '../i18n';

const AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14];

export function TutorsPage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const [tutors, setTutors] = useState<Tutor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subject = params.get('subject') ?? '';
  const asked = params.get('section') ?? '';
  const section = (TUTOR_SECTIONS.some((x) => x.id === asked) && asked) || TUTOR_SECTIONS.find((x) => x.topics.some((tp) => tp.id === subject))?.id || '';
  const topics = findSection(section)?.topics ?? [];
  // The language filter was removed from the page; links with ?language= still filter.
  const language = params.get('language') ?? '';
  const age = params.get('age') ?? '';
  const country = params.get('country') ?? '';
  const maxPrice = Number(params.get('price')) || 0;
  const childId = params.get('child');

  useEffect(() => {
    setTutors(null);
    api
      .tutors({ subject, section: subject ? undefined : section, language, age: age ? Number(age) : undefined })
      .then((r) => setTutors(r.tutors))
      .catch((e) => setError(e.message));
  }, [subject, section, language, age]);

  // Country and price narrow the loaded list, so their choices always match the tutors of this topic.
  const countries = [...new Set((tutors ?? []).map((x) => x.country).filter((c): c is string => !!c))].sort((a, b) =>
    countryName(a).localeCompare(countryName(b)),
  );
  const prices = (tutors ?? []).map((x) => x.price);
  const lo = prices.length ? Math.min(...prices) : 0;
  const hi = prices.length ? Math.max(...prices) : 0;
  const limit = maxPrice && maxPrice < hi ? maxPrice : hi;
  const shown = (tutors ?? []).filter((x) => (!country || x.country === country) && x.price <= limit);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (key === 'section') next.delete('subject');
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <main className="page tutors-page">
      <section className="tutors-hero">
      <WcBranch className="banner-branch" size={190} />
        <div>
          <span className="pill pill-dark">{t('Наставники Kidsland')}</span>
          <h1>{t('Живые уроки один на один')}</h1>
          <p>{t('Программирование, наука, музыка, рисование, языки и другие разделы. Пробный урок со скидкой 50%.')}</p>
        </div>
      </section>

      <div className="filters">
        <div className="chips-row" role="group" aria-label={t('Раздел')}>
          <button className={!section ? 'fchip on' : 'fchip'} onClick={() => set('section', '')}>
            {t('Все разделы')}
          </button>
          {TUTOR_SECTIONS.map((x) => (
            <button key={x.id} className={section === x.id ? 'fchip on' : 'fchip'} onClick={() => set('section', x.id)}>
              {t(x.name)}
            </button>
          ))}
        </div>
        {topics.length > 0 && (
          <div className="chips-row topic-row" role="group" aria-label={t('Тема')}>
            <button className={!subject ? 'fchip on' : 'fchip'} onClick={() => set('subject', '')}>
              {t('Все темы')}
            </button>
            {topics.map((tp) => (
              <button
                key={tp.id}
                className={subject === tp.id ? 'fchip on' : 'fchip'}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('section', section);
                  next.set('subject', tp.id);
                  setParams(next, { replace: true });
                }}
              >
                {t(tp.name)}
              </button>
            ))}
          </div>
        )}
        {subject && !topics.length && <p className="muted">{t(TOPICS.find((x) => x.id === subject)?.name ?? subject)}</p>}
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
          {countries.length > 0 && (
            <label>
              {t('Страна наставника')}
              <select value={country} onChange={(e) => set('country', e.target.value)}>
                <option value="">{t('Любая')}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {hi > lo && (
            <label className="price-range">
              {t('Цена урока')}: {t('до')} <b>{money(limit)}</b>
              <input
                type="range"
                min={lo}
                max={hi}
                step={5}
                value={limit}
                onChange={(e) => set('price', Number(e.target.value) >= hi ? '' : e.target.value)}
              />
            </label>
          )}
        </div>
      </div>

      {!tutors ? (
        <div className="center-note">{error ?? t('Ищем наставников…')}</div>
      ) : shown.length === 0 ? (
        <div className="center-note">
          {t('Под эти фильтры никого нет.')}{' '}
          <button className="btn btn-light" onClick={() => setParams(childId ? { child: childId } : {})}>
            {t('Сбросить фильтры')}
          </button>
        </div>
      ) : (
        <div className="tutor-grid">
          {shown.map((tu) => (
            <TutorCard key={tu.id} tutor={tu} childId={childId} />
          ))}
        </div>
      )}
    </main>
  );
}

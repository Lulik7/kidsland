import { SECTIONS } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { DemoBoard } from './DemoBoard';
import { SectionArt } from './RobotGuide';

const DELAY = 5000;

/** Hero slideshow: one slide per section, switching every 5 seconds, with a caption under the picture. */
export function HeroCarousel() {
  const t = useT();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setI((n) => (n + 1) % SECTIONS.length), DELAY);
    return () => window.clearTimeout(id);
  }, [i, paused]);
  const sec = SECTIONS[i];

  return (
    <div className="hero-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="window">
        <div className="window-bar">
          <i /><i /><i />
          <span>{sec.id === 'coding' ? t('Уровень «Лестница»') : t(sec.name)}</span>
        </div>
        <div className="hc-stage">
          {SECTIONS.map((s, k) => (
            <div
              key={s.id}
              className={`hc-slide${k === i ? ' on' : ''}${s.id === 'coding' ? ' hc-coding' : ''}`}
              style={{ ['--c' as string]: s.color }}
              aria-hidden={k !== i}
            >
              {s.id === 'coding' ? <DemoBoard /> : k === i && <SectionArt t={t} id={s.id} />}
            </div>
          ))}
        </div>
      </div>
      <div className="hc-caption" key={sec.id} aria-live="polite">
        {sec.id === 'coding' ? (
          <>
            <h2 className="hc-title">
              {t('Учимся программировать,')} <span className="hl">{t('играя')}</span>
            </h2>
            <p>{t('Ребёнок собирает программу из блоков, а ракета, подводная лодка или робот выполняют её. Так в игре осваиваются циклы, условия и алгоритмы.')}</p>
          </>
        ) : (
          <>
            <h2 className="hc-title">
              <Link to={`/sections/${sec.id}`}>{t(sec.name)}</Link>
            </h2>
            <p>{t(sec.description)}</p>
          </>
        )}
      </div>
      <div className="hc-dots" aria-label={t('Разделы Kidsland')}>
        {SECTIONS.map((s, k) => (
          <button
            key={s.id}
            aria-label={t(s.name)}
            aria-current={k === i}
            title={t(s.name)}
            className={k === i ? 'on' : ''}
            style={{ ['--c' as string]: s.color }}
            onClick={() => setI(k)}
          />
        ))}
      </div>
    </div>
  );
}

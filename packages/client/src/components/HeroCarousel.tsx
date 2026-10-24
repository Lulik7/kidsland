import { SECTIONS } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { DemoBoard } from './DemoBoard';
import { SectionScene } from './SectionScene';

const DELAY = 5000;

/** Hero slideshow: one slide per section, switching every 5 seconds, with a caption under the picture. */
export function HeroCarousel() {
  const t = useT();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setI((n) => (n + 1) % SECTIONS.length), DELAY);
    return () => window.clearTimeout(id);
  }, [i]);
  const sec = SECTIONS[i];

  return (
    <div className="hero-carousel">
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
              {s.id === 'coding' ? <DemoBoard /> : <SectionScene id={s.id} />}
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
      <div className="hc-progress" key={`p-${sec.id}`} style={{ ['--c' as string]: sec.color, animationDuration: `${DELAY}ms` }} aria-hidden />
    </div>
  );
}

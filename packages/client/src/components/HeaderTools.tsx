import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LANGS, useLang, useT } from '../i18n';
import { usePrefs, type A11y, type FontScale } from '../prefs';

/** Language switch, light/dark theme switch and the accessibility panel button. */
export function HeaderTools() {
  const { lang, setLang } = useLang();
  const t = useT();
  const [panel, setPanel] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  return (
    <div className="htools">
      <div className="lang-menu">
        <button className="htool" onClick={() => setLangOpen((o) => !o)} aria-expanded={langOpen} aria-label={t('Язык интерфейса')} title={t('Язык интерфейса')}>
          {LANGS.find((l) => l.id === lang)?.label}
        </button>
        {langOpen && (
          <ul className="lang-list" role="menu">
            {LANGS.map((l) => (
              <li key={l.id}>
                <button
                  role="menuitemradio"
                  aria-checked={l.id === lang}
                  className={l.id === lang ? 'on' : ''}
                  onClick={() => {
                    setLang(l.id);
                    setLangOpen(false);
                  }}
                >
                  <b>{l.label}</b> {l.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="htool htool-a11y" onClick={() => setPanel(true)} aria-label={t('Особые возможности')} title={t('Особые возможности')}>
        Aa
      </button>
      {panel && createPortal(<A11yPanel onClose={() => setPanel(false)} />, document.body)}
    </div>
  );
}

function A11yPanel({ onClose }: { onClose: () => void }) {
  const { a11y, setA11y, resetA11y } = usePrefs();
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggles: { key: Exclude<keyof A11y, 'font'>; title: string; hint: string }[] = [
    { key: 'contrast', title: 'Высокий контраст', hint: 'Чёткие чёрно-белые цвета и рамки' },
    { key: 'readable', title: 'Удобный шрифт', hint: 'Шрифт, который легче читать при дислексии' },
    { key: 'spacing', title: 'Больше пространства', hint: 'Шире интервалы между строками и буквами' },
    { key: 'calm', title: 'Без анимаций', hint: 'Ничего не мигает и не двигается' },
    { key: 'links', title: 'Выделить ссылки и кнопки', hint: 'Подчёркнутые ссылки и яркая рамка фокуса' },
    { key: 'speak', title: 'Читать вслух', hint: 'Нажми на текст, и его прочитают вслух' },
  ];
  const fonts: { id: FontScale; label: string }[] = [
    { id: 'normal', label: 'A' },
    { id: 'large', label: 'A+' },
    { id: 'xlarge', label: 'A++' },
  ];

  return (
    <div className="modal-bg a11y-bg" onClick={onClose}>
      <div className="a11y-panel" role="dialog" aria-modal="true" aria-label={t('Особые возможности')} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="a11y-head">
          <h2>{t('Особые возможности')}</h2>
          <button className="htool" onClick={onClose} aria-label={t('Закрыть')}>
            ✕
          </button>
        </div>
        <p className="muted small">{t('Настройки для детей с особенностями зрения, внимания и чтения. Они сохраняются на этом устройстве.')}</p>
        <div className="a11y-row">
          <b>{t('Размер текста')}</b>
          <div className="seg">
            {fonts.map((f) => (
              <button key={f.id} className={a11y.font === f.id ? 'on' : ''} aria-pressed={a11y.font === f.id} onClick={() => setA11y({ font: f.id })}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {toggles.map((o) => (
          <label key={o.key} className="a11y-toggle">
            <span>
              <b>{t(o.title)}</b>
              <span className="muted small">{t(o.hint)}</span>
            </span>
            <input type="checkbox" role="switch" checked={a11y[o.key]} onChange={(e) => setA11y({ [o.key]: e.target.checked })} />
            <i className="a11y-switch" aria-hidden />
          </label>
        ))}
        <div className="modal-actions">
          <button className="btn btn-light" onClick={resetA11y}>
            {t('Сбросить')}
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            {t('Готово')}
          </button>
        </div>
      </div>
    </div>
  );
}

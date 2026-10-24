import type { DialogLine } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { canSpeak, foreignPart, say, stopSpeaking } from '../speech';

/** A round listen button. */
export function ListenButton({ onPlay, label }: { onPlay: () => Promise<void>; label?: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      className={`listen-btn${busy ? ' on' : ''}`}
      onClick={async () => {
        if (busy) {
          stopSpeaking();
          setBusy(false);
          return;
        }
        setBusy(true);
        await onPlay();
        setBusy(false);
      }}
    >
      <span aria-hidden>{busy ? '■' : '▶'}</span> {label ?? t('Послушать')}
    </button>
  );
}

/** A dialogue as chat bubbles: each line can be played, or the whole dialogue in turn. */
export function Dialog({ lines, lang }: { lines: DialogLine[]; lang: string }) {
  const t = useT();
  const [playing, setPlaying] = useState(-1);
  const [showTr, setShowTr] = useState(true);
  useEffect(() => () => stopSpeaking(), []);
  const first = lines[0]?.who;
  const playAll = async () => {
    for (let i = 0; i < lines.length; i++) {
      setPlaying(i);
      await say(lines[i].line, lang, lines[i].who === first ? 0 : 1);
    }
    setPlaying(-1);
  };
  return (
    <div className="dialog">
      <div className="dialog-tools">
        <ListenButton onPlay={playAll} label={t('Слушать диалог')} />
        <button type="button" className="tr-toggle" onClick={() => setShowTr(!showTr)}>
          {showTr ? t('Скрыть перевод') : t('Показать перевод')}
        </button>
      </div>
      {lines.map((l, i) => (
        <div key={i} className={`bubble ${l.who === first ? 'left' : 'right'}${playing === i ? ' playing' : ''}`}>
          <span className="who">{l.who}</span>
          <button type="button" className="bubble-line" onClick={() => say(l.line, lang, l.who === first ? 0 : 1)} lang={lang} dir="auto">
            {l.line}
          </button>
          {showTr && l.read && <span className="bubble-read">{l.read}</span>}
          {showTr && <span className="bubble-tr">{l.tr}</span>}
        </div>
      ))}
    </div>
  );
}

/** A reading text with the translation hidden until the child asks for it. */
export function ReadingText({ text, translation, reading, lang }: { text: string; translation?: string; reading?: string; lang?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  return (
    <div className="reading">
      <p className="reading-text" lang={lang} dir="auto">
        {text}
      </p>
      <div className="dialog-tools">
        {lang && <ListenButton onPlay={() => say(text, lang, 0, 0.85)} />}
        {reading && (
          <button type="button" className="tr-toggle" onClick={() => setRead(!read)}>
            {read ? t('Скрыть чтение') : t('Как читать')}
          </button>
        )}
        {translation && (
          <button type="button" className="tr-toggle" onClick={() => setOpen(!open)}>
            {open ? t('Скрыть перевод') : t('Показать перевод')}
          </button>
        )}
      </div>
      {read && reading && <p className="reading-read">{reading}</p>}
      {open && translation && <p className="reading-tr">{translation}</p>}
    </div>
  );
}

/** Listen button for a words section: reads only the foreign words. */
export function WordsListen({ text, lang }: { text: string; lang: string }) {
  return (
    <ListenButton
      onPlay={async () => {
        for (const w of foreignPart(text)) await say(w, lang, 0, 0.8);
      }}
    />
  );
}

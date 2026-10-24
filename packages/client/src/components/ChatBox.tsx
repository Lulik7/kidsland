import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { fmtTime } from '../format';
import { tSentences, useT } from '../i18n';

export interface ChatItem {
  id: string;
  body: string;
  mine: boolean;
  author: string;
  createdAt: string;
}

/** Message list with an input. `onSend` throws to show an error under the input. */
export function ChatBox({
  items,
  onSend,
  placeholder = 'Напишите сообщение…',
  empty,
  note,
  disabled,
}: {
  items: ChatItem[];
  onSend: (text: string) => Promise<void>;
  placeholder?: string;
  empty?: ReactNode;
  note?: ReactNode;
  disabled?: boolean;
}) {
  const t = useT();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      await onSend(body);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Не отправилось'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-list" ref={listRef} aria-live="polite">
        {items.length === 0 && <div className="chat-empty">{empty ?? t('Сообщений пока нет')}</div>}
        {items.map((m) => (
          <div key={m.id} className={m.mine ? 'msg mine' : 'msg'}>
            <span className="msg-author">{m.author}</span>
            <div className="msg-body">{m.body}</div>
            <span className="msg-time">{fmtTime(m.createdAt)}</span>
          </div>
        ))}
      </div>
      {note && <div className="chat-note">{note}</div>}
      {error && <div className="error chat-error">{tSentences(t, error)}</div>}
      <form className="chat-form" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={1000} disabled={disabled} aria-label={t('Сообщение')} />
        <button className="btn btn-primary" disabled={busy || disabled || !text.trim()}>
          {t('Отправить')}
        </button>
      </form>
    </div>
  );
}

/** Calls `fn` now and every `ms` while the tab is visible. */
export function usePolling(fn: () => void, ms: number, deps: unknown[]) {
  useEffect(() => {
    fn();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') fn();
    }, ms);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

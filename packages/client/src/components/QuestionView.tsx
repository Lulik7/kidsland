import type { Answer, Question } from '@kidsland/shared';
import { useMemo } from 'react';
import { useT } from '../i18n';
import { say } from '../speech';
import { ListenButton } from './LessonExtras';

/** Deterministic shuffle that never returns the original order (when there are 2+ items). */
export function shuffled(items: string[], seed: string): string[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((v, i) => v === items[i])) out.push(out.shift()!);
  return out;
}

interface Props {
  q: Question;
  n: number;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  /** true/false after checking, undefined before. */
  result?: boolean;
  /** The untranslated question when `q` is shown in another language: order answers hold its items. */
  orig?: Question;
}

export function QuestionView({ q, n, value, onChange, result, orig }: Props) {
  const t = useT();
  const checked = result !== undefined;
  const base = orig?.kind === q.kind ? orig : q;
  const initialOrder = useMemo(() => (base.kind === 'order' ? shuffled(base.items, base.id) : []), [base]);
  const label = (item: string) => (q.kind === 'order' && base.kind === 'order' ? (q.items[base.items.indexOf(item)] ?? item) : item);
  const cls = `question${checked ? (result ? ' right' : ' wrong') : ''}`;

  let body;
  switch (q.kind) {
    case 'single':
    case 'multi': {
      const multi = q.kind === 'multi';
      const picked = multi ? ((value as number[] | undefined) ?? []) : value;
      body = (
        <div className="options" role={multi ? 'group' : 'radiogroup'}>
          {q.options.map((o, i) => {
            const on = multi ? (picked as number[]).includes(i) : picked === i;
            const correct = checked && (multi ? q.answer.includes(i) : q.answer === i);
            return (
              <button
                key={i}
                type="button"
                role={multi ? 'checkbox' : 'radio'}
                aria-checked={on}
                disabled={checked}
                className={`option${on ? ' on' : ''}${correct ? ' correct' : ''}`}
                onClick={() =>
                  onChange(multi ? (on ? (picked as number[]).filter((x) => x !== i) : [...(picked as number[]), i]) : i)
                }
              >
                <span className={multi ? 'opt-box' : 'opt-dot'} aria-hidden />
                <span className="opt-text">{o}</span>
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case 'text':
      body = (
        <div className="text-answer">
          <input
            value={(value as string | undefined) ?? ''}
            disabled={checked}
            placeholder={q.placeholder ?? t('Твой ответ')}
            onChange={(e) => onChange(e.target.value)}
            maxLength={200}
            aria-label={t('Ответ')}
          />
          {checked && !result && <span className="small">{t('Правильный ответ:')}{' '}<b>{q.answer[0]}</b></span>}
        </div>
      );
      break;
    case 'order': {
      const list = (value as string[] | undefined) ?? initialOrder;
      const move = (i: number, d: number) => {
        const next = [...list];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        onChange(next);
      };
      body = (
        <>
          <ol className="order-list">
            {list.map((item, i) => (
              <li key={item} className={checked && base.kind === 'order' ? (item === base.items[i] ? 'ok' : 'bad') : ''}>
                <span className="order-n">{i + 1}</span>
                <code>{label(item)}</code>
                {!checked && (
                  <span className="order-btns">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('Выше')}>
                      ▲
                    </button>
                    <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={t('Ниже')}>
                      ▼
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ol>
          {checked && !result && (
            <div className="small order-right">
              {t('Правильный порядок:')}{' '}{q.items.map((x, i) => <code key={i}>{x}</code>)}
            </div>
          )}
        </>
      );
      break;
    }
  }

  return (
    <div className={cls}>
      <div className="q-head">
        <span className="q-n">{n}</span>
        <p className="q-prompt">
          {q.prompt}
          {q.kind === 'multi' && <span className="muted small"> ({t('несколько ответов')})</span>}
          {q.kind === 'order' && <span className="muted small"> ({t('двигай стрелками')})</span>}
        </p>
        {checked && <span className="q-mark" aria-label={result ? t('Верно') : t('Неверно')}>{result ? '✓' : '✗'}</span>}
      </div>
      {q.code && <pre className="code">{q.code}</pre>}
      {q.audio && <ListenButton onPlay={() => say(q.audio!, q.audioLang ?? 'en-GB', 0, 0.8)} />}
      {body}
      {checked && q.explain && <p className="q-explain">💡 {q.explain}</p>}
    </div>
  );
}

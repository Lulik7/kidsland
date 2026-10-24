import { useState } from 'react';
import { useT } from '../i18n';

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {items.map((f, i) => (
        <div key={f.q} className={open === i ? 'faq-item open' : 'faq-item'}>
          <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <span>{t(f.q)}</span>
            <span className="faq-sign" aria-hidden>
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && <p className="faq-a">{t(f.a)}</p>}
        </div>
      ))}
    </div>
  );
}

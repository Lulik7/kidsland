import { useState } from 'react';

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {items.map((f, i) => (
        <div key={f.q} className={open === i ? 'faq-item open' : 'faq-item'}>
          <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <span>{f.q}</span>
            <span className="faq-sign" aria-hidden>
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && <p className="faq-a">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

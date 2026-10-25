import { formatMoney, PAY_METHODS } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Receipt } from '../api';
import { fmtDateTime } from '../format';
import { useT } from '../i18n';

/** A printable receipt for one payment. */
export function ReceiptPage() {
  const t = useT();
  const { id = '' } = useParams();
  const [r, setR] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.receipt(id).then(setR).catch((e) => setError(e instanceof Error ? e.message : t('Ошибка')));
  }, [id, t]);

  if (error) return <div className="center-note">{error}</div>;
  if (!r) return <div className="center-note">{t('Загружаем…')}</div>;
  const method = PAY_METHODS.find((m) => m.id === r.method);
  return (
    <main className="page receipt-page">
      <Link to="/billing" className="back-link no-print">
        ← {t('Подписка')}
      </Link>
      <article className="receipt card">
        <header>
          <b className="receipt-logo">Kidsland</b>
          <h1>
            {t('Квитанция')} № {r.receiptNo}
          </h1>
          <span className="muted">{fmtDateTime(r.createdAt)}</span>
        </header>
        <dl>
          <dt>{t('Плательщик')}</dt>
          <dd>{r.email}</dd>
          <dt>{t('За что')}</dt>
          <dd>{r.title}</dd>
          <dt>{t('Способ оплаты')}</dt>
          <dd>{method ? t(method.name) : t('С баланса')}</dd>
          <dt>{t('Сумма')}</dt>
          <dd>
            <b>{formatMoney(r.amount, r.currency)}</b>
            {r.currency !== 'ILS' && <span className="muted"> ({formatMoney(r.amount, 'ILS')})</span>}
          </dd>
        </dl>
        <p className="small muted">{t('Оплата пока учебная: деньги не списываются.')}</p>
      </article>
      <div className="modal-actions no-print">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          🖨 {t('Распечатать')}
        </button>
      </div>
    </main>
  );
}

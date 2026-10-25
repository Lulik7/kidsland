import { CURRENCIES, PAY_METHODS, type Currency, type PayMethod } from '@kidsland/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Billing, PayChoice } from '../api';
import { useAuth } from '../auth';
import { getCurrency, money, setCurrency } from '../format';
import { useT } from '../i18n';

/**
 * Paying for lessons: the sum in the family's currency, card or PayPal, then the receipt.
 * Payment is a demo for now; a real provider (a card processor or PayPal) plugs in where `pay` is called.
 */
export function Checkout({
  title,
  shekels,
  defaultMethod,
  pay,
  onClose,
  onPaid,
}: {
  title: string;
  shekels: number;
  defaultMethod?: PayMethod;
  pay: (choice: PayChoice) => Promise<Billing>;
  onClose: () => void;
  onPaid: (b: Billing) => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const [method, setMethod] = useState<PayMethod>(defaultMethod ?? 'card');
  const [cur, setCur] = useState<Currency>(getCurrency());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Billing | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      const b = await pay({ method, currency: cur });
      setDone(b);
      onPaid(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    } finally {
      setBusy(false);
    }
  };
  const receipt = done?.payments[0];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal checkout" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {!done ? (
          <>
            <h2>{t('Оплата')}</h2>
            <p>{title}</p>
            <b className="bill-big">{money(shekels)}</b>
            <div className="chips-row">
              {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`fchip${cur === c ? ' on' : ''}`}
                  onClick={() => {
                    setCur(c);
                    setCurrency(c);
                  }}
                >
                  {CURRENCIES[c].sign} {c}
                </button>
              ))}
            </div>
            <div className="pay-methods">
              {PAY_METHODS.map((m) => (
                <button key={m.id} type="button" className={`pay-method${method === m.id ? ' on' : ''}`} onClick={() => setMethod(m.id)}>
                  <span className={`pm-logo pm-${m.id}`}>{m.id === 'card' ? 'VISA · Mastercard' : 'PayPal'}</span>
                  <small>{t(m.name)}</small>
                </button>
              ))}
            </div>
            <p className="small">{t('Оплата пока учебная: деньги не списываются.')}</p>
            {error && <div className="error">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-light" onClick={onClose}>
                {t('Отмена')}
              </button>
              <button type="button" className="btn btn-go" disabled={busy} onClick={go}>
                {busy ? t('Оплачиваем…') : `${t('Оплатить')} ${money(shekels)}`}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>✅ {t('Оплачено!')}</h2>
            {receipt?.receiptNo && (
              <p>
                {t('Квитанция')} № {receipt.receiptNo}
              </p>
            )}
            {user && <p className="small">{t('Подтверждение отправлено на почту {email}.', { email: user.email })}</p>}
            <div className="modal-actions">
              {receipt && (
                <Link to={`/billing/receipt/${receipt.id}`} className="btn btn-light">
                  🧾 {t('Квитанция')}
                </Link>
              )}
              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t('Готово')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

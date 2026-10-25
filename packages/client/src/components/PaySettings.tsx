import { CURRENCIES, PAY_METHODS, type Currency, type PayMethod } from '@kidsland/shared';
import { useMemo, useState } from 'react';
import { api, type Billing } from '../api';
import { browserTimeZone, getCurrency, getTimeZone, setCurrency, setTimeZone } from '../format';
import { useT } from '../i18n';

const zones = (): string[] => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [browserTimeZone()];
  }
};

/** "Asia/Jerusalem" → "Jerusalem (UTC+3)". */
function zoneLabel(tz: string) {
  const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value;
  return `${tz.split('/').pop()!.replace(/_/g, ' ')} (${(offset ?? 'GMT').replace('GMT', 'UTC')})`;
}

/** The family's time zone and currency (and usual payment method): kept on the account and in this browser. */
export function PaySettings({ onChange, withMethod = false }: { onChange?: (b: Billing | null) => void; withMethod?: boolean }) {
  const t = useT();
  const [cur, setCur] = useState<Currency>(getCurrency());
  const [tz, setTz] = useState(getTimeZone());
  const [method, setMethod] = useState<PayMethod>(() => {
    try {
      return (localStorage.getItem('kl-pay') as PayMethod) || 'card';
    } catch {
      return 'card';
    }
  });
  const list = useMemo(() => {
    const all = zones();
    return all.includes(tz) ? all : [tz, ...all];
  }, [tz]);
  const now = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });

  const save = (s: { currency?: Currency; timezone?: string; payMethod?: PayMethod }) =>
    api
      .billingSettings(s)
      .then((b) => onChange?.(b))
      .catch(() => onChange?.(null));

  return (
    <div className="pay-settings">
      <label>
        <span className="muted small">{t('Часовой пояс')}</span>
        <select
          value={tz}
          onChange={(e) => {
            setTz(e.target.value);
            setTimeZone(e.target.value);
            save({ timezone: e.target.value });
          }}
        >
          {list.map((z) => (
            <option key={z} value={z}>
              {zoneLabel(z)}
            </option>
          ))}
        </select>
        <small className="muted">
          {t('Сейчас там')} {now}. {t('Время уроков показывается в этом поясе.')}
        </small>
      </label>
      <div>
        <span className="muted small">{t('Валюта')}</span>
        <div className="chips-row">
          {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`fchip${cur === c ? ' on' : ''}`}
              onClick={() => {
                setCur(c);
                setCurrency(c);
                save({ currency: c });
              }}
            >
              {CURRENCIES[c].sign} {c}
            </button>
          ))}
        </div>
      </div>
      {withMethod && (
        <div>
          <span className="muted small">{t('Способ оплаты')}</span>
          <div className="chips-row">
            {PAY_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`fchip${method === m.id ? ' on' : ''}`}
                onClick={() => {
                  setMethod(m.id);
                  try {
                    localStorage.setItem('kl-pay', m.id);
                  } catch {
                    // remembered on the account anyway
                  }
                  save({ payMethod: m.id });
                }}
              >
                {m.id === 'card' ? '💳' : '🅿️'} {t(m.name)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

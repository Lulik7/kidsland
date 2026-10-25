import { BONUS_DISCOUNT, BONUS_FOR_DISCOUNT, BONUS_PER_ANSWER, PACKS, PRICE_STEPS, SUBSCRIPTION_STEPS, withDiscount } from '@kidsland/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type Billing, type Tutor } from '../api';
import { WcBranch } from '../components/Watercolor';
import { Checkout } from '../components/Checkout';
import { PaySettings } from '../components/PaySettings';
import { fmtDateTime, getCurrency as getCurrencyCode, getTimeZone, money, personName, setTimeZone } from '../format';
import type { PayChoice } from '../api';
import { useT } from '../i18n';

/** "Subscription and payment": balance, lesson packs, the monthly subscription and moving lessons to another tutor. */
export function BillingPage() {
  const t = useT();
  const [params] = useSearchParams();
  const [bill, setBill] = useState<Billing | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [tutorId, setTutorId] = useState(params.get('tutor') ?? '');
  const [subLessons, setSubLessons] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [, redraw] = useState(0);
  const [checkout, setCheckout] = useState<{ title: string; shekels: number; pay: (c: PayChoice) => Promise<Billing> } | null>(null);
  const [move, setMove] = useState<{ packageId: string; to: string; lessons: number } | null>(null);

  useEffect(() => {
    api.billing().then((b) => {
      setBill(b);
      if (b.settings.timezone && b.settings.timezone !== getTimeZone()) setTimeZone(b.settings.timezone);
      if (b.subscription) setSubLessons(b.subscription.nextLessons ?? b.subscription.lessonsPerMonth);
    });
    api.tutors({ sort: 'rating' }).then((r) => setTutors(r.tutors));
  }, []);

  const tutor = useMemo(() => tutors.find((x) => x.id === tutorId) ?? null, [tutors, tutorId]);
  const run = async (f: () => Promise<Billing>, ok: string) => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      setBill(await f());
      setNote(ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    } finally {
      setBusy(false);
    }
  };

  if (!bill) return <div className="center-note">{t('Загружаем…')}</div>;
  const sub = bill.subscription;
  const stepIndex = SUBSCRIPTION_STEPS.findIndex((s) => s.lessons === subLessons);
  const subStep = SUBSCRIPTION_STEPS[Math.max(0, stepIndex)];
  const subTutor = sub?.tutor ? tutors.find((x) => x.id === sub.tutor!.id) : tutor;
  const subPer = subTutor ? withDiscount(subTutor.price, subStep.discount) : null;

  const tutorSelect = (value: string, onChange: (v: string) => void, exclude?: string) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t('Выберите наставника')}</option>
      {tutors
        .filter((x) => x.id !== exclude)
        .map((x) => (
          <option key={x.id} value={x.id}>
            {personName(x.displayName)} · {money(x.price)}
          </option>
        ))}
    </select>
  );

  return (
    <main className="page billing-page">
      <section className="courses-hero">
        <WcBranch className="banner-branch" size={190} />
        <span className="pill pill-dark">{t('Подписка и оплата')}</span>
        <h1>{t('Уроки с наставником')}</h1>
        <p>{t('Оплатите уроки заранее: пакетом или подпиской на месяц. Чем больше уроков, тем дешевле каждый. Неиспользованные уроки можно перенести к другому наставнику.')}</p>
      </section>

      <section className="card">
        <PaySettings withMethod onChange={(b) => (b ? setBill(b) : redraw((n) => n + 1))} />
      </section>
      <div className="demo-pay">💡 {t('Оплата пока учебная: деньги не списываются, уроки сразу появляются на балансе.')}</div>
      {error && <div className="error">{error}</div>}
      {note && <div className="ok-note">✓ {note}</div>}

      <section className="card bill-balance">
        <div>
          <span className="muted">{t('На балансе')}</span>
          <b className="bill-big">
            {bill.lessonsLeft} {t('ур.')}
          </b>
          {bill.wallet > 0 && (
            <span className="small">
              + {money(bill.wallet)} {t('на счёте (пойдут в следующую оплату)')}
            </span>
          )}
        </div>
        <div className="bill-packages">
          {bill.packages.length === 0 && <p className="muted">{t('Оплаченных уроков пока нет.')}</p>}
          {bill.packages.map((p) => (
            <div key={p.id} className="bill-pkg">
              <div>
                <b>
                  {p.isTrial ? t('Пробный урок') : p.plan === 'bonus' ? t('Урок за бонусы') : p.source === 'subscription' ? t('Подписка') : p.source === 'transfer' ? t('Перенесённые уроки') : t('Пакет')}
                </b>{' '}
                · {p.tutor ? personName(p.tutor.displayName) : '—'}
                <div className="small muted">
                  {t('Осталось')} {p.lessonsLeft} {t('из')} {p.lessonsTotal} · {money(p.perLesson)} {t('за урок')}
                </div>
              </div>
              {!p.isTrial && (
                <button type="button" className="btn btn-light btn-small" onClick={() => setMove({ packageId: p.id, to: '', lessons: p.lessonsLeft })}>
                  {t('Перенести к другому')}
                </button>
              )}
              {move?.packageId === p.id && (
                <div className="bill-move">
                  {tutorSelect(move.to, (v) => setMove({ ...move, to: v }), p.tutor?.id)}
                  <label className="small">
                    {t('Сколько уроков')}{' '}
                    <input type="number" min={1} max={p.lessonsLeft} value={move.lessons} onChange={(e) => setMove({ ...move, lessons: Math.max(1, Math.min(p.lessonsLeft, Number(e.target.value))) })} />
                  </label>
                  {move.to && (
                    <span className="small muted">
                      {(() => {
                        const to = tutors.find((x) => x.id === move.to);
                        if (!to) return null;
                        const value = move.lessons * p.perLesson;
                        const per = withDiscount(to.price, p.discount);
                        const n = Math.floor(value / per);
                        return `${money(value)} → ${n} ${t('ур.')} ${t('по')} ${money(per)}${value - n * per ? `, ${money(value - n * per)} ${t('на счёт')}` : ''}`;
                      })()}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    disabled={!move.to || busy}
                    onClick={() => run(() => api.transferLessons(p.id, move.to, move.lessons), t('Уроки перенесены')).then(() => setMove(null))}
                  >
                    {t('Перенести')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">{t('Купить уроки')}</h2>
        <div className="bill-tutor">
          <span>{t('Наставник')}:</span>
          {tutorSelect(tutorId, setTutorId)}
          <Link to="/tutors" className="small">
            {t('Выбрать в каталоге')}
          </Link>
        </div>
        <div className="bill-plans">
          {PACKS.map((p) => {
            const per = tutor ? withDiscount(tutor.price, p.discount) : null;
            const off = p.id === 'trial' && !bill.trialAvailable;
            return (
              <div key={p.id} className={`bill-plan${p.id === 'p8' ? ' best' : ''}${off ? ' off' : ''}`}>
                {p.discount > 0 && <span className="bill-off">−{p.discount}%</span>}
                <h3>{t(p.name)}</h3>
                {per !== null ? (
                  <>
                    <b className="bill-price">{money(per * p.lessons)}</b>
                    <span className="small muted">
                      {money(per)} {t('за урок')}
                    </span>
                  </>
                ) : (
                  <span className="small muted">{t('Выберите наставника, чтобы увидеть цену')}</span>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  disabled={!tutor || busy || off}
                  onClick={() =>
                    per !== null &&
                    setCheckout({ title: `${t(p.name)} · ${personName(tutor!.displayName)}`, shekels: per * p.lessons, pay: (pay) => api.buyPack(p.id, tutorId, pay) })
                  }
                >
                  {off ? t('Уже был') : t('Оплатить')}
                </button>
              </div>
            );
          })}
        </div>
        {bill.settings && getCurrencyCode() !== 'ILS' && <p className="small muted">{t('Цены пересчитаны из шекелей по примерному курсу.')}</p>}
      </section>

      {bill.children.length > 0 && (
        <section className="card bill-bonus">
          <h2 className="card-title">🎁 {t('Бонусы за домашние задания')}</h2>
          <p className="muted">
            {t('После каждого урока у ребёнка есть домашнее задание. За каждый верный ответ +{n} бонусов. {b} бонусов = урок со скидкой {d}% у любого наставника.', {
              n: BONUS_PER_ANSWER,
              b: BONUS_FOR_DISCOUNT,
              d: BONUS_DISCOUNT,
            })}
          </p>
          {bill.children.map((c) => {
            const ready = c.bonus >= BONUS_FOR_DISCOUNT;
            return (
              <div key={c.id} className="bill-pkg">
                <div>
                  <b>{c.nickname}</b> · 🎁 {c.bonus}
                  <span className="hw-bar">
                    <i style={{ width: `${Math.min(100, (c.bonus / BONUS_FOR_DISCOUNT) * 100)}%` }} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  disabled={!ready || !tutor || busy}
                  onClick={() =>
                    tutor &&
                    setCheckout({
                      title: `${t('Урок за бонусы')} · ${personName(tutor.displayName)}`,
                      shekels: withDiscount(tutor.price, BONUS_DISCOUNT),
                      pay: (pay) => api.bonusLesson(c.id, tutorId, pay),
                    })
                  }
                >
                  {!ready
                    ? t('ещё {n} до скидки', { n: BONUS_FOR_DISCOUNT - c.bonus })
                    : tutor
                      ? `${t('Урок за')} ${money(withDiscount(tutor.price, BONUS_DISCOUNT))}`
                      : t('Выберите наставника выше')}
                </button>
              </div>
            );
          })}
        </section>
      )}

      <section className="card">
        <h2 className="card-title">{t('Подписка на месяц')}</h2>
        <p className="muted">{t('Каждый месяц на баланс приходят уроки по выбранному плану. План можно увеличить или уменьшить: изменение начнётся со следующего месяца.')}</p>
        <div className="bill-sub">
          <button type="button" className="round-btn" disabled={stepIndex <= 0} onClick={() => setSubLessons(SUBSCRIPTION_STEPS[stepIndex - 1].lessons)} aria-label={t('Меньше')}>
            −
          </button>
          <div className="bill-sub-n">
            <b>{subLessons}</b>
            <span>{t('уроков в месяц')}</span>
            {subStep.discount > 0 && <span className="bill-off">−{subStep.discount}%</span>}
          </div>
          <button
            type="button"
            className="round-btn"
            disabled={stepIndex >= SUBSCRIPTION_STEPS.length - 1}
            onClick={() => setSubLessons(SUBSCRIPTION_STEPS[stepIndex + 1].lessons)}
            aria-label={t('Больше')}
          >
            +
          </button>
          {subPer !== null && (
            <div className="bill-sub-price">
              <b>{money(subPer * subLessons)}</b> <span className="small muted">{t('в месяц')}</span>
            </div>
          )}
        </div>
        {sub ? (
          <div className="bill-sub-state">
            <p>
              {sub.status === 'active' ? '✅' : '⏸'} {t('Сейчас')}: <b>{sub.lessonsPerMonth}</b> {t('уроков в месяц')}
              {sub.tutor && ` · ${personName(sub.tutor.displayName)}`}
              {sub.nextLessons && ` · ${t('со следующего месяца')} ${sub.nextLessons}`}. {sub.status === 'active' ? t('Следующее списание') : t('Подписка закончится')}{' '}
              {fmtDateTime(sub.periodEnd)}.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary btn-small" disabled={busy || subLessons === (sub.nextLessons ?? sub.lessonsPerMonth)} onClick={() => run(() => api.subscribe(subLessons, sub.tutor?.id ?? tutorId), t('План изменится со следующего месяца'))}>
                {t('Изменить план')}
              </button>
              {sub.status === 'active' ? (
                <button type="button" className="btn btn-light btn-small" disabled={busy} onClick={() => run(api.cancelSubscription, t('Подписка отменена, уроки этого месяца остаются'))}>
                  {t('Отменить подписку')}
                </button>
              ) : (
                <button type="button" className="btn btn-light btn-small" disabled={busy} onClick={() => run(api.resumeSubscription, t('Подписка снова активна'))}>
                  {t('Возобновить')}
                </button>
              )}
            </div>
            <div className="bill-tutor">
              <span>{t('Перевести подписку другому наставнику')}:</span>
              {tutorSelect('', (v) => v && run(() => api.moveSubscription(v), t('Подписка перенесена. Уроки этого месяца можно перенести выше.')), sub.tutor?.id)}
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-go" disabled={!tutor || busy} onClick={() =>
              tutor &&
              subPer !== null &&
              setCheckout({
                title: `${t('Подписка на месяц')}: ${subLessons} ${t('уроков в месяц')} · ${personName(tutor.displayName)}`,
                shekels: subPer * subLessons,
                pay: (pay) => api.subscribe(subLessons, tutorId, pay),
              })
            }>
            {tutor ? `${t('Оформить подписку')}: ${personName(tutor.displayName)}` : t('Сначала выберите наставника выше')}
          </button>
        )}
      </section>

      {checkout && (
        <Checkout
          title={checkout.title}
          shekels={checkout.shekels}
          defaultMethod={bill.settings.payMethod}
          pay={checkout.pay}
          onClose={() => setCheckout(null)}
          onPaid={(b) => {
            setBill(b);
            setNote(t('Оплачено! Уроки на балансе.'));
          }}
        />
      )}

      {bill.payments.length > 0 && (
        <section className="card">
          <h2 className="card-title">{t('История')}</h2>
          <ul className="bill-history">
            {bill.payments.map((p) => (
              <li key={p.id}>
                <span className="muted small">{fmtDateTime(p.createdAt)}</span>
                <span>
                  {p.title}
                  {p.method && <small className="muted"> · {p.method === 'paypal' ? 'PayPal' : t('Банковская карта')}</small>}
                </span>
                <b>{p.amount ? money(p.amount) : '—'}</b>
                {p.receiptNo ? (
                  <Link to={`/billing/receipt/${p.id}`} className="small">
                    🧾 № {p.receiptNo}
                  </Link>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

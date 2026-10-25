import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type AdminLetter, type AdminPayment } from '../../api';
import { fmtDateTime } from '../../format';

const STATUS = { pending: 'ждёт отправки', sent: 'отправлено', failed: 'ошибка' } as const;

/** Every letter the site sent or is about to send: receipts, lesson reminders, copies for the admin. */
export function AdminMail() {
  const [filter, setFilter] = useState<'' | 'pending' | 'sent' | 'failed'>('');
  const [data, setData] = useState<{ letters: AdminLetter[]; counts: Partial<Record<string, number>>; mailReady: boolean; envFiles?: string[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    api.adminMail(filter || undefined).then(setData).catch(() => {});
  }, [filter]);
  if (!data) return <div className="card muted">Загружаем письма…</div>;
  return (
    <div className="card">
      <h2 className="card-title">Письма</h2>
      {!data.mailReady && (
        <p className="error">
          Почта для отправки ещё не подключена (SMTP_URL в packages/server/.env), поэтому письма пока ждут в очереди и уйдут, как только её подключат.
          <br />
          {data.envFiles?.length
            ? `Сервер нашёл файл настроек: ${data.envFiles.join(', ')}, но строки SMTP_URL в нём нет. Проверьте, что строка начинается с SMTP_URL= и файл сохранён, затем перезапустите сервер.`
            : 'Сервер не нашёл файл настроек .env ни в папке packages\\server, ни в корне проекта. Возможно, файл сохранился как .env.example или в другой папке.'}
        </p>
      )}
      <div className="tabs small-tabs">
        {(['', 'pending', 'sent', 'failed'] as const).map((s) => (
          <button key={s} className={filter === s ? 'tab on' : 'tab'} onClick={() => setFilter(s)}>
            {s ? STATUS[s] : 'все'} {s && data.counts[s] ? <span className="badge">{data.counts[s]}</span> : null}
          </button>
        ))}
      </div>
      {data.letters.length === 0 ? (
        <p className="muted">Писем нет.</p>
      ) : (
        <div className="flag-list">
          {data.letters.map((m) => (
            <div key={m.id} className="flag" onClick={() => setOpen(open === m.id ? null : m.id)} style={{ cursor: 'pointer' }}>
              <div className="flag-head">
                <b>{m.subject}</b>
                <span className={`chip ${m.status === 'failed' ? 'chip-warn' : 'chip-muted'}`}>{STATUS[m.status]}</span>
                <span className="muted small">
                  кому: {m.to} · {fmtDateTime(m.createdAt)}
                </span>
              </div>
              {open === m.id && <blockquote style={{ whiteSpace: 'pre-wrap' }}>{m.body}</blockquote>}
              {m.error && <div className="flag-reason">{m.error}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const shekels = (n: number) => `${n.toLocaleString('ru-RU')} ₪`;

/** Payments with their receipts, newest first. */
export function AdminPayments() {
  const [data, setData] = useState<{ payments: AdminPayment[]; month: number } | null>(null);
  useEffect(() => {
    api.adminPayments().then(setData).catch(() => {});
  }, []);
  if (!data) return <div className="card muted">Загружаем оплаты…</div>;
  return (
    <div className="card">
      <h2 className="card-title">Оплаты</h2>
      <p className="muted">За последние 30 дней: <b>{shekels(data.month)}</b></p>
      {data.payments.length === 0 ? (
        <p className="muted">Оплат пока нет.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Кто</th>
                <th>За что</th>
                <th>Сумма</th>
                <th>Квитанция</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDateTime(p.createdAt)}</td>
                  <td>{p.email}</td>
                  <td>{p.title}</td>
                  <td>
                    {shekels(p.amount)}
                    {p.currency !== 'ILS' && <span className="muted small"> ({p.amountShown} {p.currency})</span>}
                  </td>
                  <td>{p.receiptNo ? <Link to={`/billing/receipt/${p.id}`}>№ {p.receiptNo}</Link> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

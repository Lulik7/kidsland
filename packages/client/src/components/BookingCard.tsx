import { CANCEL_REASONS } from '@kidsland/shared';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api, type Booking } from '../api';
import { avatarSvg } from '../game/sprites';
import { fmtDateTime, personName, rub } from '../format';
import { useT } from '../i18n';
import { Sprite } from './Sprite';
import { TutorAvatar } from './TutorAvatar';

/** Lessons can be joined from 10 minutes before the start until the end. */
export function canJoin(b: Booking, now = Date.now()) {
  const start = new Date(b.startsAt).getTime();
  return b.status === 'scheduled' && now >= start - 10 * 60_000 && now <= start + b.durationMin * 60_000;
}

type Viewer = 'parent' | 'tutor';

export function BookingCard({ booking: b, viewer, onChange }: { booking: Booking; viewer: Viewer; onChange: (b: Booking) => void }) {
  const t = useT();
  const [asking, setAsking] = useState(false);
  const who = viewer === 'parent' ? personName(b.tutor.displayName) : b.child.nickname;
  const c = b.cancellation;
  return (
    <div className={`booking${b.status === 'cancelled' ? ' cancelled' : ''}`}>
      {viewer === 'parent' ? <TutorAvatar name={who} size={52} /> : <Sprite svg={avatarSvg(b.child.avatarUrl)} size={52} />}
      <div className="booking-main">
        <b>{fmtDateTime(b.startsAt)}</b>
        <span>
          {viewer === 'parent' ? `${who} · ${t('ученик')}: ${b.child.nickname}` : `${t('Ученик')}: ${who}`} · {b.durationMin} {t('мин')}
        </span>
        <span className="chips">
          {b.isTrial ? <span className="chip chip-free">{t('Бесплатный пробный')}</span> : <span className="chip chip-star">{rub(b.price)}</span>}
          {b.status === 'cancelled' && <span className="chip chip-muted">{t('Отменён')}</span>}
        </span>
        {c && (
          <div className="cancel-info">
            <b>
              {c.by === viewer ? t('Вы отменили урок') : c.by === 'tutor' ? t('Наставник отменил урок') : t('Родитель отменил урок')}:
            </b>{' '}
            {t(c.label)}
            {c.note && <q>{c.note}</q>}
          </div>
        )}
      </div>
      {b.status === 'scheduled' && (
        <div className="booking-actions">
          <Link to={`/lessons/${b.id}`} className={`btn ${canJoin(b) ? 'btn-go' : 'btn-light'}`}>
            {canJoin(b) ? t('Войти в урок') : t('Комната урока')}
          </Link>
          <button className="btn btn-ghost" onClick={() => setAsking(true)}>
            {t('Отменить')}
          </button>
        </div>
      )}
      {asking &&
        createPortal(
          <CancelDialog
            booking={b}
            viewer={viewer}
            onClose={() => setAsking(false)}
            onDone={(nb) => {
              setAsking(false);
              onChange(nb);
            }}
          />,
          document.body,
        )}
    </div>
  );
}

/** Asks why the lesson is cancelled; the reason and the note are shown to the other side. */
function CancelDialog({ booking: b, viewer, onClose, onDone }: { booking: Booking; viewer: Viewer; onClose: () => void; onDone: (b: Booking) => void }) {
  const t = useT();
  const reasons = CANCEL_REASONS[viewer];
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const to = viewer === 'parent' ? t('наставнику') : t('родителю');

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone((await api.cancelBooking(b.id, reason, note.trim())).booking);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="cancel-title">{t('Отменить урок?')}</h2>
        <p className="muted">
          {fmtDateTime(b.startsAt)} · {viewer === 'parent' ? personName(b.tutor.displayName) : b.child.nickname}
        </p>
        <fieldset className="reasons">
          <legend>{t('Выберите причину. Мы сообщим её {to}.', { to })}</legend>
          {reasons.map((r) => (
            <label key={r.id} className={reason === r.id ? 'reason on' : 'reason'}>
              <input type="radio" name="cancel-reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
              {t(r.label)}
            </label>
          ))}
        </fieldset>
        <label className="field cancel-note">
          <span>{t('Сообщение {to} (необязательно)', { to })}</span>
          <textarea
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={viewer === 'parent' ? t('Например: давайте перенесём на четверг') : t('Например: могу провести урок в субботу')}
          />
          <span className="muted small">{t('Телефоны, почту и ссылки на мессенджеры отправить нельзя: общение только на сайте.')}</span>
        </label>
        {error && <div className="error">{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-light" onClick={onClose}>
            {t('Не отменять')}
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || !reason}>
            {busy ? t('Отменяем…') : t('Отменить урок')}
          </button>
        </div>
      </div>
    </div>
  );
}

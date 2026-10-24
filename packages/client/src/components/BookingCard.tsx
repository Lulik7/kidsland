import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Booking } from '../api';
import { avatarSvg } from '../game/sprites';
import { fmtDateTime, rub } from '../format';
import { Sprite } from './Sprite';
import { TutorAvatar } from './TutorAvatar';

/** Lessons can be joined from 10 minutes before the start until the end. */
export function canJoin(b: Booking, now = Date.now()) {
  const start = new Date(b.startsAt).getTime();
  return b.status === 'scheduled' && now >= start - 10 * 60_000 && now <= start + b.durationMin * 60_000;
}

export function BookingCard({ booking: b, viewer, onChange }: { booking: Booking; viewer: 'parent' | 'tutor'; onChange: (b: Booking) => void }) {
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    if (!window.confirm('Отменить урок?')) return;
    setBusy(true);
    try {
      onChange((await api.cancelBooking(b.id)).booking);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };
  const who = viewer === 'parent' ? b.tutor.displayName : b.child.nickname;
  return (
    <div className={`booking${b.status === 'cancelled' ? ' cancelled' : ''}`}>
      {viewer === 'parent' ? <TutorAvatar name={who} size={52} /> : <Sprite svg={avatarSvg(b.child.avatarUrl)} size={52} />}
      <div className="booking-main">
        <b>{fmtDateTime(b.startsAt)}</b>
        <span>
          {viewer === 'parent' ? `${who} · ученик: ${b.child.nickname}` : `Ученик: ${who}`} · {b.durationMin} мин
        </span>
        <span className="chips">
          {b.isTrial ? <span className="chip chip-free">Бесплатный пробный</span> : <span className="chip chip-star">{rub(b.price)}</span>}
          {b.status === 'cancelled' && <span className="chip chip-muted">Отменён</span>}
        </span>
      </div>
      {b.status === 'scheduled' && (
        <div className="booking-actions">
          <Link to={`/lessons/${b.id}`} className={`btn ${canJoin(b) ? 'btn-go' : 'btn-light'}`}>
            {canJoin(b) ? 'Войти в урок' : 'Комната урока'}
          </Link>
          <button className="btn btn-ghost" onClick={cancel} disabled={busy}>
            Отменить
          </button>
        </div>
      )}
    </div>
  );
}

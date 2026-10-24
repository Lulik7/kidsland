import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Booking } from '../api';
import { useAuth } from '../auth';
import { canJoin } from '../components/BookingCard';
import { TutorAvatar } from '../components/TutorAvatar';
import { fmtDateTime } from '../format';

function untilText(ms: number) {
  const min = Math.ceil(ms / 60_000);
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} ч ${min % 60} мин`;
  return `${Math.floor(h / 24)} дн.`;
}

export function LessonRoom() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api.booking(id).then((r) => setBooking(r.booking)).catch((e) => setError(e.message));
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, [id]);

  if (!booking) return <div className="center-note">{error ?? 'Загружаем урок…'}</div>;

  const isTutor = user?.role === 'tutor';
  const back = isTutor ? '/tutor' : '/parent';
  const open = canJoin(booking, now);
  const start = new Date(booking.startsAt).getTime();
  const name = isTutor ? booking.tutor.displayName : booking.child.nickname;
  const room = `${booking.meetingLink}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(`"${name}"`)}`;

  return (
    <main className="page lesson">
      <div className="lesson-head card">
        <TutorAvatar name={booking.tutor.displayName} size={56} />
        <div className="lesson-info">
          <h1>Урок с наставником {booking.tutor.displayName}</h1>
          <span className="muted">
            {fmtDateTime(booking.startsAt)} · {booking.durationMin} мин · ученик {booking.child.nickname}
            {booking.isTrial && ' · пробный урок'}
          </span>
        </div>
        <Link to={back} className="btn btn-light">
          Назад
        </Link>
      </div>

      {booking.status === 'cancelled' ? (
        <div className="card center-card">
          <h2>Урок отменён</h2>
          <Link to="/tutors" className="btn btn-primary">
            Выбрать другое время
          </Link>
        </div>
      ) : open ? (
        <>
          <div className="video-room">
            <iframe src={room} title="Онлайн-урок" allow="camera; microphone; fullscreen; display-capture; autoplay" />
          </div>
          <p className="muted small center">
            Если видео не загрузилось или прервалось,{' '}
            <a href={booking.meetingLink} target="_blank" rel="noreferrer">
              откройте урок в новой вкладке
            </a>
            .
          </p>
        </>
      ) : now < start ? (
        <div className="card center-card">
          <div className="countdown">{untilText(start - now)}</div>
          <h2>до начала урока</h2>
          <p className="muted">Комната откроется за 10 минут до начала. Проверьте камеру и микрофон, приготовьте наушники.</p>
          <a href={booking.meetingLink} target="_blank" rel="noreferrer" className="btn btn-light">
            Ссылка на видеокомнату
          </a>
        </div>
      ) : (
        <div className="card center-card">
          <h2>Урок завершён</h2>
          <p className="muted">Спасибо! Следующий урок можно выбрать у этого же наставника.</p>
          <Link to={`/tutors/${booking.tutor.id}`} className="btn btn-primary">
            Записаться снова
          </Link>
        </div>
      )}
    </main>
  );
}

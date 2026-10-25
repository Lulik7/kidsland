import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Booking } from '../api';
import { useAuth } from '../auth';
import { dayKey, fmtTime, personName } from '../format';
import { useT } from '../i18n';

/**
 * A reminder strip under the header for parents and tutors: on the lesson day it says when the lesson is,
 * and from 30 minutes before the start it counts down and offers to join. Email reminders come from the server.
 */
export function LessonReminder() {
  const t = useT();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [hidden, setHidden] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'parent' && user.role !== 'tutor')) return setBookings([]);
    const load = () => api.bookings().then((r) => setBookings(r.bookings)).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const next = bookings.find((b) => {
    if (b.status !== 'scheduled') return false;
    const start = new Date(b.startsAt).getTime();
    return start + b.durationMin * 60_000 > now && dayKey(b.startsAt) === dayKey(new Date(now));
  });
  if (!next) return null;

  const minutes = Math.round((new Date(next.startsAt).getTime() - now) / 60_000);
  const soon = minutes <= 30;
  const key = `${next.id}-${soon ? 'soon' : 'day'}`;
  if (hidden === key) return null;
  const who = user?.role === 'tutor' ? t('с учеником {n}', { n: next.child.nickname }) : t('с наставником {n}', { n: personName(next.tutor.displayName) });

  return (
    <div className={`lesson-reminder${soon ? ' soon' : ''}`} role="status">
      <span className="lr-icon" aria-hidden>{soon ? '⏰' : '📅'}</span>
      <span className="lr-text">
        {minutes > 0
          ? soon
            ? t('Урок {who} начнётся через {m} мин', { who, m: minutes })
            : t('Сегодня урок {who} в {time}', { who, time: fmtTime(next.startsAt) })
          : t('Урок {who} уже идёт', { who })}
      </span>
      {soon && (
        <Link to={`/lessons/${next.id}`} className="btn btn-primary">
          {t('Войти в урок')}
        </Link>
      )}
      <button className="lr-close" onClick={() => setHidden(key)} aria-label={t('Закрыть')}>×</button>
    </div>
  );
}

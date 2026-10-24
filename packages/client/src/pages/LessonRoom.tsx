import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type Booking, type RoomMessage, type Stroke } from '../api';
import { useAuth } from '../auth';
import { canJoin } from '../components/BookingCard';
import { usePolling } from '../components/ChatBox';
import { Classroom } from '../components/Classroom';
import { TutorAvatar } from '../components/TutorAvatar';
import { fmtDateTime, personName } from '../format';
import { useT, type T } from '../i18n';

function untilText(ms: number, t: T) {
  const min = Math.ceil(ms / 60_000);
  if (min < 60) return t('{n} мин', { n: min });
  const h = Math.floor(min / 60);
  if (h < 48) return t('{h} ч {m} мин', { h, m: min % 60 });
  return t('{n} дн.', { n: Math.floor(h / 24) });
}

export function LessonRoom() {
  const t = useT();
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [pending, setPending] = useState<{ stroke: Stroke; version?: number }[]>([]);
  const boardVersion = useRef(-1);

  usePolling(() => {
    api.booking(id).then((r) => setBooking(r.booking)).catch((e) => setError(e.message));
  }, 60_000, [id]);

  usePolling(
    () => {
      setNow(Date.now());
      if (!booking || booking.status === 'cancelled') return;
      const last = messages.at(-1)?.createdAt ?? null;
      api
        .room(id, last, boardVersion.current)
        .then((r) => {
          if (r.messages.length) {
            setMessages((m) => {
              const known = new Set(m.map((x) => x.id));
              return [...m, ...r.messages.filter((x) => !known.has(x.id))];
            });
          }
          if (r.board) {
            const v = r.board.version;
            boardVersion.current = v;
            setStrokes(r.board.strokes);
            setPending((p) => p.filter((x) => x.version === undefined || x.version > v));
          }
        })
        .catch(() => {});
    },
    2_000,
    [id, booking?.status, messages.at(-1)?.id],
  );

  if (!booking) return <div className="center-note">{error ?? t('Загружаем урок…')}</div>;

  const isTutor = user?.role === 'tutor';
  const back = isTutor ? '/tutor' : '/parent';
  const open = canJoin(booking, now);
  const start = new Date(booking.startsAt).getTime();
  const name = isTutor ? booking.tutor.displayName : booking.child.nickname;
  const room = `${booking.meetingLink}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(`"${name}"`)}`;

  const addStroke = async (s: Stroke) => {
    const entry: { stroke: Stroke; version?: number } = { stroke: s };
    setPending((p) => [...p, entry]);
    try {
      entry.version = (await api.addStroke(id, s)).version;
    } catch {
      setPending((p) => p.filter((x) => x !== entry));
    }
  };

  const video = open ? (
    <div className="video-room">
      <iframe src={room} title={t('Онлайн-урок')} allow="camera; microphone; fullscreen; display-capture; autoplay" />
      <a className="video-pop" href={booking.meetingLink} target="_blank" rel="noreferrer">
        {t('Открыть видео в новой вкладке')}
      </a>
    </div>
  ) : (
    <div className="video-wait">
      {now < start ? (
        <>
          <div className="countdown">{untilText(start - now, t)}</div>
          <b>{t('до начала урока')}</b>
          <p>{t('Видео включится за 10 минут до начала. Доска и чат уже работают.')}</p>
        </>
      ) : (
        <>
          <b>{t('Урок завершён')}</b>
          <Link to={`/tutors/${booking.tutor.id}`} className="btn btn-primary">
            {t('Записаться снова')}
          </Link>
        </>
      )}
    </div>
  );

  return (
    <main className="page lesson">
      <div className="lesson-head card">
        <TutorAvatar name={booking.tutor.displayName} size={56} />
        <div className="lesson-info">
          <h1>{t('Урок с наставником')} {personName(booking.tutor.displayName)}</h1>
          <span className="muted">
            {fmtDateTime(booking.startsAt)} · {t('{n} мин', { n: booking.durationMin })} · {t('ученик')} {booking.child.nickname}
            {booking.isTrial && ` · ${t('пробный урок')}`}
          </span>
        </div>
        <Link to={back} className="btn btn-light">
          {t('Назад')}
        </Link>
      </div>

      {booking.status === 'cancelled' ? (
        <div className="card center-card">
          <h2>{t('Урок отменён')}</h2>
          <Link to="/tutors" className="btn btn-primary">
            {t('Выбрать другое время')}
          </Link>
        </div>
      ) : (
        <Classroom
          video={video}
          strokes={[...strokes, ...pending.map((p) => p.stroke)]}
          onStroke={addStroke}
          onClear={async () => {
            setPending([]);
            await api.clearBoard(id);
          }}
          isTutor={isTutor}
          chat={messages.map((m) => ({
            id: m.id,
            body: m.body,
            mine: m.isTutor === isTutor,
            author: m.isTutor ? personName(booking.tutor.displayName) : booking.child.nickname,
            createdAt: m.createdAt,
          }))}
          onSend={async (body) => {
            const { message } = await api.sendRoomMessage(id, body);
            setMessages((m) => (m.some((x) => x.id === message.id) ? m : [...m, message]));
          }}
          onReport={async () => {
            await api.sendSupport(`Жалоба на урок ${fmtDateTime(booking.startsAt)} с наставником ${booking.tutor.displayName} (урок ${booking.id}).`);
            navigate('/support');
          }}
        />
      )}
    </main>
  );
}

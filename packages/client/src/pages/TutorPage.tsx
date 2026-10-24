import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api, type Booking, type Child, type Slot, type Tutor } from '../api';
import { useAuth } from '../auth';
import { Confetti } from '../components/Confetti';
import { StarIcon } from '../components/Icons';
import { Sprite } from '../components/Sprite';
import { TutorAvatar } from '../components/TutorAvatar';
import { avatarSvg } from '../game/sprites';
import { dayKey, fmtDateTime, fmtTime, languageName, rub, subjectName } from '../format';
import { useT } from '../i18n';

/** Turns YouTube / Vimeo page links into embeddable URLs; other links are shown as a plain link. */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

const DAYS = 14;

export function TutorPage() {
  const t = useT();
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [kids, setKids] = useState<Child[]>([]);
  const [childId, setChildId] = useState<string | null>(params.get('child'));
  const [hasTrial, setHasTrial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState<Booking | null>(null);

  const load = () =>
    api
      .tutor(id)
      .then((r) => {
        setTutor(r.tutor);
        setSlots(r.slots);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'parent') return;
    api.children().then((r) => {
      setKids(r.children);
      setChildId((c) => c ?? r.children[0]?.id ?? null);
    });
    api.bookings().then((r) => setHasTrial(r.bookings.some((b) => b.isTrial && b.status !== 'cancelled')));
  }, [user]);

  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots) m.set(dayKey(s.startsAt), [...(m.get(dayKey(s.startsAt)) ?? []), s]);
    return m;
  }, [slots]);

  const days = useMemo(() => {
    const out: { key: string; date: Date }[] = [];
    const d = new Date();
    for (let i = 0; i < DAYS; i++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      out.push({ key: dayKey(x), date: x });
    }
    return out;
  }, []);

  useEffect(() => {
    if (!day && slots.length) setDay(dayKey(slots[0].startsAt));
  }, [slots, day]);

  if (!tutor) return <div className="center-note">{error ?? t('Загружаем…')}</div>;

  const video = tutor.videoUrl ? embedUrl(tutor.videoUrl) : null;
  const price = hasTrial ? rub(tutor.hourlyRate) : t('Бесплатно');

  const book = async () => {
    if (!slot || !childId) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.book(slot.id, childId);
      setBooked(r.booking);
      setSlot(null);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
      void load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page tutor-page">
      <Link to={`/tutors${childId ? `?child=${childId}` : ''}`} className="back-link">
        {t('← Все наставники')}
      </Link>
      <div className="tutor-layout">
        <section className="card tutor-profile">
          <div className="tp-head">
            <TutorAvatar name={tutor.displayName} size={96} />
            <div>
              <h1>{tutor.displayName}</h1>
              <p className="tp-headline">{tutor.headline}</p>
              <span className="tc-rating">
                <StarIcon on size={18} /> <b>{tutor.rating.toFixed(1)}</b> <span className="muted">· {tutor.reviewsCount}{' '}{t('отзывов')}</span>
              </span>
            </div>
          </div>
          <div className="tags">
            {tutor.subjects.map((s) => (
              <span key={s} className="tag">
                {t(subjectName(s))}
              </span>
            ))}
          </div>
          <dl className="facts">
            <div>
              <dt>{t('Возраст учеников')}</dt>
              <dd>
                {tutor.ageMin}–{tutor.ageMax}{' '}{t('лет')}
              </dd>
            </div>
            <div>
              <dt>{t('Язык уроков')}</dt>
              <dd>{tutor.languages.map(languageName).join(', ')}</dd>
            </div>
            <div>
              <dt>{t('Стоимость')}</dt>
              <dd>{rub(tutor.hourlyRate)}{' '}{t('за 45 минут')}</dd>
            </div>
          </dl>
          {tutor.videoUrl?.startsWith('/api/uploads/') ? (
            <div className="video">
              <video src={tutor.videoUrl} controls preload="metadata" playsInline title={`Видео-знакомство: ${tutor.displayName}`} />
            </div>
          ) : video ? (
            <div className="video">
              <iframe src={video} title={`Видео-знакомство: ${tutor.displayName}`} allow="encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          ) : tutor.videoUrl ? (
            <a href={tutor.videoUrl} target="_blank" rel="noreferrer" className="btn btn-light">
              {t('Смотреть видео-знакомство')}
            </a>
          ) : null}
          <h2 className="card-title">{t('О себе')}</h2>
          <p className="tp-bio">{tutor.bio}</p>
        </section>

        <aside className="card booking-panel">
          <h2 className="card-title">{t('Выберите время')}</h2>
          <p className="muted small">{t('Время указано по вашему часовому поясу. Урок длится 45 минут.')}</p>
          <div className="day-strip">
            {days.map((d) => {
              const n = byDay.get(d.key)?.length ?? 0;
              return (
                <button
                  key={d.key}
                  className={`day${day === d.key ? ' on' : ''}${n === 0 ? ' empty' : ''}`}
                  disabled={n === 0}
                  onClick={() => {
                    setDay(d.key);
                    setSlot(null);
                  }}
                >
                  <span>{d.date.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                  <b>{d.date.getDate()}</b>
                  <small>{n > 0 ? `${n} св.` : '—'}</small>
                </button>
              );
            })}
          </div>
          <div className="times">
            {(day ? byDay.get(day) ?? [] : []).map((s) => (
              <button key={s.id} className={slot?.id === s.id ? 'time on' : 'time'} onClick={() => setSlot(s)}>
                {fmtTime(s.startsAt)}
              </button>
            ))}
            {slots.length === 0 && <p className="muted">{t('Свободного времени пока нет.')}</p>}
          </div>

          {!user ? (
            <div className="bp-foot">
              <p className="small muted">{t('Чтобы записаться, войдите или создайте аккаунт родителя. Первый урок бесплатный.')}</p>
              <Link to={`/register?next=${encodeURIComponent(location.pathname + location.search)}`} className="btn btn-primary">
                {t('Создать аккаунт')}
              </Link>
            </div>
          ) : user.role !== 'parent' ? (
            <p className="small muted">{t('Записываться на уроки могут только родители.')}</p>
          ) : kids.length === 0 ? (
            <div className="bp-foot">
              <p className="small muted">{t('Сначала добавьте профиль ребёнка.')}</p>
              <Link to="/kids" className="btn btn-light">
                {t('Добавить ребёнка')}
              </Link>
            </div>
          ) : (
            <div className="bp-foot">
              <span className="small muted">{t('Для кого урок')}</span>
              <div className="kid-pick">
                {kids.map((k) => (
                  <button key={k.id} className={childId === k.id ? 'kp on' : 'kp'} onClick={() => setChildId(k.id)}>
                    <Sprite svg={avatarSvg(k.avatarUrl)} size={28} /> {k.nickname}
                  </button>
                ))}
              </div>
              <div className="bp-price">
                <span>{hasTrial ? t('Стоимость урока') : t('Пробный урок')}</span>
                <b className={hasTrial ? '' : 'free'}>{price}</b>
              </div>
              {error && <div className="error">{error}</div>}
              <button className="btn btn-primary btn-xl" disabled={!slot || !childId || busy} onClick={book}>
                {slot ? `Записаться на ${fmtDateTime(slot.startsAt)}` : t('Выберите время')}
              </button>
              {hasTrial && <p className="small muted">{t('Оплата платных уроков появится позже, пока урок просто бронируется.')}</p>}
            </div>
          )}
        </aside>
      </div>

      {booked && (
        <div className="modal-bg" onClick={() => setBooked(null)}>
          <Confetti />
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <TutorAvatar name={tutor.displayName} size={84} />
            <h2>{t('Вы записаны!')}</h2>
            <p>
              {fmtDateTime(booked.startsAt)}{t(', урок с наставником')}{' '}{tutor.displayName}{t('. Ученик:')}{' '}{booked.child.nickname}.
              {booked.isTrial && t(' Это бесплатный пробный урок.')}
            </p>
            <p className="small">{t('Ссылка на урок появится в кабинете родителя. Войти можно за 10 минут до начала.')}</p>
            <div className="modal-actions">
              <Link to="/parent" className="btn btn-primary">
                {t('В кабинет родителя')}
              </Link>
              <button className="btn btn-light" onClick={() => setBooked(null)}>
                {t('Закрыть')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

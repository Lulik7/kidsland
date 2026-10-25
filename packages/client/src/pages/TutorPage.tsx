import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { PACKS, withDiscount } from '@kidsland/shared';
import { api, type Billing, type Booking, type Child, type Slot, type Tutor, type TutorReview } from '../api';
import { useAuth } from '../auth';
import { Confetti } from '../components/Confetti';
import { StarIcon } from '../components/Icons';
import { Sprite } from '../components/Sprite';
import { TutorAvatar } from '../components/TutorAvatar';
import { avatarSvg } from '../game/sprites';
import { dayKey, fmtDateTime, fmtTime, languageName, personName, money, subjectName } from '../format';
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
  const [billing, setBilling] = useState<Billing | null>(null);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [canReview, setCanReview] = useState(false);
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
    api.tutorReviews(id).then((r) => setReviews(r.reviews)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'parent') return;
    api.children().then((r) => {
      setKids(r.children);
      setChildId((c) => c ?? r.children[0]?.id ?? null);
    });
    api.billing().then(setBilling).catch(() => undefined);
    api.bookings().then((r) => setCanReview(r.bookings.some((b) => b.tutor.id === id && b.status !== 'cancelled' && new Date(b.startsAt) < new Date())));
  }, [user, id]);

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
  const paidHere = billing?.packages.filter((p) => p.tutor?.id === tutor.id).reduce((n, p) => n + p.lessonsLeft, 0) ?? 0;
  const trialPrice = withDiscount(tutor.price, PACKS[0].discount);
  const buyTrial = async () => {
    setBusy(true);
    setError(null);
    try {
      setBilling(await api.buyPack('trial', tutor.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    } finally {
      setBusy(false);
    }
  };

  const book = async () => {
    if (!slot || !childId) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.book(slot.id, childId);
      setBooked(r.booking);
      api.billing().then(setBilling).catch(() => undefined);
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
            <span className="tc-ava">
              <TutorAvatar name={tutor.displayName} size={96} />
              {tutor.online && <i className="online-dot" />}
            </span>
            <div>
              <h1>{personName(tutor.displayName)}</h1>
              <div className="tc-badges">
                {tutor.online ? <span className="badge-online">● {t('В сети')}</span> : <span className="badge-offline">{t('Не в сети')}</span>}
                {tutor.isNew && <span className="badge-new">✨ {t('Новый наставник')}</span>}
              </div>
              <p className="tp-headline">{t(tutor.headline)}</p>
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
              <dd>{tutor.languages.map((l) => t(languageName(l))).join(', ')}</dd>
            </div>
            <div>
              <dt>{t('Учеников')}</dt>
              <dd>{tutor.students}</dd>
            </div>
            <div>
              <dt>{t('Стоимость')}</dt>
              <dd>{money(tutor.price)}{' '}{t('за 45 минут')}</dd>
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
          <p className="tp-bio">{t(tutor.bio)}</p>
          <Reviews tutorId={tutor.id} reviews={reviews} canWrite={canReview} onAdded={() => { api.tutorReviews(tutor.id).then((r) => setReviews(r.reviews)); void load(); }} />
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
              <p className="small muted">{t('Чтобы записаться, войдите или создайте аккаунт родителя. Пробный урок со скидкой 50%.')}</p>
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
                <span>{t('Оплачено уроков у этого наставника')}</span>
                <b className={paidHere ? 'free' : ''}>{paidHere}</b>
              </div>
              {error && <div className="error">{error}</div>}
              {paidHere > 0 ? (
                <button className="btn btn-primary btn-xl" disabled={!slot || !childId || busy} onClick={book}>
                  {slot ? `${t('Записаться на')} ${fmtDateTime(slot.startsAt)}` : t('Выберите время')}
                </button>
              ) : (
                <div className="bp-buy">
                  {billing?.trialAvailable && (
                    <button className="btn btn-go btn-xl" disabled={busy} onClick={buyTrial}>
                      {t('Пробный урок за')} {money(trialPrice)} <s className="muted">{money(tutor.price)}</s>
                    </button>
                  )}
                  <Link to={`/billing?tutor=${tutor.id}`} className="btn btn-light">
                    {t('Купить пакет уроков')}
                  </Link>
                </div>
              )}
              <p className="small muted">{t('Оплата пока учебная: деньги не списываются.')}</p>
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
              {fmtDateTime(booked.startsAt)}{t(', урок с наставником')}{' '}{personName(tutor.displayName)}{t('. Ученик:')}{' '}{booked.child.nickname}.
              {booked.isTrial && t(' Это пробный урок.')}
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

/** Families' reviews of the tutor and a form for a parent whose child already had a lesson. */
function Reviews({ tutorId, reviews, canWrite, onAdded }: { tutorId: string; reviews: TutorReview[]; canWrite: boolean; onAdded: () => void }) {
  const t = useT();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const send = async () => {
    setError(null);
    try {
      await api.addReview(tutorId, { rating, body, author });
      setSent(true);
      setBody('');
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    }
  };
  return (
    <div className="reviews">
      <h2 className="card-title">
        {t('Отзывы')} <span className="muted small">{reviews.length}</span>
      </h2>
      {reviews.length === 0 && <p className="muted">{t('Отзывов пока нет. Станьте первыми!')}</p>}
      {reviews.map((r) => (
        <div key={r.id} className="review">
          <div className="review-head">
            <b>{r.author}</b>
            <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <span className="muted small">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <p>{r.body}</p>
        </div>
      ))}
      {canWrite ? (
        sent ? (
          <p className="ok-note">✓ {t('Спасибо! Отзыв опубликован.')}</p>
        ) : (
          <div className="review-form">
            <h3>{t('Написать отзыв')}</h3>
            <div className="review-rate" role="radiogroup" aria-label={t('Оценка')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className={n <= rating ? 'on' : ''} onClick={() => setRating(n)} aria-label={`${n}`}>
                  ★
                </button>
              ))}
            </div>
            <input placeholder={t('Как вас подписать, например: Мама Сони')} value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={40} />
            <textarea placeholder={t('Что понравилось на уроках?')} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} />
            {error && <div className="error">{error}</div>}
            <button className="btn btn-primary" disabled={body.trim().length < 10 || author.trim().length < 2} onClick={send}>
              {t('Опубликовать')}
            </button>
          </div>
        )
      ) : (
        <p className="small muted">{t('Отзыв можно написать после первого урока с этим наставником.')}</p>
      )}
    </div>
  );
}

import { COUNTRY_CODES, LANGUAGES, TUTOR_SAFETY_RULES, TUTOR_SECTIONS, type CountryCode } from '@kidsland/shared';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type Booking, type Slot, type Tutor, type TutorProfileInput } from '../api';
import { BookingCard } from '../components/BookingCard';
import { NotifySettings } from '../components/NotifySettings';
import { TutorApplicationForm } from '../components/TutorApplicationForm';
import { TutorAvatar } from '../components/TutorAvatar';
import { countryName, dayKey, fmtDay, fmtTime } from '../format';
import { tSentences, useT } from '../i18n';
import { applyContent } from '../siteContent';

type Tab = 'lessons' | 'schedule' | 'profile' | 'application';
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const toInput = (t: Tutor): TutorProfileInput => ({
  displayName: t.displayName,
  headline: t.headline,
  bio: t.bio,
  videoUrl: t.videoUrl ?? '',
  subjects: t.subjects,
  languages: t.languages,
  country: t.country,
  ageMin: t.ageMin,
  ageMax: t.ageMax,
  hourlyRate: t.hourlyRate,
  isPublished: t.isPublished,
});

export function TutorCabinet() {
  const t = useT();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [tab, setTab] = useState<Tab>('lessons');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .myTutorProfile()
      .then((r) => {
        setTutor(r.tutor);
        if (!r.tutor.isPublished) setTab('profile');
      })
      .catch((e) => setError(e.message));
  }, []);

  if (!tutor) return <div className="center-note">{error ?? t('Загружаем…')}</div>;

  return (
    <main className="page cabinet">
      <div className="dash-head">
        <div className="cab-who">
          <TutorAvatar name={tutor.displayName} photo={tutor.avatar} size={64} />
          <div>
            <h1 className="page-title left">{t('Кабинет наставника')}</h1>
            <span className={`chip ${tutor.isPublished ? 'chip-free' : 'chip-muted'}`}>
              {tutor.isPublished
                ? t('Профиль виден родителям')
                : tutor.verification === 'pending'
                  ? t('Анкета на проверке у администратора')
                  : tutor.verification === 'rejected'
                    ? t('Анкета отклонена: посмотрите комментарий')
                    : tutor.verification === 'approved'
                      ? t('Профиль скрыт: заполните и опубликуйте')
                      : t('Профиль скрыт: заполните анкету и отправьте на проверку')}
            </span>
          </div>
        </div>
        {tutor.isPublished && (
          <Link to={`/tutors/${tutor.id}`} className="btn btn-light">
            {t('Как видят родители')}
          </Link>
        )}
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['lessons', 'Уроки'],
            ['schedule', 'Расписание'],
            ['profile', 'Профиль'],
            ['application', 'Анкета и документы'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'tab on' : 'tab'} onClick={() => setTab(k)}>
            {t(label)}
          </button>
        ))}
      </div>
      {tab === 'lessons' && <Lessons />}
      {tab === 'schedule' && <Schedule />}
      {tab === 'application' && <TutorApplicationForm tutor={tutor} onTutor={setTutor} />}
      {tab === 'profile' && (
        <div className="profile-layout">
          <ProfileForm tutor={tutor} onSaved={setTutor} onApplication={() => setTab('application')} />
          <aside className="profile-side">
            <VideoIntro tutor={tutor} onSaved={setTutor} />
            <div className="card safety-card">
              <h2 className="card-title">{t('🛡 Правила работы с детьми')}</h2>
              <ul>
                {TUTOR_SAFETY_RULES.map((r) => <li key={r}>{t(r)}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

const MAX_VIDEO_MB = 100;

/** Uploading a video file for the profile; a YouTube link still works through the form. */
function VideoIntro({ tutor, onSaved }: { tutor: Tutor; onSaved: (t: Tutor) => void }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const uploaded = tutor.videoUrl?.startsWith('/api/uploads/') ? tutor.videoUrl : null;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setMsg(null);
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      return setMsg({ ok: false, text: t('Подойдёт видео в формате MP4, WebM или MOV.') });
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      return setMsg({ ok: false, text: t('Файл больше {n} МБ. Сожмите видео или загрузите его на YouTube и вставьте ссылку.', { n: MAX_VIDEO_MB }) });
    }
    setBusy(true);
    try {
      const r = await api.uploadVideo(file);
      onSaved(r.tutor);
      setMsg({ ok: true, text: t('Видео загружено и появилось в профиле.') });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? tSentences(t, e.message) : t('Не удалось загрузить') });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="card video-intro">
      <h2 className="card-title">{t('🎬 Видео-знакомство')}</h2>
      <p className="muted small">
        {t('Расскажите о себе за 1–2 минуты: как проходят уроки и чем вы увлекаетесь. Профили с видео выбирают чаще.')}
      </p>
      {uploaded ? (
        <div className="video">
          <video src={uploaded} controls preload="metadata" playsInline />
        </div>
      ) : tutor.videoUrl ? (
        <p className="small">{t('Сейчас в профиле видео по ссылке:')} <a href={tutor.videoUrl} target="_blank" rel="noreferrer">{tutor.videoUrl}</a></p>
      ) : (
        <div className="video-empty">{t('Видео пока нет')}</div>
      )}
      <input ref={input} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? t('Загружаем…') : uploaded ? t('Заменить видео') : t('Загрузить видео')}
        </button>
        {tutor.videoUrl && (
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={async () => {
              const r = await api.deleteVideo();
              onSaved(r.tutor);
              setMsg(null);
            }}
          >
            {t('Удалить')}
          </button>
        )}
      </div>
      <span className="muted small">{t('MP4, WebM или MOV до {n} МБ. Или вставьте ссылку на YouTube в форме профиля.', { n: MAX_VIDEO_MB })}</span>
      {msg && <div className={msg.ok ? 'success' : 'error'}>{msg.text}</div>}
    </div>
  );
}

function Lessons() {
  const t = useT();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  useEffect(() => {
    api.bookings().then((r) => setBookings(r.bookings));
  }, []);
  if (!bookings) return <div className="center-note">{t('Загружаем…')}</div>;
  const upcoming = bookings.filter(
    (b) => (b.status === 'scheduled' || b.status === 'cancelled') && new Date(b.startsAt).getTime() > Date.now() - 3_600_000,
  );
  return (
    <section className="card">
      <h2 className="card-title">{t('Ближайшие уроки')}</h2>
      {upcoming.length === 0 ? (
        <p className="muted">{t('Записей пока нет. Добавьте свободное время во вкладке «Расписание».')}</p>
      ) : (
        <div className="booking-list">
          {upcoming.map((b) => (
            <BookingCard key={b.id} booking={b} viewer="tutor" onChange={(nb) => setBookings((all) => all!.map((x) => (x.id === nb.id ? nb : x)))} />
          ))}
        </div>
      )}
      <details className="dash-settings">
        <summary>🔔 {t('Напоминания об уроках')}</summary>
        <NotifySettings />
      </details>
    </section>
  );
}

function Schedule() {
  const t = useT();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const tomorrow = new Date(Date.now() + 86_400_000);
  const [date, setDate] = useState(dayKey(tomorrow));
  const [hours, setHours] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => api.mySlots().then((r) => setSlots(r.slots));
  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots ?? []) m.set(dayKey(s.startsAt), [...(m.get(dayKey(s.startsAt)) ?? []), s]);
    return [...m.entries()];
  }, [slots]);

  const add = async () => {
    setMsg(null);
    const [y, mo, d] = date.split('-').map(Number);
    const startsAt = hours.map((h) => new Date(y, mo - 1, d, h).toISOString());
    try {
      const r = await api.addSlots(startsAt);
      setMsg(r.added ? t('Добавлено слотов: {n}', { n: r.added }) : t('Эти слоты уже есть'));
      setHours([]);
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? tSentences(t, e.message) : t('Ошибка'));
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteSlot(id);
      void load();
    } catch (e) {
      window.alert(e instanceof Error ? tSentences(t, e.message) : t('Ошибка'));
    }
  };

  return (
    <div className="dash-grid">
      <section className="card">
        <h2 className="card-title">{t('Добавить свободное время')}</h2>
        <label>
          {t('День')}
          <input type="date" value={date} min={dayKey(new Date())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <span className="field-label">{t('Начало урока (по вашему времени)')}</span>
        <div className="times">
          {HOURS.map((h) => (
            <button key={h} className={hours.includes(h) ? 'time on' : 'time'} onClick={() => setHours((hs) => (hs.includes(h) ? hs.filter((x) => x !== h) : [...hs, h]))}>
              {String(h).padStart(2, '0')}:00
            </button>
          ))}
        </div>
        <button className="btn btn-primary" disabled={hours.length === 0} onClick={add}>
          {t('Добавить')} {hours.length > 0 ? `(${hours.length})` : ''}
        </button>
        {msg && <p className="small muted">{msg}</p>}
      </section>
      <section className="card">
        <h2 className="card-title">{t('Ваше расписание')}</h2>
        {!slots ? (
          <p className="muted">{t('Загружаем…')}</p>
        ) : grouped.length === 0 ? (
          <p className="muted">{t('Свободного времени пока нет.')}</p>
        ) : (
          <div className="sched">
            {grouped.map(([key, list]) => (
              <div key={key} className="sched-day">
                <b>{fmtDay(list[0].startsAt)}</b>
                <div className="times">
                  {list.map((s) => (
                    <span key={s.id} className={`slot-pill${s.booked ? ' booked' : ''}`}>
                      {fmtTime(s.startsAt)}
                      {s.booked ? (
                        ` · ${t('запись')}`
                      ) : (
                        <button aria-label={t('Удалить слот')} onClick={() => remove(s.id)}>
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileForm({ tutor, onSaved, onApplication }: { tutor: Tutor; onSaved: (t: Tutor) => void; onApplication: () => void }) {
  const t = useT();
  const [p, setP] = useState<TutorProfileInput>(toInput(tutor));
  useEffect(() => setP((x) => ({ ...x, videoUrl: tutor.videoUrl ?? '' })), [tutor.videoUrl]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof TutorProfileInput>(k: K, v: TutorProfileInput[K]) => setP((x) => ({ ...x, [k]: v }));
  const toggle = (k: 'subjects' | 'languages', id: string) =>
    set(k, p[k].includes(id) ? p[k].filter((x) => x !== id) : [...p[k], id]);

  const save = async (e: FormEvent, publish?: boolean) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.saveTutorProfile({ ...p, isPublished: publish ?? p.isPublished });
      onSaved(r.tutor);
      setP(toInput(r.tutor));
      setMsg({ ok: true, text: r.tutor.isPublished ? t('Сохранено. Профиль виден родителям.') : t('Сохранено.') });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? tSentences(t, err.message) : t('Ошибка') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card profile-form" onSubmit={save}>
      <div className="form-grid">
        <label>
          {t('Имя и фамилия')}
          <input value={p.displayName} onChange={(e) => set('displayName', e.target.value)} required minLength={2} />
        </label>
        <label>
          {t('Коротко о ваших уроках')}
          <input value={p.headline} onChange={(e) => set('headline', e.target.value)} placeholder={t('Например: Python для начинающих')} maxLength={120} />
        </label>
      </div>
      <label>
        {t('О себе')}
        <textarea rows={5} value={p.bio} onChange={(e) => set('bio', e.target.value)} maxLength={2000} placeholder={t('Опыт, подход к урокам, чем занимаетесь с детьми')} />
      </label>
      <label>
        {t('Видео-знакомство: ссылка на YouTube или Vimeo (или загрузите файл справа)')}
        <input value={p.videoUrl.startsWith('/api/uploads/') ? '' : p.videoUrl} disabled={p.videoUrl.startsWith('/api/uploads/')} onChange={(e) => set('videoUrl', e.target.value)} placeholder={p.videoUrl.startsWith('/api/uploads/') ? t('Загружен файл с видео') : 'https://youtu.be/…'} />
      </label>
      <span className="field-label">{t('Предметы')}</span>
      {TUTOR_SECTIONS.map((sec) => (
        <div key={sec.id} className="subject-group">
          <b>{t(sec.name)}</b>
          <div className="chips-row">
            {sec.topics.map((s) => (
              <button type="button" key={s.id} className={p.subjects.includes(s.id) ? 'fchip on' : 'fchip'} onClick={() => toggle('subjects', s.id)}>
                {t(s.name)}
              </button>
            ))}
            <OtherTopic section={sec.id} onAdded={(id) => setP((x) => (x.subjects.includes(id) ? x : { ...x, subjects: [...x.subjects, id] }))} />
          </div>
        </div>
      ))}
      <span className="field-label">{t('Языки')}</span>
      <div className="chips-row">
        {LANGUAGES.map((l) => (
          <button type="button" key={l.id} className={p.languages.includes(l.id) ? 'fchip on' : 'fchip'} onClick={() => toggle('languages', l.id)}>
            {t(l.name)}
          </button>
        ))}
      </div>
      <label>
        {t('Страна, где вы живёте')}
        <select value={p.country ?? ''} onChange={(e) => set('country', (e.target.value || null) as CountryCode | null)}>
          <option value="">{t('Не указана')}</option>
          {[...COUNTRY_CODES]
            .sort((a, b) => countryName(a).localeCompare(countryName(b)))
            .map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
        </select>
      </label>
      <div className="form-grid three">
        <label>
          {t('Возраст от')}
          <input type="number" min={4} max={18} value={p.ageMin} onChange={(e) => set('ageMin', Number(e.target.value))} />
        </label>
        <label>
          {t('до')}
          <input type="number" min={4} max={18} value={p.ageMax} onChange={(e) => set('ageMax', Number(e.target.value))} />
        </label>
        <p className="small muted price-note">{t('Цена урока назначается автоматически: у нового наставника 40 ₪, и она растёт вместе с числом учеников.')}</p>
      </div>
      {msg && <div className={msg.ok ? 'success' : 'error'}>{msg.text}</div>}
      <div className="form-actions">
        <button className="btn btn-light" disabled={busy}>
          {t('Сохранить')}
        </button>
        {tutor.isPublished ? (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={(e) => save(e, false)}>
            {t('Скрыть профиль')}
          </button>
        ) : tutor.verification === 'approved' ? (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={(e) => save(e, true)}>
            {t('Сохранить и опубликовать')}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onApplication}>
            {t('Дальше: анкета и документы')}
          </button>
        )}
      </div>
    </form>
  );
}

/** «Other…» in a section: the tutor types a topic the site does not have yet, and it is added for everyone. */
function OtherTopic({ section, onAdded }: { section: string; onAdded: (id: string) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open)
    return (
      <button type="button" className="fchip" onClick={() => setOpen(true)}>
        + {t('Другое')}
      </button>
    );
  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.addTutorTopic(section, name);
      applyContent(r.content, true);
      onAdded(r.topic.id);
      setName('');
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Ошибка'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="other-topic">
      <input
        value={name}
        autoFocus
        maxLength={40}
        placeholder={t('Чему вы учите? Например: Армянский')}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (name.trim().length >= 2) add();
          }
        }}
      />
      <button type="button" className="btn btn-light btn-small" disabled={busy || name.trim().length < 2} onClick={add}>
        {t('Добавить')}
      </button>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => setOpen(false)}>
        {t('Отмена')}
      </button>
      {error && <span className="error small">{error}</span>}
    </span>
  );
}

import { LANGUAGES, TUTOR_SAFETY_RULES, TUTOR_SECTIONS } from '@kidsland/shared';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type Booking, type Slot, type Tutor, type TutorProfileInput } from '../api';
import { BookingCard } from '../components/BookingCard';
import { TutorAvatar } from '../components/TutorAvatar';
import { dayKey, fmtDay, fmtTime } from '../format';

type Tab = 'lessons' | 'schedule' | 'profile';
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const toInput = (t: Tutor): TutorProfileInput => ({
  displayName: t.displayName,
  headline: t.headline,
  bio: t.bio,
  videoUrl: t.videoUrl ?? '',
  subjects: t.subjects,
  languages: t.languages,
  ageMin: t.ageMin,
  ageMax: t.ageMax,
  hourlyRate: t.hourlyRate,
  isPublished: t.isPublished,
});

export function TutorCabinet() {
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

  if (!tutor) return <div className="center-note">{error ?? 'Загружаем…'}</div>;

  return (
    <main className="page cabinet">
      <div className="dash-head">
        <div className="cab-who">
          <TutorAvatar name={tutor.displayName} size={64} />
          <div>
            <h1 className="page-title left">Кабинет наставника</h1>
            <span className={`chip ${tutor.isPublished ? 'chip-free' : 'chip-muted'}`}>
              {tutor.isPublished ? 'Профиль виден родителям' : 'Профиль скрыт: заполните и опубликуйте'}
            </span>
          </div>
        </div>
        {tutor.isPublished && (
          <Link to={`/tutors/${tutor.id}`} className="btn btn-light">
            Как видят родители
          </Link>
        )}
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['lessons', 'Уроки'],
            ['schedule', 'Расписание'],
            ['profile', 'Профиль'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'tab on' : 'tab'} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'lessons' && <Lessons />}
      {tab === 'schedule' && <Schedule />}
      {tab === 'profile' && (
        <div className="profile-layout">
          <ProfileForm tutor={tutor} onSaved={setTutor} />
          <aside className="profile-side">
            <VideoIntro tutor={tutor} onSaved={setTutor} />
            <div className="card safety-card">
              <h2 className="card-title">🛡 Правила работы с детьми</h2>
              <ul>
                {TUTOR_SAFETY_RULES.map((r) => <li key={r}>{r}</li>)}
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
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const uploaded = tutor.videoUrl?.startsWith('/api/uploads/') ? tutor.videoUrl : null;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setMsg(null);
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      return setMsg({ ok: false, text: 'Подойдёт видео в формате MP4, WebM или MOV.' });
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      return setMsg({ ok: false, text: `Файл больше ${MAX_VIDEO_MB} МБ. Сожмите видео или загрузите его на YouTube и вставьте ссылку.` });
    }
    setBusy(true);
    try {
      const r = await api.uploadVideo(file);
      onSaved(r.tutor);
      setMsg({ ok: true, text: 'Видео загружено и появилось в профиле.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Не удалось загрузить' });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="card video-intro">
      <h2 className="card-title">🎬 Видео-знакомство</h2>
      <p className="muted small">
        Расскажите о себе за 1–2 минуты: как проходят уроки и чем вы увлекаетесь. Профили с видео выбирают чаще.
      </p>
      {uploaded ? (
        <div className="video">
          <video src={uploaded} controls preload="metadata" playsInline />
        </div>
      ) : tutor.videoUrl ? (
        <p className="small">Сейчас в профиле видео по ссылке: <a href={tutor.videoUrl} target="_blank" rel="noreferrer">{tutor.videoUrl}</a></p>
      ) : (
        <div className="video-empty">Видео пока нет</div>
      )}
      <input ref={input} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Загружаем…' : uploaded ? 'Заменить видео' : 'Загрузить видео'}
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
            Удалить
          </button>
        )}
      </div>
      <span className="muted small">MP4, WebM или MOV до {MAX_VIDEO_MB} МБ. Или вставьте ссылку на YouTube в форме профиля.</span>
      {msg && <div className={msg.ok ? 'success' : 'error'}>{msg.text}</div>}
    </div>
  );
}

function Lessons() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  useEffect(() => {
    api.bookings().then((r) => setBookings(r.bookings));
  }, []);
  if (!bookings) return <div className="center-note">Загружаем…</div>;
  const upcoming = bookings.filter(
    (b) => (b.status === 'scheduled' || b.status === 'cancelled') && new Date(b.startsAt).getTime() > Date.now() - 3_600_000,
  );
  return (
    <section className="card">
      <h2 className="card-title">Ближайшие уроки</h2>
      {upcoming.length === 0 ? (
        <p className="muted">Записей пока нет. Добавьте свободное время во вкладке «Расписание».</p>
      ) : (
        <div className="booking-list">
          {upcoming.map((b) => (
            <BookingCard key={b.id} booking={b} viewer="tutor" onChange={(nb) => setBookings((all) => all!.map((x) => (x.id === nb.id ? nb : x)))} />
          ))}
        </div>
      )}
    </section>
  );
}

function Schedule() {
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
      setMsg(r.added ? `Добавлено слотов: ${r.added}` : 'Эти слоты уже есть');
      setHours([]);
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteSlot(id);
      void load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <div className="dash-grid">
      <section className="card">
        <h2 className="card-title">Добавить свободное время</h2>
        <label>
          День
          <input type="date" value={date} min={dayKey(new Date())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <span className="field-label">Начало урока (по вашему времени)</span>
        <div className="times">
          {HOURS.map((h) => (
            <button key={h} className={hours.includes(h) ? 'time on' : 'time'} onClick={() => setHours((hs) => (hs.includes(h) ? hs.filter((x) => x !== h) : [...hs, h]))}>
              {String(h).padStart(2, '0')}:00
            </button>
          ))}
        </div>
        <button className="btn btn-primary" disabled={hours.length === 0} onClick={add}>
          Добавить {hours.length > 0 ? `(${hours.length})` : ''}
        </button>
        {msg && <p className="small muted">{msg}</p>}
      </section>
      <section className="card">
        <h2 className="card-title">Ваше расписание</h2>
        {!slots ? (
          <p className="muted">Загружаем…</p>
        ) : grouped.length === 0 ? (
          <p className="muted">Свободного времени пока нет.</p>
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
                        ' · запись'
                      ) : (
                        <button aria-label="Удалить слот" onClick={() => remove(s.id)}>
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

function ProfileForm({ tutor, onSaved }: { tutor: Tutor; onSaved: (t: Tutor) => void }) {
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
      setMsg({ ok: true, text: r.tutor.isPublished ? 'Сохранено. Профиль виден родителям.' : 'Сохранено.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card profile-form" onSubmit={save}>
      <div className="form-grid">
        <label>
          Имя и фамилия
          <input value={p.displayName} onChange={(e) => set('displayName', e.target.value)} required minLength={2} />
        </label>
        <label>
          Коротко о ваших уроках
          <input value={p.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Например: Python для начинающих" maxLength={120} />
        </label>
      </div>
      <label>
        О себе
        <textarea rows={5} value={p.bio} onChange={(e) => set('bio', e.target.value)} maxLength={2000} placeholder="Опыт, подход к урокам, чем занимаетесь с детьми" />
      </label>
      <label>
        Видео-знакомство: ссылка на YouTube или Vimeo (или загрузите файл справа)
        <input value={p.videoUrl.startsWith('/api/uploads/') ? '' : p.videoUrl} disabled={p.videoUrl.startsWith('/api/uploads/')} onChange={(e) => set('videoUrl', e.target.value)} placeholder={p.videoUrl.startsWith('/api/uploads/') ? 'Загружен файл с видео' : 'https://youtu.be/…'} />
      </label>
      <span className="field-label">Предметы</span>
      {TUTOR_SECTIONS.map((sec) => (
        <div key={sec.id} className="subject-group">
          <b>{sec.name}</b>
          <div className="chips-row">
            {sec.topics.map((s) => (
              <button type="button" key={s.id} className={p.subjects.includes(s.id) ? 'fchip on' : 'fchip'} onClick={() => toggle('subjects', s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      <span className="field-label">Языки</span>
      <div className="chips-row">
        {LANGUAGES.map((l) => (
          <button type="button" key={l.id} className={p.languages.includes(l.id) ? 'fchip on' : 'fchip'} onClick={() => toggle('languages', l.id)}>
            {l.name}
          </button>
        ))}
      </div>
      <div className="form-grid three">
        <label>
          Возраст от
          <input type="number" min={4} max={18} value={p.ageMin} onChange={(e) => set('ageMin', Number(e.target.value))} />
        </label>
        <label>
          до
          <input type="number" min={4} max={18} value={p.ageMax} onChange={(e) => set('ageMax', Number(e.target.value))} />
        </label>
        <label>
          Цена урока, ₽
          <input type="number" min={0} max={50000} step={100} value={p.hourlyRate} onChange={(e) => set('hourlyRate', Number(e.target.value))} />
        </label>
      </div>
      {msg && <div className={msg.ok ? 'success' : 'error'}>{msg.text}</div>}
      <div className="form-actions">
        <button className="btn btn-light" disabled={busy}>
          Сохранить
        </button>
        {tutor.isPublished ? (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={(e) => save(e, false)}>
            Скрыть профиль
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={(e) => save(e, true)}>
            Сохранить и опубликовать
          </button>
        )}
      </div>
    </form>
  );
}

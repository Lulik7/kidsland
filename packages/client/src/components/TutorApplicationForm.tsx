import { useEffect, useState } from 'react';
import {
  api,
  openPrivateFile,
  type DocumentKind,
  type EducationItem,
  type ExperienceItem,
  type Tutor,
  type TutorApplication,
  type TutorDocument,
} from '../api';
import { fmtDay } from '../format';
import { tSentences, useT } from '../i18n';

const MAX_DOC_MB = 10;
const thisYear = new Date().getFullYear();
const KINDS: [DocumentKind, string][] = [
  ['diploma', 'Диплом'],
  ['certificate', 'Сертификат'],
  ['identity', 'Удостоверение личности или паспорт'],
  ['other', 'Другой документ'],
];

/** Year fields: a start year and an end year, or "still here". */
function Years({ from, to, onChange }: { from: number; to: number | null; onChange: (from: number, to: number | null) => void }) {
  const t = useT();
  return (
    <div className="app-years">
      <label>
        {t('С какого года')}
        <input type="number" min={1950} max={thisYear} value={from} onChange={(e) => onChange(Number(e.target.value), to)} />
      </label>
      <label>
        {t('По какой год')}
        <input
          type="number"
          min={1950}
          max={thisYear + 6}
          value={to ?? ''}
          disabled={to === null}
          placeholder={t('по сей день')}
          onChange={(e) => onChange(from, Number(e.target.value))}
        />
      </label>
      <label className="check-label">
        <input type="checkbox" checked={to === null} onChange={(e) => onChange(from, e.target.checked ? null : thisYear)} />
        {t('по сей день')}
      </label>
    </div>
  );
}

/** The tutor's application: education, work experience and documents, sent to an admin for review. */
export function TutorApplicationForm({ tutor, onTutor }: { tutor: Tutor; onTutor: (t: Tutor) => void }) {
  const t = useT();
  const [app, setApp] = useState<TutorApplication | null>(null);
  const [docs, setDocs] = useState<TutorDocument[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [kind, setKind] = useState<DocumentKind>('diploma');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api
      .myApplication()
      .then((r) => {
        setApp(r.application);
        setDocs(r.documents);
        setEducation(r.application.education);
        setExperience(r.application.experience);
      })
      .catch((e) => setMsg({ ok: false, text: tSentences(t, e.message) }));
  }, [t]);

  const act = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fn();
      if (text) setMsg({ ok: true, text });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? tSentences(t, e.message) : t('Ошибка') });
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    act(async () => {
      const r = await api.saveApplication({ education, experience });
      setApp(r.application);
      return t('Сохранено.');
    });

  if (!app) return <div className="card">{msg ? <div className="error">{msg.text}</div> : t('Загружаем…')}</div>;
  const locked = app.status === 'pending';

  return (
    <div className="card app-form">
      <div className={`app-status status-${app.status}`}>
        {app.status === 'draft' && t('Заполните анкету, загрузите дипломы или сертификаты и отправьте на проверку. После одобрения ваш профиль увидят родители.')}
        {app.status === 'pending' && t('Анкета на проверке у администратора. Обычно это занимает 1–2 дня.')}
        {app.status === 'approved' && t('Анкета одобрена. Ваш профиль можно показывать родителям.')}
        {app.status === 'rejected' && t('Анкета отклонена. Исправьте, что просит администратор, и отправьте снова.')}
        {app.note && (
          <div className="app-note">
            <b>{t('Комментарий администратора')}:</b> {app.note}
          </div>
        )}
      </div>

      <h2 className="card-title">{t('Образование')}</h2>
      {education.map((e, i) => (
        <div key={i} className="app-item">
          <div className="form-grid">
            <label>
              {t('Учебное заведение')}
              <input disabled={locked} value={e.institution} onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, institution: ev.target.value } : x)))} />
            </label>
            <label>
              {t('Специальность')}
              <input disabled={locked} value={e.specialty} onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, specialty: ev.target.value } : x)))} />
            </label>
          </div>
          <Years from={e.yearFrom} to={e.yearTo} onChange={(yearFrom, yearTo) => setEducation(education.map((x, j) => (j === i ? { ...x, yearFrom, yearTo } : x)))} />
          {!locked && (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setEducation(education.filter((_, j) => j !== i))}>
              {t('Удалить')}
            </button>
          )}
        </div>
      ))}
      {!locked && (
        <button type="button" className="btn btn-light" onClick={() => setEducation([...education, { institution: '', specialty: '', yearFrom: thisYear - 4, yearTo: thisYear }])}>
          {t('+ Добавить место учёбы')}
        </button>
      )}

      <h2 className="card-title">{t('Опыт работы')}</h2>
      {experience.map((e, i) => (
        <div key={i} className="app-item">
          <div className="form-grid">
            <label>
              {t('Место работы')}
              <input disabled={locked} value={e.place} onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, place: ev.target.value } : x)))} />
            </label>
            <label>
              {t('Должность')}
              <input disabled={locked} value={e.position} onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, position: ev.target.value } : x)))} />
            </label>
          </div>
          <Years from={e.yearFrom} to={e.yearTo} onChange={(yearFrom, yearTo) => setExperience(experience.map((x, j) => (j === i ? { ...x, yearFrom, yearTo } : x)))} />
          {!locked && (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setExperience(experience.filter((_, j) => j !== i))}>
              {t('Удалить')}
            </button>
          )}
        </div>
      ))}
      {!locked && (
        <button type="button" className="btn btn-light" onClick={() => setExperience([...experience, { place: '', position: '', yearFrom: thisYear - 2, yearTo: null }])}>
          {t('+ Добавить место работы')}
        </button>
      )}
      {!locked && (
        <div className="form-actions">
          <button type="button" className="btn btn-light" disabled={busy} onClick={save}>
            {t('Сохранить анкету')}
          </button>
        </div>
      )}

      <h2 className="card-title">{t('Документы для проверки')}</h2>
      <p className="muted small">{t('Нужны диплом или сертификат и копия удостоверения личности или паспорта.')}</p>
      <p className="muted small">{t('PDF, JPG или PNG до {n} МБ. Документы видит только администратор.', { n: MAX_DOC_MB })}</p>
      {docs.length > 0 && (
        <div className="doc-list">
          {docs.map((d) => (
            <span key={d.id} className="doc-chip">
              <button type="button" className="link-btn" onClick={() => openPrivateFile(`/tutor/documents/${d.id}/file`).catch(() => {})}>
                {t(KINDS.find((k) => k[0] === d.kind)?.[1] ?? '')}: {d.title}
              </button>
              <span className="muted small"> · {fmtDay(d.createdAt)}</span>
              {!locked && (
                <button
                  type="button"
                  className="chip-x"
                  aria-label={t('Удалить')}
                  onClick={() =>
                    act(async () => {
                      await api.deleteDocument(d.id);
                      setDocs(docs.filter((x) => x.id !== d.id));
                    })
                  }
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {!locked && (
        <div className="cms-row">
          <select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
            {KINDS.map(([k, label]) => (
              <option key={k} value={k}>
                {t(label)}
              </option>
            ))}
          </select>
          <input placeholder={t('Название, например: Диплом МГУ')} value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className={`btn btn-light file-btn${busy || title.trim().length < 2 ? ' disabled' : ''}`}>
            {t('Выбрать файл')}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              hidden
              disabled={busy || title.trim().length < 2}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > MAX_DOC_MB * 1024 * 1024) {
                  setMsg({ ok: false, text: t('Файл больше {n} МБ', { n: MAX_DOC_MB }) });
                  return;
                }
                act(async () => {
                  const r = await api.uploadDocument(file, kind, title.trim());
                  setDocs([...docs, r.document]);
                  setTitle('');
                  return t('Документ загружен.');
                });
              }}
            />
          </label>
        </div>
      )}
      {!locked && title.trim().length < 2 && <p className="muted small">{t('Сначала напишите название документа, потом выберите файл.')}</p>}

      {msg && <div className={msg.ok ? 'success' : 'error'}>{msg.text}</div>}
      {!locked && app.status !== 'approved' && (
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              act(async () => {
                await api.saveApplication({ education, experience });
                const r = await api.submitApplication();
                setApp(r.application);
                onTutor(r.tutor);
                return t('Анкета отправлена администратору.');
              })
            }
          >
            {t('Отправить на проверку')}
          </button>
        </div>
      )}
      {!locked && app.status === 'approved' && <p className="muted small">{t('Изменения в анкете сохраняются без новой проверки.')}</p>}
    </div>
  );
}

import { topicName } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { api, openPrivateFile, type AdminApplication, type VerificationStatus } from '../../api';
import { fmtDateTime, languageName } from '../../format';

export const statusName: Record<VerificationStatus, string> = {
  draft: 'Черновик',
  pending: 'На проверке',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};
const docKind = { diploma: 'Диплом', certificate: 'Сертификат', identity: 'Удостоверение личности', other: 'Документ' } as const;
const years = (from: number, to: number | null) => `${from} – ${to ?? 'по сей день'}`;

/** Tutors who want a public profile: their story, education, experience and documents. */
export function TutorApplications({ focus, onChanged }: { focus: string | null; onChanged: () => void }) {
  const [status, setStatus] = useState<VerificationStatus | 'all'>('pending');
  const [list, setList] = useState<AdminApplication[] | null>(null);
  const [open, setOpen] = useState<string | null>(focus);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setOpen(focus), [focus]);
  useEffect(() => {
    setList(null);
    api.tutorApplications(status).then((r) => setList(r.applications)).catch((e) => setError(e.message));
  }, [status]);

  const review = async (a: AdminApplication, decision: 'approve' | 'reject') => {
    setError(null);
    try {
      const updated = await api.reviewTutor(a.tutor.id, decision, notes[a.tutor.id] ?? '');
      setList((l) => l?.map((x) => (x.tutor.id === a.tutor.id ? updated : x)) ?? null);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Анкеты преподавателей</h2>
      <p className="muted small">
        Преподаватель появится в каталоге только после одобрения. При отказе он увидит ваш комментарий и сможет исправить анкету.
      </p>
      <div className="chips-row">
        {(['pending', 'approved', 'rejected', 'draft', 'all'] as const).map((s) => (
          <button key={s} className={status === s ? 'fchip on' : 'fchip'} onClick={() => setStatus(s)}>
            {s === 'all' ? 'Все' : statusName[s]}
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      {!list ? (
        <p className="muted">Загружаем…</p>
      ) : list.length === 0 ? (
        <p className="muted">Анкет нет.</p>
      ) : (
        <div className="flag-list">
          {list.map((a) => {
            const isOpen = open === a.tutor.id;
            return (
              <div key={a.tutor.id} className="flag app-card">
                <button className="app-head" onClick={() => setOpen(isOpen ? null : a.tutor.id)}>
                  <b>{a.tutor.displayName}</b>
                  <span className={`chip status-${a.application.status}`}>{statusName[a.application.status]}</span>
                  <span className="muted small">
                    {a.tutor.email}
                    {a.application.submittedAt && ` · отправлена ${fmtDateTime(a.application.submittedAt)}`}
                  </span>
                  <span className="app-toggle">{isOpen ? 'Свернуть' : 'Открыть'}</span>
                </button>
                {isOpen && (
                  <div className="app-body">
                    <p>
                      <b>{a.tutor.headline}</b>
                    </p>
                    <p className="pre-line">{a.tutor.bio}</p>
                    <p className="muted small">
                      Темы: {a.tutor.subjects.map(topicName).join(', ') || '—'} · Языки: {a.tutor.languages.map(languageName).join(', ')} ·
                      Возраст {a.tutor.ageMin}–{a.tutor.ageMax} · {a.tutor.hourlyRate} ₽/час
                    </p>
                    <h3 className="app-sub">Образование</h3>
                    {a.application.education.length === 0 ? (
                      <p className="muted small">Не указано</p>
                    ) : (
                      <ul className="app-list">
                        {a.application.education.map((e, i) => (
                          <li key={i}>
                            <b>{e.institution}</b>
                            {e.specialty && `, ${e.specialty}`} <span className="muted">({years(e.yearFrom, e.yearTo)})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <h3 className="app-sub">Опыт работы</h3>
                    {a.application.experience.length === 0 ? (
                      <p className="muted small">Не указан</p>
                    ) : (
                      <ul className="app-list">
                        {a.application.experience.map((e, i) => (
                          <li key={i}>
                            <b>{e.place}</b>
                            {e.position && `, ${e.position}`} <span className="muted">({years(e.yearFrom, e.yearTo)})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <h3 className="app-sub">Документы</h3>
                    {a.documents.length === 0 ? (
                      <p className="muted small">Документов нет</p>
                    ) : (
                      <div className="doc-list">
                        {a.documents.map((d) => (
                          <button
                            key={d.id}
                            className="doc-chip"
                            onClick={() =>
                              openPrivateFile(`/admin/tutor-applications/${a.tutor.id}/documents/${d.id}`).catch((e) => setError(e.message))
                            }
                          >
                            {docKind[d.kind]}: {d.title} <span className="muted small">({Math.ceil(d.size / 1024)} КБ)</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {a.application.note && <p className="muted small">Прошлый комментарий: {a.application.note}</p>}
                    <input
                      placeholder="Комментарий преподавателю (обязателен при отказе)"
                      value={notes[a.tutor.id] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [a.tutor.id]: e.target.value })}
                    />
                    <div className="post-actions">
                      <button className="btn btn-go" onClick={() => review(a, 'approve')}>
                        Одобрить и опубликовать
                      </button>
                      <button className="btn btn-light" onClick={() => review(a, 'reject')}>
                        Отклонить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

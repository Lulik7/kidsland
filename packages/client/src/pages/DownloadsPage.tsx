import { getCourse, type Lesson } from '@kidsland/shared';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLocal } from '../content';
import { useT } from '../i18n';
import { isRecorded, RECORDED_LANGS, recordingUrl } from '../voices';

const save = (blob: Blob, name: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};

/** The whole lesson as plain text: theory, words, dialogues with readings and translations. */
function lessonText(l: Lesson, n: number): string {
  const out = [`${n}. ${l.title}`, ''];
  for (const s of l.sections) {
    if (s.title) out.push(`— ${s.title} —`);
    if (s.dialog) for (const d of s.dialog) out.push(`${d.who}: ${d.line}${d.read ? ` [${d.read}]` : ''} — ${d.tr}`);
    else {
      if (s.text) out.push(s.text);
      if (s.reading) out.push(`[${s.reading}]`);
      if (s.translation) out.push(s.translation);
    }
    if (s.tip) out.push(`★ ${s.tip}`);
    out.push('');
  }
  return out.join('\n');
}

const dialogLines = (l: Lesson) => l.sections.flatMap((s) => s.dialog ?? []);

/**
 * Downloads for a language course: every lesson as text, and the recorded dialogues as one mp3 per lesson
 * (glued from the recorded lines with short pauses), to listen to offline.
 */
export function DownloadsPage() {
  const t = useT();
  const { courseId = '' } = useParams();
  const course = getCourse(courseId);
  const shown = useLocal(course);
  const [busy, setBusy] = useState<string | null>(null);
  if (!course || course.subject !== 'languages') return <Navigate to="/courses" replace />;
  const lang = (course.lessons.flatMap((l) => l.sections).find((s) => s.speak)?.speak ?? '').split('-')[0];
  const audio = RECORDED_LANGS.has(lang);

  const mp3 = async (l: Lesson, n: number) => {
    setBusy(l.id);
    try {
      const pause = await (await fetch('/voice/pause.mp3')).arrayBuffer();
      const parts: ArrayBuffer[] = [];
      for (const d of dialogLines(l)) {
        if (!isRecorded(lang, d.who)) continue;
        const r = await fetch(recordingUrl(lang, d.line, d.who));
        if (!r.ok) continue;
        parts.push(await r.arrayBuffer(), pause);
      }
      if (parts.length) save(new Blob(parts, { type: 'audio/mpeg' }), `${course.id}-${String(n).padStart(2, '0')}.mp3`);
    } finally {
      setBusy(null);
    }
  };

  const allText = () =>
    save(new Blob([[shown!.title, '', ...shown!.lessons.map((l, i) => lessonText(l, i + 1))].join('\n')], { type: 'text/plain;charset=utf-8' }), `${course.id}.txt`);

  return (
    <main className="page downloads-page">
      <Link to={`/courses/${course.id}`} className="back-link">← {shown!.title}</Link>
      <h1>📥 {t('Комната скачивания')}</h1>
      <p className="muted">
        {audio
          ? t('Скачай диалоги уроков в mp3 и слушай их в дороге, а тексты распечатай для повторения.')
          : t('Скачай тексты уроков со словами и диалогами, чтобы повторять без интернета. Аудио этого языка звучит прямо в уроках.')}
      </p>
      <div className="dl-top">
        <button type="button" className="btn btn-go" onClick={allText}>
          📄 {t('Скачать весь курс (текст)')}
        </button>
      </div>
      <ol className="dl-list">
        {course.lessons.map((l, i) => (
          <li key={l.id} className="card dl-row">
            <span className="dl-num">{i + 1}</span>
            <b className="dl-title">{shown!.lessons[i].title}</b>
            <span className="dl-btns">
              {audio && dialogLines(l).length > 0 && (
                <button type="button" className="btn btn-light btn-small" disabled={busy !== null} onClick={() => mp3(l, i + 1)}>
                  {busy === l.id ? '⏳' : '🎧'} {t('Аудио (mp3)')}
                </button>
              )}
              <button
                type="button"
                className="btn btn-light btn-small"
                onClick={() => save(new Blob([lessonText(shown!.lessons[i], i + 1)], { type: 'text/plain;charset=utf-8' }), `${l.id}.txt`)}
              >
                📄 {t('Текст')}
              </button>
            </span>
          </li>
        ))}
      </ol>
    </main>
  );
}

import { getCourse, type Lesson } from '@kidsland/shared';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLocal } from '../content';
import { useT } from '../i18n';
import { zipSync } from 'fflate';
import { foreignPart } from '../speech';
import { AUDIO_FILE_LANGS, hasAudioFile, recordingUrl } from '../voices';

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

/** Everything the lesson reads aloud in the foreign language, in lesson order: words, texts and dialogues. */
function spokenLines(l: Lesson, lang: string): { line: string; who?: string }[] {
  return l.sections.flatMap((s) => {
    if (!s.speak?.startsWith(lang)) return [];
    if (s.dialog) return s.dialog.map((d) => ({ line: d.line, who: d.who }));
    if (s.translation) return [{ line: s.text }];
    return foreignPart(s.text).map((line) => ({ line }));
  });
}

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
  const audio = AUDIO_FILE_LANGS.has(lang);
  const num = (n: number) => String(n).padStart(2, '0');

  /** The lesson's recorded lines glued into one mp3 with short pauses; null when nothing is recorded. */
  const lessonMp3 = async (l: Lesson, pause: ArrayBuffer): Promise<Uint8Array<ArrayBuffer> | null> => {
    const parts: Uint8Array[] = [];
    for (const d of spokenLines(l, lang)) {
      if (!hasAudioFile(lang, d.who)) continue;
      const r = await fetch(recordingUrl(lang, d.line, d.who));
      if (!r.ok || !(r.headers.get('content-type') ?? '').includes('audio')) continue;
      parts.push(new Uint8Array(await r.arrayBuffer()), new Uint8Array(pause));
    }
    if (!parts.length) return null;
    const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) {
      all.set(p, at);
      at += p.length;
    }
    return all;
  };
  const pauseMp3 = async () => (await fetch('/voice/pause.mp3')).arrayBuffer();

  const mp3 = async (l: Lesson, n: number) => {
    setBusy(l.id);
    try {
      const data = await lessonMp3(l, await pauseMp3());
      if (data) save(new Blob([data], { type: 'audio/mpeg' }), `${course.id}-${num(n)}.mp3`);
    } finally {
      setBusy(null);
    }
  };

  const courseText = () => [shown!.title, '', ...shown!.lessons.map((l, i) => lessonText(l, i + 1))].join('\n');

  /** The whole course in one zip: the text of every lesson and, where recorded, an mp3 per lesson. */
  const allCourse = async () => {
    setBusy('all');
    try {
      const enc = new TextEncoder();
      const files: Record<string, Uint8Array> = { [`${course.id}.txt`]: enc.encode(courseText()) };
      const pause = audio ? await pauseMp3() : null;
      for (const [i, l] of course.lessons.entries()) {
        files[`text/${num(i + 1)}.txt`] = enc.encode(lessonText(shown!.lessons[i], i + 1));
        const data = pause && (await lessonMp3(l, pause));
        if (data) files[`audio/${course.id}-${num(i + 1)}.mp3`] = data;
      }
      // mp3 is already compressed: store it as is, squeeze only the texts.
      const zip = zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: k.endsWith('.mp3') ? 0 : 6 }]])));
      save(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), `${course.id}.zip`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="page downloads-page">
      <Link to={`/courses/${course.id}`} className="back-link">← {shown!.title}</Link>
      <h1>📥 {t('Комната скачивания')}</h1>
      <p className="muted">
        {audio
          ? t('Скачай слова и диалоги уроков в mp3 и слушай их в дороге, а тексты распечатай для повторения. Весь курс скачивается одним архивом.')
          : t('Скачай тексты уроков со словами и диалогами, чтобы повторять без интернета. Аудио этого языка звучит прямо в уроках.')}
      </p>
      <div className="dl-top">
        <button type="button" className="btn btn-go" disabled={busy !== null} onClick={allCourse}>
          {busy === 'all' ? '⏳ ' + t('Собираем архив…') : audio ? '📦 ' + t('Скачать весь курс: текст и аудио') : '📄 ' + t('Скачать весь курс (текст)')}
        </button>
      </div>
      <ol className="dl-list">
        {course.lessons.map((l, i) => (
          <li key={l.id} className="card dl-row">
            <span className="dl-num">{i + 1}</span>
            <b className="dl-title">{shown!.lessons[i].title}</b>
            <span className="dl-btns">
              {audio && spokenLines(l, lang).length > 0 && (
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

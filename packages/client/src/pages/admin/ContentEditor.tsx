import { ARTICLES, COURSES, findLesson, SECTIONS, SUBJECTS } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { api, type ArticleInput, type ContentBlock, type ContentOverridesDto } from '../../api';
import { applyContent } from '../../siteContent';

type Part = 'topics' | 'articles' | 'lessons';

/** Where the admin adds topics, writes and edits articles and corrects lesson texts. */
export function ContentEditor() {
  const [part, setPart] = useState<Part>('topics');
  const [content, setContent] = useState<ContentOverridesDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.adminContent().then(setContent).catch((e) => setError(e.message));
  }, []);

  /** Runs a change on the server and puts the new content on this page too. */
  const run = async (fn: () => Promise<ContentOverridesDto>, message: string) => {
    setError(null);
    setSaved(null);
    try {
      const c = await fn();
      applyContent(c);
      setContent(c);
      setSaved(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Контент сайта</h2>
      <div className="chips-row">
        <button className={part === 'topics' ? 'fchip on' : 'fchip'} onClick={() => setPart('topics')}>
          Темы
        </button>
        <button className={part === 'articles' ? 'fchip on' : 'fchip'} onClick={() => setPart('articles')}>
          Статьи
        </button>
        <button className={part === 'lessons' ? 'fchip on' : 'fchip'} onClick={() => setPart('lessons')}>
          Уроки
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {saved && <div className="ok-note">{saved}</div>}
      {!content ? (
        <p className="muted">Загружаем…</p>
      ) : part === 'topics' ? (
        <Topics content={content} run={run} />
      ) : part === 'articles' ? (
        <Articles content={content} run={run} />
      ) : (
        <Lessons content={content} run={run} />
      )}
    </div>
  );
}

type Run = (fn: () => Promise<ContentOverridesDto>, message: string) => Promise<boolean>;

function Topics({ content, run }: { content: ContentOverridesDto; run: Run }) {
  const [section, setSection] = useState(SECTIONS[0].id);
  const [name, setName] = useState('');
  const custom = new Set(content.topics.map((t) => t.id));
  const sec = SECTIONS.find((s) => s.id === section)!;
  return (
    <div className="cms">
      <p className="muted small">Новая тема появится в разделе, в фильтре наставников и в анкете преподавателя.</p>
      <div className="cms-row">
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input placeholder="Название темы" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          className="btn btn-go"
          disabled={name.trim().length < 2}
          onClick={async () => {
            if (await run(() => api.addTopic(section, name.trim()), 'Тема добавлена')) setName('');
          }}
        >
          Добавить тему
        </button>
      </div>
      <div className="topic-chips">
        {sec.topics.map((t) => (
          <span key={t.id} className={custom.has(t.id) ? 'topic-chip on' : 'topic-chip'} style={{ ['--c' as string]: sec.color }}>
            {t.name}
            {custom.has(t.id) && (
              <button
                className="chip-x"
                aria-label="Удалить тему"
                onClick={() => {
                  if (confirm(`Удалить тему «${t.name}»?`)) run(() => api.deleteTopic(t.id), 'Тема удалена');
                }}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      <p className="muted small">Выделены темы, добавленные вами; их можно удалить. Встроенные темы не удаляются.</p>
    </div>
  );
}

const emptyArticle = (): ArticleInput => ({
  section: 'spirit',
  topic: SECTIONS.find((s) => s.id === 'spirit')?.topics[0]?.id ?? '',
  title: '',
  summary: '',
  minutes: 3,
  sections: [{ title: '', text: '', tip: '' }],
});

function Articles({ content, run }: { content: ContentOverridesDto; run: Run }) {
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; data: ArticleInput } | null>(null);
  const hidden = content.articles.filter((a) => a.hidden);
  const all = [...ARTICLES.map((a) => ({ ...a, hidden: false })), ...hidden].filter((a) => !filter || a.section === filter);

  if (editing) {
    const d = editing.data;
    const set = (patch: Partial<ArticleInput>) => setEditing({ ...editing, data: { ...d, ...patch } });
    const sec = SECTIONS.find((s) => s.id === d.section);
    return (
      <div className="cms">
        <button className="btn btn-light" onClick={() => setEditing(null)}>
          ← К списку статей
        </button>
        <div className="cms-row">
          <label>
            Раздел
            <select value={d.section} onChange={(e) => set({ section: e.target.value, topic: SECTIONS.find((s) => s.id === e.target.value)?.topics[0]?.id ?? '' })}>
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Тема
            <select value={d.topic} onChange={(e) => set({ topic: e.target.value })}>
              {sec?.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Минут чтения
            <input type="number" min={1} max={60} value={d.minutes} onChange={(e) => set({ minutes: Number(e.target.value) || 1 })} />
          </label>
        </div>
        <label>
          Название
          <input value={d.title} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <label>
          Коротко о статье
          <textarea rows={2} value={d.summary} onChange={(e) => set({ summary: e.target.value })} />
        </label>
        <Blocks blocks={d.sections} onChange={(sections) => set({ sections })} />
        <div className="post-actions">
          <button
            className="btn btn-go"
            onClick={async () => {
              const ok = await run(async () => {
                const r = editing.id ? await api.saveArticle(editing.id, d) : await api.createArticle(d);
                return r.content;
              }, 'Статья сохранена');
              if (ok) setEditing(null);
            }}
          >
            Сохранить статью
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cms">
      <div className="cms-row">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Все разделы</option>
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn btn-go" onClick={() => setEditing({ id: null, data: { ...emptyArticle(), section: filter || 'spirit', topic: SECTIONS.find((s) => s.id === (filter || 'spirit'))?.topics[0]?.id ?? '' } })}>
          + Новая статья
        </button>
      </div>
      {all.length === 0 && <p className="muted">В этом разделе статей пока нет.</p>}
      <div className="flag-list">
        {all.map((a) => (
          <div key={a.id} className={`flag cms-item${a.hidden ? ' is-hidden' : ''}`}>
            <div>
              <b>{a.title}</b>
              <div className="muted small">
                {SECTIONS.find((s) => s.id === a.section)?.name} · {a.minutes} мин {a.hidden && '· скрыта'}
              </div>
            </div>
            <div className="post-actions">
              <button
                className="btn btn-light"
                onClick={() =>
                  setEditing({
                    id: a.id,
                    data: {
                      section: a.section,
                      topic: a.topic,
                      title: a.title,
                      summary: a.summary,
                      minutes: a.minutes,
                      sections: a.sections.map((s) => ({ title: s.title ?? '', text: s.text, tip: s.tip ?? '' })),
                    },
                  })
                }
              >
                Редактировать
              </button>
              <button className="btn btn-light" onClick={() => run(() => api.hideArticle(a.id, !a.hidden), a.hidden ? 'Статья снова на сайте' : 'Статья скрыта')}>
                {a.hidden ? 'Показать' : 'Скрыть'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Lessons({ content, run }: { content: ContentOverridesDto; run: Run }) {
  const [subject, setSubject] = useState(SUBJECTS[0].id);
  const courses = COURSES.filter((c) => c.subject === subject);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const course = COURSES.find((c) => c.id === courseId);
  const [lessonId, setLessonId] = useState(course?.lessons[0]?.id ?? '');
  const [draft, setDraft] = useState<{ title: string; sections: ContentBlock[] } | null>(null);
  const edited = new Set(content.lessons.map((l) => l.lessonId));

  useEffect(() => {
    const found = findLesson(lessonId);
    setDraft(
      found
        ? { title: found.lesson.title, sections: found.lesson.sections.map((s) => ({ title: s.title ?? '', text: s.text, tip: s.tip ?? '' })) }
        : null,
    );
  }, [lessonId, content]);

  return (
    <div className="cms">
      <p className="muted small">
        Здесь можно исправить название и тексты теории. Задания, код и диалоги остаются как были. Переводы исправленного текста на другие
        языки нужно будет обновить отдельно.
      </p>
      <div className="cms-row">
        <select
          value={subject}
          onChange={(e) => {
            const s = e.target.value as typeof subject;
            setSubject(s);
            const first = COURSES.find((c) => c.subject === s);
            setCourseId(first?.id ?? '');
            setLessonId(first?.lessons[0]?.id ?? '');
          }}
        >
          {SUBJECTS.filter((s) => COURSES.some((c) => c.subject === s.id)).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setLessonId(COURSES.find((c) => c.id === e.target.value)?.lessons[0]?.id ?? '');
          }}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
          {course?.lessons.map((l, i) => (
            <option key={l.id} value={l.id}>
              {i + 1}. {l.title}
              {edited.has(l.id) ? ' (изменён)' : ''}
            </option>
          ))}
        </select>
      </div>
      {draft && (
        <>
          <label>
            Название урока
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <Blocks blocks={draft.sections} onChange={(sections) => setDraft({ ...draft, sections })} />
          <div className="post-actions">
            <button className="btn btn-go" onClick={() => run(() => api.saveLesson(lessonId, draft), 'Урок сохранён')}>
              Сохранить урок
            </button>
            {edited.has(lessonId) && (
              <button
                className="btn btn-light"
                onClick={() => {
                  if (confirm('Вернуть исходный текст урока?')) run(() => api.resetLesson(lessonId), 'Урок возвращён к исходному тексту');
                }}
              >
                Вернуть как было
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Text blocks of an article or a lesson: heading, text and an optional tip. */
function Blocks({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (b: ContentBlock[]) => void }) {
  const set = (i: number, patch: Partial<ContentBlock>) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  return (
    <div className="cms-blocks">
      {blocks.map((b, i) => (
        <div key={i} className="cms-block">
          <div className="cms-block-head">
            <b>Блок {i + 1}</b>
            {blocks.length > 1 && (
              <button className="btn btn-light btn-small" onClick={() => onChange(blocks.filter((_, j) => j !== i))}>
                Удалить блок
              </button>
            )}
          </div>
          <input placeholder="Заголовок блока" value={b.title ?? ''} onChange={(e) => set(i, { title: e.target.value })} />
          <textarea rows={5} placeholder="Текст" value={b.text} onChange={(e) => set(i, { text: e.target.value })} />
          <input placeholder="Совет (необязательно)" value={b.tip ?? ''} onChange={(e) => set(i, { tip: e.target.value })} />
        </div>
      ))}
      <button className="btn btn-light" onClick={() => onChange([...blocks, { title: '', text: '', tip: '' }])}>
        + Добавить блок
      </button>
    </div>
  );
}

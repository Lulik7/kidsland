import { ARTICLES, type Article } from './articles';
import { findLesson } from './courses';
import { SECTIONS, TOPIC_IDS, TOPICS, TUTOR_SECTIONS } from './sections';

/** Content the admin adds or edits on the site, on top of the built-in courses and articles. */
export interface ContentOverrides {
  topics: { id: string; section: string; name: string }[];
  /** Built-in articles with the same id are replaced; hidden ones are removed from the site. */
  articles: (Article & { hidden?: boolean })[];
  /** New title and texts of a lesson's theory sections, by section index. Code, dialogues and tasks stay. */
  lessons: { lessonId: string; title: string; sections: { title?: string; text: string; tip?: string }[] }[];
}

const baseArticles = ARTICLES.map((a) => structuredClone(a));
const baseTopics = new Map(SECTIONS.map((s) => [s.id, s.topics.map((t) => ({ ...t }))]));
const baseLessons = new Map<string, { title: string; sections: { title?: string; text: string; tip?: string }[] }>();

/**
 * Puts the admin's changes into the shared lists in place, so every page and route that reads them
 * sees the edited content. Applying again (after another edit) starts from the built-in content.
 */
export function applyContentOverrides(o: ContentOverrides): void {
  for (const s of SECTIONS) {
    const extra = o.topics.filter((t) => t.section === s.id && !baseTopics.get(s.id)?.some((b) => b.id === t.id));
    s.topics.splice(0, s.topics.length, ...(baseTopics.get(s.id) ?? []), ...extra.map(({ id, name }) => ({ id, name })));
  }
  const topics = TUTOR_SECTIONS.flatMap((s) => s.topics.map((t) => ({ ...t, section: s.id })));
  TOPICS.splice(0, TOPICS.length, ...topics);
  TOPIC_IDS.splice(0, TOPIC_IDS.length, ...topics.map((t) => t.id));

  const byId = new Map(o.articles.map((a) => [a.id, a]));
  const merged: Article[] = [];
  for (const a of baseArticles) {
    const edit = byId.get(a.id);
    if (edit?.hidden) continue;
    merged.push(edit ? strip(edit) : a);
  }
  for (const a of o.articles) if (!a.hidden && !baseArticles.some((b) => b.id === a.id)) merged.push(strip(a));
  ARTICLES.splice(0, ARTICLES.length, ...merged);

  for (const [id, base] of baseLessons) {
    const found = findLesson(id);
    if (found) restore(found.lesson, base);
  }
  for (const l of o.lessons) {
    const found = findLesson(l.lessonId);
    if (!found) continue;
    const lesson = found.lesson;
    if (!baseLessons.has(lesson.id)) {
      baseLessons.set(lesson.id, { title: lesson.title, sections: lesson.sections.map(({ title, text, tip }) => ({ title, text, tip })) });
    }
    lesson.title = l.title;
    l.sections.forEach((s, i) => {
      if (lesson.sections[i]) Object.assign(lesson.sections[i], { title: s.title || undefined, text: s.text, tip: s.tip || undefined });
      else lesson.sections.push({ title: s.title || undefined, text: s.text, tip: s.tip || undefined });
    });
  }
}

function restore(lesson: { title: string; sections: { title?: string; text: string; tip?: string }[] }, base: { title: string; sections: { title?: string; text: string; tip?: string }[] }) {
  lesson.title = base.title;
  lesson.sections.splice(base.sections.length);
  base.sections.forEach((s, i) => Object.assign(lesson.sections[i], s));
}

const strip = ({ hidden: _hidden, ...a }: Article & { hidden?: boolean }): Article => a;

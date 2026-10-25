import type { LessonSection } from '../types';

/**
 * Long extra sections for lessons, written as plain text:
 *
 *   @@ lesson-id
 *   ## Section title
 *   Paragraph text, one or several lines.
 *   ! tip for this section
 */
export function sectionsFromText(text: string): Record<string, LessonSection[]> {
  const out: Record<string, LessonSection[]> = {};
  let list: LessonSection[] | null = null;
  let cur: LessonSection | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('@@ ')) {
      list = out[line.slice(3).trim()] = [];
      cur = null;
    } else if (line.startsWith('## ')) {
      if (!list) throw new Error(`Section before a lesson id: ${line}`);
      cur = { title: line.slice(3).trim(), text: '' };
      list.push(cur);
    } else if (line.startsWith('! ')) {
      if (!cur) throw new Error(`Tip without a section: ${line}`);
      cur.tip = line.slice(2).trim();
    } else {
      if (!cur) throw new Error(`Text without a section: ${line}`);
      cur.text = cur.text ? `${cur.text} ${line}` : line;
    }
  }
  return out;
}

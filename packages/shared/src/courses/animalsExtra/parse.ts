import type { LessonSection } from '../types';

/**
 * Long extra sections for lessons, written as plain text:
 *
 *   @@ lesson-id
 *   ## Section title
 *   Paragraph text, one or several lines.
 *   ! tip for this section
 *   > a line of code or an example block (kept as is)
 *
 * With `paragraphs`, every text line becomes its own paragraph.
 */
export function sectionsFromText(text: string, paragraphs = false): Record<string, LessonSection[]> {
  const join = paragraphs ? '\n\n' : ' ';
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
    } else if (raw.trimStart().startsWith('> ') || line === '>') {
      if (!cur) throw new Error(`Code without a section: ${line}`);
      const code = raw.trimStart().slice(2).replace(/\s+$/, '');
      cur.code = cur.code !== undefined ? `${cur.code}\n${code}` : code;
    } else if (line.startsWith('! ')) {
      if (!cur) throw new Error(`Tip without a section: ${line}`);
      cur.tip = line.slice(2).trim();
    } else {
      if (!cur) throw new Error(`Text without a section: ${line}`);
      cur.text = cur.text ? `${cur.text}${join}${line}` : line;
    }
  }
  return out;
}

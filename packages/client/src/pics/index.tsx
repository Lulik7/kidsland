import type { Course } from '@kidsland/shared';
import { KEYWORD_PIC, SUBJECT_PIC, TOPIC_PIC } from './codes';

export { SUBJECT_PIC, TOPIC_PIC };

const CODING = new Set(['computer', 'roblox', 'unity', 'scratch', 'python', 'web', 'games', 'logic']);

/** A 3D picture from public/img/3d. */
export function Pic({ code, size = 64, className = '' }: { code: string; size?: number; className?: string }) {
  return <img className={`pic3d ${className}`} src={`/img/3d/${code}.webp`} width={size} height={size} alt="" loading="lazy" draggable={false} />;
}

export const keywordPic = (text: string) => KEYWORD_PIC.find(([re]) => re.test(text))?.[1];

/** Section tiles: coding gets a laptop, the rest use their own subject picture. */
export const sectionPic = (id: string) => (id === 'coding' ? '1f4bb' : (SUBJECT_PIC[id] ?? '2b50'));

/** Instruments and languages have their own pictures; other courses are told apart by their title. */
export const coursePic = (c: Course) =>
  (c.topic && TOPIC_PIC[c.topic]) || (CODING.has(c.subject) ? undefined : keywordPic(c.title)) || SUBJECT_PIC[c.subject] || '2b50';

export const lessonPic = (c: Course, lessonTitle: string) => keywordPic(lessonTitle) ?? coursePic(c);

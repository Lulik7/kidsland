import type { SubjectId } from '@kidsland/shared';
import { Pic, SUBJECT_PIC } from '../pics';

/** The 3D picture of a course subject. */
export function SubjectIcon({ subject, size = 48 }: { subject: SubjectId | 'spirit'; size?: number }) {
  return <Pic code={SUBJECT_PIC[subject] ?? '2b50'} size={Math.round(size * 1.25)} />;
}

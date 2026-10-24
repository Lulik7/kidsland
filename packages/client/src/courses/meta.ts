import { COURSE_LEVELS, type CourseLevel } from '@kidsland/shared';

export const levelName = (l: CourseLevel) => COURSE_LEVELS.find((x) => x.id === l)?.name ?? l;
export const levelRank = (l: CourseLevel) => COURSE_LEVELS.findIndex((x) => x.id === l) + 1;

/** Base path of the course area: inside a child's space or the public catalogue. */
export const coursesBase = (childId?: string) => (childId ? `/kids/${childId}/courses` : '/courses');

import type { Course } from '../types';
import { languageCourses } from './build';
import { ENGLISH } from './en';

/** Three levels of 20 lessons for every foreign language of the «Иностранные языки» section. */
export const LANGUAGE_COURSES: Course[] = [ENGLISH].flatMap(languageCourses);

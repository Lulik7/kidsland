import type { Course } from '../types';
import { languageCourses } from './build';
import { GERMAN } from './de';
import { GREEK } from './el';
import { ENGLISH } from './en';
import { SPANISH } from './es';
import { FRENCH } from './fr';
import { HEBREW } from './he';
import { ITALIAN } from './it';
import { GEORGIAN } from './ka';

/** Three levels of 20 lessons for every foreign language of the «Иностранные языки» section. */
export const LANGUAGE_COURSES: Course[] = [ENGLISH, FRENCH, GERMAN, ITALIAN, SPANISH, GREEK, HEBREW, GEORGIAN].flatMap(languageCourses);

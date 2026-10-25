import type { LessonSection } from '../types';
import { ART_MID_DEEPER } from './artMid';
import { ART_PRO_DEEPER } from './artPro';
import { LEISURE_MID_DEEPER } from './leisureMid';
import { LEISURE_PRO_DEEPER } from './leisurePro';
import { MUSIC_DEEPER } from './music';

/**
 * More detailed text and examples for short lessons (the user asked to double them), by lesson id.
 * A section with the same title as an existing one replaces its text; new titles are added.
 */
export const DEEPER: Record<string, LessonSection[]> = { ...MUSIC_DEEPER, ...LEISURE_MID_DEEPER, ...LEISURE_PRO_DEEPER, ...ART_MID_DEEPER, ...ART_PRO_DEEPER };

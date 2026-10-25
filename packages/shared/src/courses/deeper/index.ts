import type { LessonSection } from '../types';
import { MUSIC_DEEPER } from './music';

/**
 * More detailed text and examples for short lessons (the user asked to double them), by lesson id.
 * A section with the same title as an existing one replaces its text; new titles are added.
 */
export const DEEPER: Record<string, LessonSection[]> = { ...MUSIC_DEEPER };

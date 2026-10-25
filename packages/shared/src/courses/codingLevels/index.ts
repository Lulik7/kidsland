import type { Lesson } from '../types';
import { PYTHON_LEVELS } from './python';

/** Lessons that bring every coding course up to 20, by course id. */
export const CODING_LEVELS: Record<string, Lesson[]> = { ...PYTHON_LEVELS };

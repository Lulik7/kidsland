import type { Lesson } from '../types';
import { PYTHON_LEVELS } from './python';
import { SCRATCH_LEVELS } from './scratch';
import { WEB_LEVELS } from './web';

/** Lessons that bring every coding course up to 20, by course id. */
export const CODING_LEVELS: Record<string, Lesson[]> = { ...PYTHON_LEVELS, ...SCRATCH_LEVELS, ...WEB_LEVELS };

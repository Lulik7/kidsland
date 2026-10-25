import type { Lesson } from '../types';
import { PYTHON_LEVELS } from './python';
import { SCRATCH_LEVELS } from './scratch';
import { WEB_LEVELS } from './web';
import { LOGIC_LEVELS } from './logic';
import { GAMES_LEVELS } from './games';
import { ROBLOX_LEVELS } from './roblox';
import { UNITY_LEVELS } from './unity';
import { COMPUTER_LEVELS } from './computer';

/** Lessons that bring every coding course up to 20, by course id. */
export const CODING_LEVELS: Record<string, Lesson[]> = { ...PYTHON_LEVELS, ...SCRATCH_LEVELS, ...WEB_LEVELS, ...LOGIC_LEVELS, ...GAMES_LEVELS, ...ROBLOX_LEVELS, ...UNITY_LEVELS, ...COMPUTER_LEVELS };

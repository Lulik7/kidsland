import { ANIMALS_MID_EXTRA } from './mid';
import { ANIMALS_PRO_EXTRA } from './pro';
import { ANIMALS_START_EXTRA } from './start';

/** Long reading sections added to the animals lessons, by lesson id. */
export const ANIMALS_EXTRA = { ...ANIMALS_START_EXTRA, ...ANIMALS_MID_EXTRA, ...ANIMALS_PRO_EXTRA };

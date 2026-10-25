import { COMPOSE_DEEPER } from './compose';
import { DJ_DEEPER } from './dj';
import { MUSIC_MID_DEEPER } from './musicMid';
import { MUSIC_PRO_DEEPER } from './musicPro';
import { SOLF1_DEEPER } from './solf1';
import { SOLF2_DEEPER } from './solf2';
import { SOLF3_DEEPER } from './solf3';

export const MUSIC_DEEPER = { ...MUSIC_MID_DEEPER, ...MUSIC_PRO_DEEPER, ...SOLF1_DEEPER, ...SOLF2_DEEPER, ...SOLF3_DEEPER, ...DJ_DEEPER, ...COMPOSE_DEEPER };

import type { Theme } from '@kidsland/shared';

export interface ThemeStyle {
  name: string;
  tagline: string;
  /** Board frame and page accents. */
  bg: string;
  bg2: string;
  tileA: string;
  tileB: string;
  tileEdge: string;
  trail: string;
  accent: string;
}

export const THEMES: Record<Theme, ThemeStyle> = {
  space: {
    name: 'Космос',
    tagline: 'Облети астероиды и собери звёзды',
    bg: '#1a1747',
    bg2: '#3b2f8f',
    tileA: '#2a266b',
    tileB: '#312c7a',
    tileEdge: '#120f36',
    trail: '#8b7bff',
    accent: '#8b7bff',
  },
  ocean: {
    name: 'Океан',
    tagline: 'Найди сокровища на дне моря',
    bg: '#0b4f74',
    bg2: '#0e7fae',
    tileA: '#f2dca8',
    tileB: '#ead096',
    tileEdge: '#c9a865',
    trail: '#0e7fae',
    accent: '#38d0ff',
  },
  robot: {
    name: 'Роботы',
    tagline: 'Наведи порядок на заводе',
    bg: '#353b4a',
    bg2: '#566079',
    tileA: '#dfe4ee',
    tileB: '#d1d8e5',
    tileEdge: '#a7b0c2',
    trail: '#ff9f1c',
    accent: '#ffb02e',
  },
};

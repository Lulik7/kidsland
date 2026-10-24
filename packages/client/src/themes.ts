import type { Theme } from '@kidsland/shared';

export const THEMES: Record<Theme, { name: string; hero: string; goal: string; wall: string; bg: string; cell: string; accent: string }> = {
  space: { name: 'Космос', hero: '🚀', goal: '⭐', wall: '☄️', bg: '#1d1b4b', cell: '#2b2870', accent: '#8b7bff' },
  ocean: { name: 'Океан', hero: '🐠', goal: '🏝️', wall: '🪸', bg: '#0b4f6c', cell: '#13759e', accent: '#38d0ff' },
  robot: { name: 'Роботы', hero: '🤖', goal: '🔋', wall: '📦', bg: '#3a3f4b', cell: '#505868', accent: '#ffb02e' },
};

export const AVATARS = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦖', '🐧'];

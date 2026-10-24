import type { Concept, FailReason, LevelConfig, Program, Theme } from '@kidsland/shared';

export interface User {
  id: string;
  email: string;
  role: 'parent' | 'tutor' | 'admin';
  isPremium: boolean;
}

export interface Child {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  coins: number;
  xp: number;
  completedLevels: string[];
}

export interface LevelSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: Theme;
  order: number;
  isPremium: boolean;
  xpReward: number;
  concepts: Concept[];
  stars: number;
  completed: boolean;
  unlocked: boolean;
  paywalled: boolean;
}

export interface LevelDetail extends LevelSummary {
  config: LevelConfig;
}

export interface AttemptResult {
  success: boolean;
  failReason: FailReason | null;
  stars: number;
  bestStars: number;
  score: number;
  blocksUsed: number;
  rewards: { xp: number; coins: number };
  child: { xp: number; coins: number };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const TOKEN_KEY = 'kidsland.token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  },
};

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'Нет связи с сайтом. Проверьте интернет или перезапустите npm run dev:client.');
  }
  const data = await res.json().catch(() => null);
  // No JSON body means the API itself did not answer (e.g. the dev proxy could not reach it).
  if (!data) throw new ApiError(res.status, 'Сервер не отвечает. Проверьте, что запущен npm run dev:server.');
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Что-то пошло не так');
  return data as T;
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request<{ user: User }>('/auth/me'),
  publicLevels: () => request<{ levels: LevelSummary[] }>('/levels'),
  children: () => request<{ children: Child[] }>('/children'),
  createChild: (nickname: string, avatarUrl: string) =>
    request<{ child: Child }>('/children', { method: 'POST', body: { nickname, avatarUrl } }),
  levels: (childId: string) => request<{ levels: LevelSummary[] }>(`/children/${childId}/levels`),
  level: (childId: string, slug: string) =>
    request<{ level: LevelDetail; savedProgram: Program | null }>(`/children/${childId}/levels/${slug}`),
  submit: (childId: string, levelSlug: string, program: Program) =>
    request<AttemptResult>(`/children/${childId}/attempts`, { method: 'POST', body: { levelSlug, program } }),
};

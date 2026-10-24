import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type FontScale = 'normal' | 'large' | 'xlarge';

/** Settings for children with special needs. Each one is a class on <html>, styled in styles.css. */
export interface A11y {
  font: FontScale;
  contrast: boolean;
  readable: boolean;
  calm: boolean;
  links: boolean;
  spacing: boolean;
  speak: boolean;
}

export const A11Y_DEFAULT: A11y = { font: 'normal', contrast: false, readable: false, calm: false, links: false, spacing: false, speak: false };

interface Prefs {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  a11y: A11y;
  setA11y: (patch: Partial<A11y>) => void;
  resetA11y: () => void;
}

const THEME_KEY = 'kidsland.theme';
const A11Y_KEY = 'kidsland.a11y';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return typeof fallback === 'string' ? (raw as T) : { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

const Ctx = createContext<Prefs>({ theme: 'light', setTheme: () => {}, a11y: A11Y_DEFAULT, setA11y: () => {}, resetA11y: () => {} });

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => (read<string>(THEME_KEY, 'light') === 'dark' ? 'dark' : 'light'));
  const [a11y, setA11yState] = useState<A11y>(() => read(A11Y_KEY, A11Y_DEFAULT));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    write(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const cl = document.documentElement.classList;
    cl.toggle('a11y-large', a11y.font === 'large');
    cl.toggle('a11y-xlarge', a11y.font === 'xlarge');
    cl.toggle('a11y-contrast', a11y.contrast);
    cl.toggle('a11y-readable', a11y.readable);
    cl.toggle('a11y-calm', a11y.calm);
    cl.toggle('a11y-links', a11y.links);
    cl.toggle('a11y-spacing', a11y.spacing);
    write(A11Y_KEY, JSON.stringify(a11y));
  }, [a11y]);

  // "Read aloud on click": speaks the text of the paragraph, heading or button the child taps.
  useEffect(() => {
    if (!a11y.speak || !('speechSynthesis' in window)) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('p, h1, h2, h3, li, button, a, label, .tip, pre, span');
      const text = el?.textContent?.trim();
      if (!text) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.slice(0, 600));
      u.lang = document.documentElement.lang === 'en' ? 'en-US' : 'ru-RU';
      u.rate = 0.95;
      speechSynthesis.speak(u);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      speechSynthesis.cancel();
    };
  }, [a11y.speak]);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
  const setA11y = useCallback((patch: Partial<A11y>) => setA11yState((a) => ({ ...a, ...patch })), []);
  const resetA11y = useCallback(() => setA11yState(A11Y_DEFAULT), []);
  return <Ctx.Provider value={{ theme, setTheme, a11y, setA11y, resetA11y }}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);

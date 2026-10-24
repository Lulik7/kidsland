import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { EN } from './i18n.en';

export type Lang = 'ru' | 'en';
const KEY = 'kidsland.lang';

type Vars = Record<string, string | number>;
export type T = (ru: string, vars?: Vars) => string;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
}

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s);

function stored(): Lang {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'ru';
  } catch {
    return 'ru';
  }
}

const Ctx = createContext<LangCtx>({ lang: 'ru', setLang: () => {}, t: fill });

/**
 * The interface is written in Russian; Russian strings are the keys. In English mode a string is looked up
 * in the EN dictionary and falls back to Russian, so untranslated text (like lesson content) still shows.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(stored);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* private mode */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = useCallback<T>((ru, vars) => fill(lang === 'en' ? (EN[ru] ?? ru) : ru, vars), [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;

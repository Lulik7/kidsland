import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { setFormatLang } from './format';
import { EL } from './i18n.el';
import { EN } from './i18n.en';
import { HE } from './i18n.he';

export type Lang = 'ru' | 'en' | 'el' | 'he';

/** Interface languages in switcher order; Hebrew is written right to left. */
export const LANGS: { id: Lang; label: string; name: string; speech: string }[] = [
  { id: 'ru', label: 'RU', name: 'Русский', speech: 'ru-RU' },
  { id: 'en', label: 'EN', name: 'English', speech: 'en-US' },
  { id: 'el', label: 'EL', name: 'Ελληνικά', speech: 'el-GR' },
  { id: 'he', label: 'HE', name: 'עברית', speech: 'he-IL' },
];
const DICTS: Record<Lang, Record<string, string> | null> = { ru: null, en: EN, el: EL, he: HE };
export const isRtl = (l: Lang) => l === 'he';
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
    const l = localStorage.getItem(KEY);
    return LANGS.some((x) => x.id === l) ? (l as Lang) : 'ru';
  } catch {
    return 'ru';
  }
}

const Ctx = createContext<LangCtx>({ lang: 'ru', setLang: () => {}, t: fill });

/**
 * The interface is written in Russian; Russian strings are the keys. In other languages a string is looked up
 * in that language's dictionary, then in English, then falls back to Russian, so untranslated text (like lesson content) still shows.
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
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  }, [lang]);
  const t = useCallback<T>((ru, vars) => fill(lang === 'ru' ? ru : (DICTS[lang]?.[ru] ?? EN[ru] ?? ru), vars), [lang]);
  setFormatLang(lang);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;

/** Translates a server message sentence by sentence, e.g. "<safety reason>. <what happened>." */
export const tSentences = (t: T, msg: string) => msg.split('. ').map((p) => t(p)).join('. ');

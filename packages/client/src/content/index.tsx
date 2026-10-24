import { useEffect, useMemo, useState } from 'react';
import { useLang, type Lang } from '../i18n';
import { translateDeep, translateText, type ContentDict } from './segments';

const loaded = new Map<Lang, ContentDict>();
const loading = new Map<Lang, Promise<ContentDict>>();

function load(lang: Lang): Promise<ContentDict> {
  let p = loading.get(lang);
  if (!p) {
    p = fetch(`/content/${lang}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ContentDict>) : {}))
      .catch(() => ({}))
      .then((d) => {
        loaded.set(lang, d);
        return d;
      });
    loading.set(lang, p);
  }
  return p;
}

/** The translations of lesson texts for the interface language; null for Russian or while loading. */
export function useContentDict(): ContentDict | null {
  const { lang } = useLang();
  const [dict, setDict] = useState<ContentDict | null>(() => (lang === 'ru' ? null : (loaded.get(lang) ?? null)));
  useEffect(() => {
    if (lang === 'ru') return setDict(null);
    setDict(loaded.get(lang) ?? null);
    let live = true;
    load(lang).then((d) => live && setDict(d));
    return () => {
      live = false;
    };
  }, [lang]);
  return dict;
}

/** A course, lesson or article with its texts in the interface language. */
export function useLocal<T>(value: T): T {
  const dict = useContentDict();
  return useMemo(() => (dict && value ? translateDeep(value, dict) : value), [dict, value]);
}

/** Translates one lesson text (a course title, an article summary) into the interface language. */
export function useTc(): (text: string) => string {
  const dict = useContentDict();
  return useMemo(() => (text: string) => (dict ? translateText(text, dict) : text), [dict]);
}

import { CURRENCIES, formatMoney, type Currency } from '@kidsland/shared';
import { LANGUAGES, SUBJECTS, topicName } from '@kidsland/shared';
import type { T } from './i18n';

export const subjectName = (id: string) => SUBJECTS.find((s) => s.id === id)?.name ?? topicName(id);
export const languageName = (id: string) => LANGUAGES.find((l) => l.id === id)?.name ?? id;

const LOCALES: Record<string, string> = { ru: 'ru-RU', en: 'en-GB', el: 'el-GR', he: 'he-IL' };
let uiLang = 'ru';
let locale = 'ru-RU';
/** Called by the language provider so dates and numbers follow the interface language. */
export const setFormatLang = (lang: string) => {
  uiLang = lang;
  locale = LOCALES[lang] ?? 'ru-RU';
};

/** A country's name in the interface language, from its ISO code. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames([uiLang], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

const LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
/** A person's name as written, or in Latin letters when the interface is not Russian. */
export const personName = (name: string) =>
  uiLang === 'ru'
    ? name
    : name.replace(/[а-яё]/gi, (ch) => {
        const lat = LATIN[ch.toLowerCase()] ?? ch;
        return ch === ch.toLowerCase() ? lat : lat.charAt(0).toUpperCase() + lat.slice(1);
      });

/** Money on the site is in shekels. */
/** The family's currency: guessed from the browser's time zone and language, or picked by the parent. */
export type { Currency };
export { CURRENCIES };

function guessCurrency(): Currency {
  try {
    const saved = localStorage.getItem('kl-currency');
    if (saved && saved in CURRENCIES) return saved as Currency;
  } catch {
    // no storage: guess below
  }
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  const langs = typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language];
  if (/Jerusalem|Tel_Aviv/.test(zone) || langs.some((l) => /-IL$/i.test(l))) return 'ILS';
  if (zone === 'Europe/Athens' || langs.some((l) => /-GR$/i.test(l))) return 'EUR';
  return 'USD';
}

let currency: Currency = guessCurrency();
export const getCurrency = () => currency;
export function setCurrency(c: Currency) {
  currency = c;
  try {
    localStorage.setItem('kl-currency', c);
  } catch {
    // not saved, still used for this visit
  }
}

export const money = (shekels: number) => formatMoney(shekels, currency, locale);

/** The time zone lesson times are shown in: the browser's own unless the parent picked another one. */
export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
let timeZone: string | undefined = (() => {
  try {
    return localStorage.getItem('kl-tz') ?? undefined;
  } catch {
    return undefined;
  }
})();
export const getTimeZone = () => timeZone ?? browserTimeZone();
export function setTimeZone(tz: string | null) {
  timeZone = tz && tz !== browserTimeZone() ? tz : undefined;
  try {
    if (timeZone) localStorage.setItem('kl-tz', timeZone);
    else localStorage.removeItem('kl-tz');
  } catch {
    // used for this visit only
  }
}

export const fmtDay = (d: Date | string) =>
  new Date(d).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long', timeZone });
export const fmtTime = (d: Date | string) => new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone });
export const fmtDateTime = (d: Date | string) => `${fmtDay(d)}, ${fmtTime(d)}`;

/** Calendar day key in the viewer's time zone, so slots group by the viewer's own dates. */
export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString('en-CA', { timeZone });

export function relativeDays(d: string | null, t: T): string {
  if (!d) return t('ещё не играл');
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days <= 0) return t('сегодня');
  if (days === 1) return t('вчера');
  return t('{n} дн. назад', { n: days });
}

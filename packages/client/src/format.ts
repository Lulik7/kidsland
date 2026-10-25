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
/**
 * Prices are kept in shekels. Families in Israel see shekels, in Greece euros, everywhere else dollars.
 * The country is guessed from the browser's time zone and language; the rates are fixed and approximate,
 * and the payment itself is counted in shekels.
 */
export type Currency = 'ILS' | 'EUR' | 'USD';
export const CURRENCIES: Record<Currency, { sign: string; perShekel: number }> = {
  ILS: { sign: '₪', perShekel: 1 },
  EUR: { sign: '€', perShekel: 0.25 },
  USD: { sign: '$', perShekel: 0.27 },
};

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

export const money = (shekels: number) => {
  const c = CURRENCIES[currency];
  const text = Math.round(shekels * c.perShekel).toLocaleString(locale);
  return currency === 'ILS' ? `${text} ₪` : `${c.sign}${text}`;
};

export const fmtDay = (d: Date | string) =>
  new Date(d).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' });
export const fmtTime = (d: Date | string) => new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = (d: Date | string) => `${fmtDay(d)}, ${fmtTime(d)}`;

/** Local calendar day key, so slots group by the viewer's own dates. */
export const dayKey = (d: Date | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export function relativeDays(d: string | null, t: T): string {
  if (!d) return t('ещё не играл');
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days <= 0) return t('сегодня');
  if (days === 1) return t('вчера');
  return t('{n} дн. назад', { n: days });
}

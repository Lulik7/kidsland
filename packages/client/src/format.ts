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
export const money = (n: number) => `${n.toLocaleString(locale)} ₪`;

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

import { LANGUAGES, SUBJECTS } from '@kidsland/shared';

export const subjectName = (id: string) => SUBJECTS.find((s) => s.id === id)?.name ?? id;
export const languageName = (id: string) => LANGUAGES.find((l) => l.id === id)?.name ?? id;

export const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

export const fmtDay = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
export const fmtTime = (d: Date | string) => new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = (d: Date | string) => `${fmtDay(d)}, ${fmtTime(d)}`;

/** Local calendar day key, so slots group by the viewer's own dates. */
export const dayKey = (d: Date | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export function relativeDays(d: string | null): string {
  if (!d) return 'ещё не играл';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  return `${days} дн. назад`;
}

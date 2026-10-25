/**
 * Recorded lesson voices. For some languages the browser voices are missing or sound robotic, so lesson
 * lines are recorded in advance with Piper neural voices (scripts/record-voices). A recording is found by
 * a hash of the text and the speaker's gender: /voice/<lang>/lines/<hash>-<f|m>.mp3.
 */
export const RECORDED_LANGS = new Set(['el', 'fr', 'ka', 'it', 'de']);

/** Languages where only one gender is recorded; the other keeps the browser's voice. */
const RECORDED_GENDERS: Record<string, 'f' | 'm'> = { it: 'm' };
export const isRecorded = (lang: string, speaker?: string) =>
  RECORDED_LANGS.has(lang) && (!RECORDED_GENDERS[lang] || RECORDED_GENDERS[lang] === genderOf(speaker));

/** Dialogue speakers who get the female voice; everyone else gets the male one. */
export const FEMALE_SPEAKERS = new Set([
  // Greek
  'Μαρία', 'Δασκάλα', 'Ελένη', 'Μαμά', 'Άννα', 'Άνια', 'Γιαγιά', 'Κορίτσι', 'Κυρία', 'Πωλήτρια', 'Νέα μαθήτρια', 'Ρεσεψιονίστ',
  // French
  'Emma', 'Maîtresse', 'Chloé', 'Maman', 'Lina', 'Anya', 'Mamie', 'Fille', 'Dame', 'Vendeuse', 'Caissière', 'Réceptionniste',
  // Georgian
  'ნინო', 'მარიამი', 'დედა', 'მასწავლებელი', 'ბებია', 'ანა', 'ანია', 'გოგო', 'მოლარე', 'გამყიდველი', 'ადმინისტრატორი',
  // Italian
  'Sofia', 'Giulia', 'Mamma', 'Anna', 'Maestra', 'Signora', 'Receptionist', 'Nonna', 'Commessa', 'Dottoressa', 'Cassiera',
  'Bambina', 'Anja', 'Addetta', 'Guida',
  // Hebrew
  'נועה', 'מאיה', 'אמא', 'מורה', 'סבתא', 'שירה', 'מלצרית', 'מוכרת', 'תלמידה חדשה', 'רופאת שיניים', 'קופאית', 'פקידת דואר',
  'פקידה', 'ילדה', 'מדריכה', 'אניה',
  // English
  'Ann', 'Kate', 'Lily', 'Mom', 'Teacher', 'Mum', 'Grandma', 'Girl', 'Receptionist', 'Woman', 'Cashier', 'Anya',
  // German
  'Mia', 'Lena', 'Mama', 'Lehrerin', 'Ärztin', 'Verkäuferin', 'Rezeption', 'Oma', 'Führerin', 'Frau', 'Mädchen',
  'Mitarbeiterin', 'Kassiererin', 'Anja',
  // Spanish
  'Lucía', 'Carmen', 'Mamá', 'Sara', 'Maestra', 'Señora', 'Recepcionista', 'Doctora', 'Dependienta', 'Abuela', 'Niña',
  'Empleada', 'Cajera',
  // Japanese
  'ハナ', 'ユキ', 'おかあさん', 'せんせい', 'おばあさん', 'ミナ', 'ユイ', 'アンナ', 'ミキ', 'フロント', 'ミカ', 'エミ', 'アーニャ',
  'アオイ', 'おんなのこ',
  // Chinese
  '小红', '丽丽', '安娜', '妈妈', '老师', '奶奶', '前台', '老奶奶', '售货员',
]);

export const genderOf = (speaker?: string): 'f' | 'm' => (!speaker || FEMALE_SPEAKERS.has(speaker) ? 'f' : 'm');

/** FNV-1a over UTF-16 code units, as 8 hex digits. */
export function textHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const recordingUrl = (lang: string, text: string, speaker?: string) => `/voice/${lang}/lines/${textHash(text)}-${genderOf(speaker)}.mp3`;

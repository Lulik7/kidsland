/**
 * Child-safety filter for chats between tutors and children: nobody may ask for or share
 * phone numbers, email addresses, messenger contacts, home addresses or personal photos.
 * Returns a reason in Russian when the message must be blocked, otherwise null.
 */
const RULES: { reason: string; test: (raw: string, norm: string) => boolean }[] = [
  {
    reason: 'В чате нельзя писать адрес электронной почты',
    test: (raw) => /[a-z0-9._%+-]+\s*(@|\(at\)|\[at\]|собака)\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i.test(raw),
  },
  {
    reason: 'В чате нельзя писать номер телефона',
    // 7 or more digits, possibly split by spaces, dashes, dots or brackets.
    test: (raw) => /(\+?\d[\s\-().]*){7,}/.test(raw),
  },
  {
    reason: 'Нельзя просить или давать телефон, почту и контакты в мессенджерах',
    test: (_raw, n) =>
      /(телефон|номер|мобильн|позвон|созвон|почт|e-?mail|имейл|мейл|gmail|mail\.ru|yandex|яндекс|telegram|телеграм|телега|\bтг\b|t\.me|whats ?app|ватсап|вацап|viber|вайбер|\bvk\b|вконтакт|instagram|инстаграм|\bинст|discord|дискорд|tiktok|тикток|snapchat|снапчат|skype|скайп|max мессенджер|wa\.me)/.test(n),
  },
  {
    reason: 'Нельзя просить или присылать личные фото',
    test: (_raw, n) => /(фото|фотк|фотогр|селфи|selfie|photo|снимок себя|сфоткай|сфотографир|покажи себя|покажи лицо)/.test(n),
  },
  {
    reason: 'Нельзя спрашивать домашний адрес и номер школы',
    test: (_raw, n) => /(адрес|где (ты )?живешь|где живете|в какой школе|номер школы|какая школа)/.test(n),
  },
];

export function findUnsafeContent(text: string): string | null {
  const norm = text.toLowerCase().replace(/ё/g, 'е');
  for (const r of RULES) if (r.test(text, norm)) return r.reason;
  return null;
}

/** Shown to tutors in their cabinet and in every lesson room. */
export const TUTOR_SAFETY_RULES = [
  'Общайтесь с учеником только на платформе: в комнате урока и в её чате.',
  'Нельзя просить у ребёнка телефон, почту, адрес, номер школы и контакты в мессенджерах.',
  'Нельзя просить или присылать личные фото и видео ребёнка.',
  'Все вопросы об оплате и расписании решайте с родителем через платформу.',
  'Сообщения с запрещёнными данными блокируются автоматически и передаются модератору.',
];

export const CHILD_SAFETY_TIPS = [
  'Никому не пиши свой телефон, адрес и почту.',
  'Не отправляй свои фото незнакомым людям.',
  'Если кто-то просит что-то из этого, расскажи родителям и нажми «Пожаловаться».',
];

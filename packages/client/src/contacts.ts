/** Contact details shown at the bottom of the home page. A social link without a url is shown as plain text. */
export const CONTACTS: {
  phone: string;
  email: string;
  address?: string;
  hours: string;
  socials: { name: string; url?: string }[];
} = {
  phone: '+972 52-655-0238',
  email: 'yuliaberner.dev@gmail.com',
  hours: 'Пн–Пт 9:00–19:00, Сб 10:00–14:00',
  socials: [
    // Links will be added when the channels are ready.
    { name: 'Telegram' },
    { name: 'YouTube' },
  ],
};

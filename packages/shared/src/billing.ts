/**
 * Lessons with tutors are paid in advance, in shekels. A new tutor's lesson costs 40 ₪ and the price goes up
 * step by step as the tutor gets more pupils. Packs and the monthly subscription give a discount on that price.
 * Paid lessons are tied to a tutor and can be moved to another one: their value is recounted at the new
 * tutor's price and what is left over stays on the family's balance.
 */
export const CURRENCY = '₪';

/** Lesson price by the number of the tutor's pupils. */
export const PRICE_STEPS = [
  { from: 0, price: 40 },
  { from: 10, price: 50 },
  { from: 25, price: 60 },
  { from: 50, price: 75 },
  { from: 80, price: 90 },
  { from: 120, price: 110 },
  { from: 170, price: 130 },
  { from: 230, price: 150 },
] as const;

export function tutorPrice(students: number): number {
  let p: number = PRICE_STEPS[0].price;
  for (const s of PRICE_STEPS) if (students >= s.from) p = s.price;
  return p;
}

export type PackId = 'trial' | 'p4' | 'p8' | 'p16' | 'p32';

export interface Pack {
  id: PackId;
  lessons: number;
  /** Discount in per cent from the tutor's lesson price. */
  discount: number;
  name: string;
}

export const PACKS: Pack[] = [
  { id: 'trial', lessons: 1, discount: 50, name: 'Пробный урок' },
  { id: 'p4', lessons: 4, discount: 0, name: '4 урока' },
  { id: 'p8', lessons: 8, discount: 0, name: '8 уроков' },
  { id: 'p16', lessons: 16, discount: 0, name: '16 уроков' },
  { id: 'p32', lessons: 32, discount: 0, name: '32 урока' },
];

export const withDiscount = (price: number, discount: number) => Math.round((price * (100 - discount)) / 100);

/** Monthly subscription: lessons per month and the discount. */
export const SUBSCRIPTION_STEPS = [
  { lessons: 4, discount: 0 },
  { lessons: 8, discount: 0 },
  { lessons: 12, discount: 0 },
  { lessons: 16, discount: 0 },
  { lessons: 24, discount: 0 },
] as const;

export const subscriptionStep = (lessons: number) => SUBSCRIPTION_STEPS.find((s) => s.lessons === lessons);

/** Bonuses for homework: this many give a 50% discount on one lesson with any tutor. */
export const BONUS_FOR_DISCOUNT = 100;
export const BONUS_DISCOUNT = 50;

/**
 * Prices are kept in shekels. Families in Israel see shekels, in Greece euros, everywhere else dollars.
 * The rates are fixed and approximate; a payment is recorded in shekels together with the amount shown.
 */
export type Currency = 'ILS' | 'EUR' | 'USD';
export const CURRENCIES: Record<Currency, { sign: string; perShekel: number }> = {
  ILS: { sign: '₪', perShekel: 1 },
  EUR: { sign: '€', perShekel: 0.25 },
  USD: { sign: '$', perShekel: 0.27 },
};
export const inCurrency = (shekels: number, c: Currency) => Math.round(shekels * CURRENCIES[c].perShekel);
export const formatMoney = (shekels: number, c: Currency, locale = 'ru-RU') => {
  const text = inCurrency(shekels, c).toLocaleString(locale);
  return c === 'ILS' ? `${text} ₪` : `${CURRENCIES[c].sign}${text}`;
};

export type PayMethod = 'card' | 'paypal';
export const PAY_METHODS: { id: PayMethod; name: string }[] = [
  { id: 'card', name: 'Банковская карта' },
  { id: 'paypal', name: 'PayPal' },
];

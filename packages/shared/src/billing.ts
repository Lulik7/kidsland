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
  { from: 30, price: 60 },
  { from: 60, price: 70 },
  { from: 100, price: 80 },
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
  { id: 'p8', lessons: 8, discount: 5, name: '8 уроков' },
  { id: 'p16', lessons: 16, discount: 10, name: '16 уроков' },
  { id: 'p32', lessons: 32, discount: 15, name: '32 урока' },
];

export const withDiscount = (price: number, discount: number) => Math.round((price * (100 - discount)) / 100);

/** Monthly subscription: lessons per month and the discount. */
export const SUBSCRIPTION_STEPS = [
  { lessons: 4, discount: 5 },
  { lessons: 8, discount: 8 },
  { lessons: 12, discount: 10 },
  { lessons: 16, discount: 12 },
  { lessons: 24, discount: 15 },
] as const;

export const subscriptionStep = (lessons: number) => SUBSCRIPTION_STEPS.find((s) => s.lessons === lessons);

/** Bonuses for homework: this many give a 50% discount on one lesson with any tutor. */
export const BONUS_FOR_DISCOUNT = 100;
export const BONUS_DISCOUNT = 50;

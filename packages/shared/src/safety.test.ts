import { describe, expect, it } from 'vitest';
import { findUnsafeContent } from './safety';

describe('findUnsafeContent', () => {
  it.each([
    'мой номер +7 (912) 345-67-89',
    'пиши на masha.k@mail.ru',
    'masha собака gmail.com',
    'дай свой телефон',
    'напиши мне в телеграм',
    'скинь фотку',
    'пришли селфи',
    'а где ты живешь?',
    'Какой у тебя E-mail?',
  ])('blocks %s', (t) => expect(findUnsafeContent(t)).not.toBeNull());

  it.each([
    'Привет! Сегодня делаем цикл повторить 4 раза',
    'Отлично, 3 звезды!',
    'print(2 + 3) выведет 5',
    'range(1, 6) это 1 2 3 4 5',
  ])('allows %s', (t) => expect(findUnsafeContent(t)).toBeNull());
});

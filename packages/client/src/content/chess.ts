import type { DiagramSpec } from '../components/ChessBoard';

const FILES = 'abcdefgh';

/** Squares a piece reaches from `from` on an empty board. */
function movesOf(kind: 'k' | 'q' | 'r' | 'b' | 'n', from: string): string[] {
  const fx = FILES.indexOf(from[0]);
  const fy = Number(from[1]);
  const out: string[] = [];
  const add = (x: number, y: number) => x >= 0 && x < 8 && y >= 1 && y <= 8 && out.push(`${FILES[x]}${y}`);
  const rays = (dirs: [number, number][], far: boolean) =>
    dirs.forEach(([dx, dy]) => {
      for (let i = 1; i <= (far ? 7 : 1); i++) add(fx + dx * i, fy + dy * i);
    });
  const straight: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const diagonal: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (kind === 'r') rays(straight, true);
  if (kind === 'b') rays(diagonal, true);
  if (kind === 'q') rays([...straight, ...diagonal], true);
  if (kind === 'k') rays([...straight, ...diagonal], false);
  if (kind === 'n') [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]].forEach(([dx, dy]) => add(fx + dx, fy + dy));
  return out;
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const lone = (piece: string, at: string) => {
  const rows = Array.from({ length: 8 }, (_, i) => (8 - i === Number(at[1]) ? `${FILES.indexOf(at[0]) || ''}${piece}${7 - FILES.indexOf(at[0]) || ''}` : '8'));
  return rows.join('/');
};
const moves = (piece: 'K' | 'Q' | 'R' | 'B' | 'N', at: string, caption: string): DiagramSpec => ({
  fen: lone(piece, at),
  marks: [at],
  dots: movesOf(piece.toLowerCase() as 'k', at),
  caption,
});

const BACK_RANK: DiagramSpec = { fen: 'R5k1/5ppp/8/8/8/8/8/6K1', marks: ['a8'], hits: ['g8'], caption: 'Ладья поставила мат на последней горизонтали: пешки не пускают короля.' };

/** Diagrams shown in chess lessons, by the lesson's (Russian) title. */
export const CHESS_DIAGRAMS: Record<string, DiagramSpec[]> = {
  'Доска и фигуры': [{ fen: START, caption: 'Начальная расстановка: белые внизу, справа внизу белая клетка.' }],
  'Как ходят фигуры': [
    moves('R', 'd4', 'Ладья ходит по прямым линиям.'),
    moves('B', 'd4', 'Слон ходит по диагоналям.'),
    moves('Q', 'd4', 'Ферзь ходит и как ладья, и как слон.'),
    moves('N', 'd4', 'Конь ходит буквой «Г» и перепрыгивает фигуры.'),
    moves('K', 'd4', 'Король ходит на одну клетку в любую сторону.'),
  ],
  'Шах и мат': [
    { fen: '4k3/8/8/8/8/8/8/4R1K1', arrows: [['e1', 'e8']], hits: ['e8'], caption: 'Шах: ладья атакует короля.' },
    BACK_RANK,
  ],
  'Ценность фигур': [{ fen: '8/8/8/8/1QRBNP2/8/8/8', marks: ['b4', 'c4', 'd4', 'e4', 'f4'], caption: 'Ферзь 9, ладья 5, слон 3, конь 3, пешка 1.' }],
  'Как ходит и бьёт пешка': [
    { fen: '8/8/8/3p4/4P3/8/2P5/8', marks: ['c2', 'e4'], dots: ['c3', 'c4'], hits: ['d5'], caption: 'Пешка c2 может пойти на одну или две клетки, пешка e4 бьёт d5 по диагонали.' },
  ],
  'Взятие на проходе': [
    { fen: '8/8/8/3pP3/8/8/8/8', marks: ['e5'], hits: ['d5'], dots: ['d6'], arrows: [['e5', 'd6']], caption: 'Чёрная пешка прыгнула d7–d5. Белая пешка бьёт её, вставая на d6.' },
  ],
  Рокировка: [
    { fen: '8/8/8/8/8/8/8/R3K2R', marks: ['e1', 'h1'], arrows: [['e1', 'g1'], ['h1', 'f1']], caption: 'Короткая рокировка: король на g1, ладья на f1.' },
  ],
  'Мат ферзём и королём': [{ fen: 'k7/1Q6/2K5/8/8/8/8/8', marks: ['b7'], hits: ['a8'], caption: 'Ферзь под защитой короля ставит мат.' }],
  'Мат двумя ладьями': [{ fen: 'R3k3/1R6/8/8/8/8/8/4K3', marks: ['a8', 'b7'], hits: ['e8'], caption: 'Линейный мат: одна ладья отрезает седьмую горизонталь, другая даёт шах.' }],
  'Шах и защита от шаха': [
    { fen: '4k3/8/8/8/8/8/8/4R1K1', arrows: [['e1', 'e8']], hits: ['e8'], dots: ['d8', 'f8', 'd7', 'f7'], caption: 'От шаха можно уйти королём: зелёные точки показывают безопасные клетки.' },
  ],
  'Начало партии': [
    { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R', marks: ['d4', 'e4', 'd5', 'e5'], caption: 'Займи центр пешками и выведи коней и слонов.' },
  ],
  'Детский мат': [
    { fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR', marks: ['f7', 'c4'], hits: ['e8'], caption: 'Ферзь при поддержке слона бьёт f7: мат.' },
  ],
  Вилка: [{ fen: 'r3k3/2N5/8/8/8/8/8/4K3', marks: ['c7'], hits: ['a8', 'e8'], arrows: [['c7', 'a8'], ['c7', 'e8']], caption: 'Конь нападает сразу на короля и ладью.' }],
  Связка: [{ fen: '4k3/8/2n5/1B6/8/8/8/4K3', marks: ['b5'], hits: ['c6'], arrows: [['b5', 'e8']], caption: 'Конь связан: если он уйдёт, слон атакует короля.' }],
  'Шахматная запись': [{ fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR', marks: ['e2', 'e4'], arrows: [['e2', 'e4']], caption: 'Ход записывают так: 1. e4.' }],
  Ничья: [{ fen: '7k/5Q2/6K1/8/8/8/8/8', marks: ['h8'], caption: 'Пат: чёрным некуда ходить, но шаха нет. Это ничья.' }],
  'Открытое нападение': [
    { fen: '4k3/8/8/8/4N3/8/8/4R1K1', marks: ['e4'], arrows: [['e4', 'f6'], ['e1', 'e8']], hits: ['e8'], caption: 'Конь уходит, и ладья открывает линию на короля.' },
  ],
  'Мат на последней горизонтали': [BACK_RANK],
  'Типовые маты': [BACK_RANK, { fen: 'k7/1Q6/2K5/8/8/8/8/8', marks: ['b7'], hits: ['a8'], caption: 'Мат ферзём при поддержке короля.' }],
  'Итальянская партия': [{ fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R', marks: ['c4', 'c5'], caption: '1. e4 e5 2. Кf3 Кc6 3. Сc4 Сc5.' }],
  'Испанская партия': [{ fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R', marks: ['b5'], caption: '1. e4 e5 2. Кf3 Кc6 3. Сb5.' }],
  'Сицилианская защита': [{ fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR', marks: ['e4', 'c5'], caption: '1. e4 c5.' }],
  'Ферзевый гамбит': [{ fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR', marks: ['c4', 'd4', 'd5'], caption: '1. d4 d5 2. c4.' }],
  'Проходная пешка': [{ fen: '8/8/8/1P6/8/8/5k2/6K1', marks: ['b5'], arrows: [['b5', 'b8']], caption: 'Перед пешкой b5 нет чужих пешек: это проходная.' }],
  'Позиция Лусены': [{ fen: '1K6/1P1k4/8/8/8/8/r7/5R2', marks: ['b7', 'b8'], caption: 'Позиция Лусены: белые строят «мост» ладьёй и проводят пешку.' }],
  'Позиция Филидора': [{ fen: '4k3/R7/1r6/3KP3/8/8/8/8', marks: ['b6'], caption: 'Позиция Филидора: чёрная ладья держит шестую горизонталь.' }],
  'Слепые шахматы и визуализация': [{ fen: '8/8/8/8/8/8/8/8', marks: ['e4', 'd5', 'a1', 'h8'], caption: 'Назови цвет клеток e4, d5, a1 и h8, не глядя на доску.' }],
};

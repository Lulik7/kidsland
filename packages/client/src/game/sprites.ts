import type { Direction, Theme } from '@kidsland/shared';

// Hand-drawn SVG sprites (viewBox 0 0 100 100). Emoji render very differently per OS, so the game draws these instead.

const INK = '#2a2350';
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

/** Rocket facing right. */
const rocket = svg(`
  <path d="M22 50 L2 38 L9 50 L2 62Z" fill="#ffb02e"/>
  <path d="M22 50 L9 43 L13 50 L9 57Z" fill="#ff5a36"/>
  <path d="M36 33 L22 16 L48 29Z" fill="#ff5a5f" stroke="${INK}" stroke-width="3"/>
  <path d="M36 67 L22 84 L48 71Z" fill="#ff5a5f" stroke="${INK}" stroke-width="3"/>
  <path d="M20 50 C20 36 40 28 62 30 C78 32 90 42 95 50 C90 58 78 68 62 70 C40 72 20 64 20 50Z" fill="#f4f6ff" stroke="${INK}" stroke-width="3"/>
  <path d="M79 34 C87 38 92 44 95 50 C92 56 87 62 79 66 C83 56 83 44 79 34Z" fill="#ff5a5f" stroke="${INK}" stroke-width="3"/>
  <circle cx="57" cy="50" r="10" fill="#6ad5ff" stroke="${INK}" stroke-width="3"/>
  <circle cx="54" cy="47" r="3" fill="#fff"/>
  <path d="M30 42 C30 46 30 54 30 58" stroke="#c9cff0" stroke-width="4" fill="none"/>`);

/** Submarine facing right. */
const submarine = svg(`
  <path d="M60 30 V16 H72" stroke="${INK}" stroke-width="4" fill="none"/>
  <rect x="44" y="26" width="24" height="18" rx="6" fill="#ff9f1c" stroke="${INK}" stroke-width="3"/>
  <path d="M16 56 L5 43 L5 69Z" fill="#ff6b6b" stroke="${INK}" stroke-width="3"/>
  <ellipse cx="52" cy="57" rx="38" ry="23" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>
  <path d="M22 66 C40 74 66 74 84 64" stroke="#f0b400" stroke-width="4" fill="none"/>
  <circle cx="44" cy="55" r="8" fill="#6ad5ff" stroke="${INK}" stroke-width="3"/>
  <circle cx="66" cy="55" r="8" fill="#6ad5ff" stroke="${INK}" stroke-width="3"/>
  <circle cx="42" cy="52" r="2.5" fill="#fff"/>
  <circle cx="64" cy="52" r="2.5" fill="#fff"/>`);

const PUPIL: Record<Direction, [number, number]> = { up: [0, -3], right: [3, 0], down: [0, 3], left: [-3, 0] };

/** Robot seen from the front; its eyes look where it is heading. */
const robot = (dir: Direction) => {
  const [px, py] = PUPIL[dir];
  return svg(`
  <line x1="50" y1="10" x2="50" y2="22" stroke="${INK}" stroke-width="3"/>
  <circle cx="50" cy="9" r="5" fill="#ff5a5f" stroke="${INK}" stroke-width="3"/>
  <rect x="14" y="34" width="10" height="16" rx="4" fill="#7b8cff" stroke="${INK}" stroke-width="3"/>
  <rect x="76" y="34" width="10" height="16" rx="4" fill="#7b8cff" stroke="${INK}" stroke-width="3"/>
  <rect x="30" y="64" width="40" height="26" rx="8" fill="#7b8cff" stroke="${INK}" stroke-width="3"/>
  <circle cx="50" cy="77" r="5" fill="#ffd23f" stroke="${INK}" stroke-width="2.5"/>
  <rect x="21" y="21" width="58" height="44" rx="14" fill="#b6c3ff" stroke="${INK}" stroke-width="3"/>
  <rect x="29" y="29" width="42" height="26" rx="9" fill="#2a2350"/>
  <circle cx="40" cy="42" r="7" fill="#6af0d0"/>
  <circle cx="60" cy="42" r="7" fill="#6af0d0"/>
  <circle cx="${40 + px}" cy="${42 + py}" r="3" fill="${INK}"/>
  <circle cx="${60 + px}" cy="${42 + py}" r="3" fill="${INK}"/>`);
};

const star = svg(`
  <circle cx="50" cy="52" r="40" fill="#ffd23f" opacity="0.25"/>
  <path d="M50 12 L61 38 L89 40 L67 58 L74 86 L50 71 L26 86 L33 58 L11 40 L39 38Z" fill="#ffd23f" stroke="#c98a00" stroke-width="4"/>
  <circle cx="42" cy="50" r="3.5" fill="${INK}"/><circle cx="58" cy="50" r="3.5" fill="${INK}"/>
  <path d="M44 59 Q50 64 56 59" stroke="${INK}" stroke-width="3" fill="none"/>`);

const chest = svg(`
  <path d="M16 44 C16 26 84 26 84 44Z" fill="#c8742c" stroke="${INK}" stroke-width="3"/>
  <rect x="16" y="44" width="68" height="38" rx="5" fill="#a85d22" stroke="${INK}" stroke-width="3"/>
  <rect x="16" y="44" width="68" height="8" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>
  <rect x="44" y="48" width="12" height="16" rx="3" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>
  <circle cx="30" cy="30" r="4" fill="#fff6c2"/><circle cx="70" cy="28" r="3" fill="#fff6c2"/>`);

const battery = svg(`
  <rect x="40" y="8" width="20" height="10" rx="3" fill="#8b93a7" stroke="${INK}" stroke-width="3"/>
  <rect x="24" y="16" width="52" height="76" rx="10" fill="#e8ecf5" stroke="${INK}" stroke-width="3"/>
  <rect x="31" y="24" width="38" height="61" rx="6" fill="#43d68a"/>
  <path d="M54 30 L38 58 L50 58 L45 80 L63 50 L51 50Z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`);

const asteroid = svg(`
  <path d="M22 30 L44 14 L72 18 L88 40 L84 70 L60 88 L30 84 L12 62Z" fill="#8a7a9e" stroke="${INK}" stroke-width="3"/>
  <path d="M30 34 L46 22 L68 25" stroke="#a99bbd" stroke-width="5" fill="none"/>
  <circle cx="40" cy="48" r="9" fill="#6f6185"/><circle cx="66" cy="60" r="7" fill="#6f6185"/><circle cx="44" cy="72" r="5" fill="#6f6185"/>`);

const coral = svg(`
  <path d="M10 86 C14 64 30 56 50 58 C70 56 86 64 90 86Z" fill="#7d8aa0" stroke="${INK}" stroke-width="3"/>
  <path d="M34 62 V34 M34 46 L24 34 M34 40 L44 26" stroke="#ff6f91" stroke-width="7" fill="none"/>
  <path d="M62 62 V28 M62 44 L72 30 M62 36 L54 22" stroke="#ff9f5a" stroke-width="7" fill="none"/>
  <circle cx="24" cy="74" r="4" fill="#5d6a80"/><circle cx="74" cy="76" r="5" fill="#5d6a80"/>`);

const crate = svg(`
  <rect x="12" y="12" width="76" height="76" rx="6" fill="#d9a066" stroke="${INK}" stroke-width="3"/>
  <rect x="20" y="20" width="60" height="60" fill="#c98b4f" stroke="#8a5a2b" stroke-width="3"/>
  <path d="M22 22 L78 78 M78 22 L22 78" stroke="#8a5a2b" stroke-width="6"/>
  <circle cx="17" cy="17" r="2" fill="${INK}"/><circle cx="83" cy="17" r="2" fill="${INK}"/>
  <circle cx="17" cy="83" r="2" fill="${INK}"/><circle cx="83" cy="83" r="2" fill="${INK}"/>`);

const coin = svg(`
  <circle cx="50" cy="54" r="34" fill="#c98a00"/>
  <circle cx="50" cy="50" r="34" fill="#ffd23f" stroke="#c98a00" stroke-width="4"/>
  <circle cx="50" cy="50" r="22" fill="none" stroke="#f0b400" stroke-width="4"/>
  <path d="M50 36 L54 46 L64 46 L56 53 L59 63 L50 57 L41 63 L44 53 L36 46 L46 46Z" fill="#fff3b0"/>`);

export const HERO: Record<Theme, (dir: Direction) => string> = {
  space: () => rocket,
  ocean: () => submarine,
  robot,
};
export const GOAL: Record<Theme, string> = { space: star, ocean: chest, robot: battery };
export const WALL: Record<Theme, string> = { space: asteroid, ocean: coral, robot: crate };
export const COIN = coin;

/** Heroes that are vehicles turn with the heading; the robot stays upright and looks around instead. */
export const ROTATES: Record<Theme, boolean> = { space: true, ocean: true, robot: false };

export const toDataUrl = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

const cache = new Map<string, HTMLImageElement>();
export function spriteImage(s: string): HTMLImageElement {
  let img = cache.get(s);
  if (!img) {
    img = new Image();
    img.src = toDataUrl(s);
    cache.set(s, img);
  }
  return img;
}

/** Friendly monster avatars, generated from a palette so kids get a distinct face each. */
const AVATAR_COLORS = ['#ff6b6b', '#ffb02e', '#43d68a', '#38bdf8', '#7b5cff', '#ff6fb5', '#2ec4a6', '#f97316'];

export const AVATAR_IDS = AVATAR_COLORS.map((_, i) => `monster-${i}`);

export function avatarSvg(id: string | null | undefined): string {
  const i = Math.max(0, AVATAR_IDS.indexOf(id ?? ''));
  const c = AVATAR_COLORS[i];
  const horns = i % 2 === 0 ? `<path d="M26 30 L20 10 L38 24Z M74 30 L80 10 L62 24Z" fill="${c}" stroke="${INK}" stroke-width="3"/>` : '';
  const ears = i % 2 === 1 ? `<circle cx="22" cy="28" r="10" fill="${c}" stroke="${INK}" stroke-width="3"/><circle cx="78" cy="28" r="10" fill="${c}" stroke="${INK}" stroke-width="3"/>` : '';
  const eyes =
    i % 3 === 0
      ? `<circle cx="50" cy="46" r="14" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="53" cy="47" r="6" fill="${INK}"/>`
      : `<circle cx="38" cy="46" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="62" cy="46" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="47" r="4" fill="${INK}"/><circle cx="64" cy="47" r="4" fill="${INK}"/>`;
  const mouth =
    i % 4 < 2
      ? `<path d="M36 66 Q50 80 64 66" stroke="${INK}" stroke-width="4" fill="#fff"/>`
      : `<path d="M38 66 Q50 74 62 66" stroke="${INK}" stroke-width="4" fill="none"/><path d="M44 68 L46 74 L49 69" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  return svg(`${horns}${ears}
    <path d="M18 56 C18 30 32 20 50 20 C68 20 82 30 82 56 C82 80 70 90 50 90 C30 90 18 80 18 56Z" fill="${c}" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="50" cy="74" rx="20" ry="10" fill="#fff" opacity="0.25"/>
    ${eyes}${mouth}
    <circle cx="28" cy="62" r="5" fill="#fff" opacity="0.35"/><circle cx="72" cy="62" r="5" fill="#fff" opacity="0.35"/>`);
}

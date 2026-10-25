import { useState, type PointerEvent, type ReactNode } from 'react';
import { playNote, whiteMidi } from './sound';

/** Drawing helpers shared by the instrument diagrams. Texts are Russian and go through `tc` for other languages. */
export type Tc = (s: string) => string;

export const INK = '#34404f';
export const WOOD = '#d9a77f';
export const WOOD_DARK = '#a8714a';
export const BROWN = '#5c4033';
export const METAL = '#b8c2cc';
export const MINT = '#79c7a6';
export const PEACH = '#f4b391';

/** A label with a thin leader line from the text to the point it names; a white outline keeps it readable on dark parts. */
export function Callout({ x, y, tx, ty, text, anchor = 'start' }: { x: number; y: number; tx: number; ty: number; text: string; anchor?: 'start' | 'end' | 'middle' }) {
  return (
    <g>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke="#8a94a3" strokeWidth="1.2" strokeDasharray="3 3" />
      <circle cx={x} cy={y} r="3.2" fill={PEACH} stroke="#fff" strokeWidth="1" />
      <text x={tx + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0)} y={ty + 4} textAnchor={anchor} fontSize="13" fontWeight="700" fill={INK} stroke="#fff" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke">
        {text}
      </text>
    </g>
  );
}

/** A numbered tip marker used on posture pictures. */
export function Num({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill={MINT} stroke="#fff" strokeWidth="2" />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">
        {n}
      </text>
    </g>
  );
}

export function Figure({ title, children, w = 460, h = 300, notes, extra }: { title: string; children: ReactNode; w?: number; h?: number; notes?: string[]; extra?: ReactNode }) {
  return (
    <figure className="music-diagram">
      <figcaption className="md-title">{title}</figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={title} style={{ maxWidth: w }}>
        {children}
      </svg>
      {extra}
      {notes && (
        <ol className="md-notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ol>
      )}
    </figure>
  );
}

/** A simple seated or standing child drawn with soft shapes; instruments are drawn on top of it. */
export function Kid({ x, y, sit = true, scale = 1 }: { x: number; y: number; sit?: boolean; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {sit && (
        <g>
          <rect x="-46" y="92" width="92" height="12" rx="6" fill="#c9b8a6" />
          <rect x="-40" y="104" width="8" height="70" fill="#b39c86" />
          <rect x="32" y="104" width="8" height="70" fill="#b39c86" />
        </g>
      )}
      {/* legs */}
      {sit ? (
        <g stroke="#5f7fa8" strokeWidth="16" strokeLinecap="round" fill="none">
          <path d="M-10 90h44v80" />
          <path d="M10 90h40v80" opacity="0.85" />
        </g>
      ) : (
        <g stroke="#5f7fa8" strokeWidth="16" strokeLinecap="round">
          <path d="M-8 96v78" />
          <path d="M10 96v78" />
        </g>
      )}
      <ellipse cx={sit ? 42 : -8} cy="176" rx="14" ry="6" fill={BROWN} />
      <ellipse cx={sit ? 58 : 14} cy="176" rx="14" ry="6" fill={BROWN} />
      {/* body */}
      <path d="M-22 20h44l6 76h-56z" fill="#f4b391" />
      {/* head */}
      <circle cx="0" cy="-8" r="22" fill="#f7d7bf" />
      <path d="M-22 -14c4-20 40-22 44 0-10-8-30-8-44 0z" fill="#8a5a3c" />
      <circle cx="-7" cy="-8" r="2.2" fill={INK} />
      <circle cx="8" cy="-8" r="2.2" fill={INK} />
      <path d="M-5 4q5 4 10 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

const WHITE_NAMES = ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си'];

/**
 * A piano keyboard of `octaves` octaves starting at C. `marks` are white-key indexes (0 = first C) painted mint,
 * `blackMarks` are black keys by the white key on their left, `fingers` puts finger numbers above white keys,
 * `names` writes note names on white keys. Keys sound when pressed; `lit` (MIDI numbers) glows during playback.
 */
export function Keyboard({ x = 10, y = 20, octaves = 2, keyW = 28, marks = [], blackMarks = [], fingers = {}, names = true, lit = [], onPress, tc }: {
  x?: number;
  y?: number;
  octaves?: number;
  keyW?: number;
  marks?: number[];
  blackMarks?: number[];
  fingers?: Record<number, number>;
  names?: boolean;
  lit?: number[];
  onPress?: (midi: number) => void;
  tc: Tc;
}) {
  const [down, setDown] = useState<number | null>(null);
  const key = keyW;
  const whites = octaves * 7 + 1;
  const h = key * 4.4;
  const blackAfter = [0, 1, 3, 4, 5];
  const press = (midi: number) => {
    setDown(midi);
    playNote(midi, 0.7);
    onPress?.(midi);
  };
  const on = (midi: number) => down === midi || lit.includes(midi);
  const keyProps = (midi: number) => ({
    onPointerDown: (e: PointerEvent<SVGElement>) => {
      e.preventDefault();
      press(midi);
    },
    onPointerUp: () => setDown(null),
    onPointerLeave: () => setDown((d) => (d === midi ? null : d)),
    style: { cursor: "url('/img/cursor-bird-hover.svg') 1 10, pointer" },
    role: 'button',
    'aria-label': String(midi),
  });
  return (
    <g transform={`translate(${x} ${y})`} className="kb">
      {Array.from({ length: whites }, (_, i) => {
        const midi = whiteMidi(i);
        return (
          <g key={i} {...keyProps(midi)}>
            <rect x={i * key} y="0" width={key} height={h} rx="3" fill={on(midi) ? '#ffd9a8' : marks.includes(i) ? '#bfe6d4' : '#fffdf8'} stroke="#8a94a3" />
            {names && (
              <text x={i * key + key / 2} y={h - 8} textAnchor="middle" fontSize={key * 0.36} fontWeight="700" fill={INK} pointerEvents="none">
                {tc(WHITE_NAMES[i % 7])}
              </text>
            )}
            {fingers[i] !== undefined && <Num x={i * key + key / 2} y={-14} n={fingers[i]} />}
          </g>
        );
      })}
      {Array.from({ length: whites - 1 }, (_, i) => {
        if (!blackAfter.includes(i % 7)) return null;
        const midi = whiteMidi(i) + 1;
        return (
          <rect
            key={`b${i}`}
            {...keyProps(midi)}
            x={(i + 1) * key - key * 0.3}
            y="0"
            width={key * 0.6}
            height={h * 0.6}
            rx="2"
            fill={on(midi) ? '#f4a259' : blackMarks.includes(i) ? MINT : '#2f3440'}
          />
        );
      })}
    </g>
  );
}

/** A five-line staff with a treble clef drawn as text. */
export function Staff({ x, y, w, gap = 12 }: { x: number; y: number; w: number; gap?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="0" y1={i * gap} x2={w} y2={i * gap} stroke="#6b7786" strokeWidth="1.2" />
      ))}
      <text x="4" y={gap * 4 + 8} fontSize={gap * 6} fill={INK} fontFamily="serif">
        𝄞
      </text>
    </g>
  );
}

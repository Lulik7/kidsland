/**
 * Chess diagrams drawn in SVG: a board with pieces from a FEN placement, highlighted squares,
 * dots for possible moves and arrows. Pieces are simple hand-drawn shapes in a 45×45 box.
 */

type Side = 'w' | 'b';
type Kind = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

function PieceShape({ kind, side }: { kind: Kind; side: Side }) {
  const fill = side === 'w' ? '#fffdf7' : '#3a3f4b';
  const line = side === 'w' ? '#3a3f4b' : '#1d2028';
  const detail = side === 'w' ? '#3a3f4b' : '#f3efe6';
  const base = <path d="M10 39h25l2 4H8z" fill={fill} stroke={line} strokeWidth="1.6" strokeLinejoin="round" />;
  const p = { fill, stroke: line, strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'p':
      return (
        <g>
          <circle cx="22.5" cy="13" r="5.5" {...p} />
          <path d="M18 19h9l-1 4h-7z" {...p} />
          <path d="M19 23c-1 6-5 10-7 16h21c-2-6-6-10-7-16z" {...p} />
          {base}
        </g>
      );
    case 'r':
      return (
        <g>
          <path d="M11 8h5v4h4V8h5v4h4V8h5v8l-3 3H14l-3-3z" {...p} />
          <path d="M14 19h17l1 15H13z" {...p} />
          <path d="M11 34h23v5H11z" {...p} />
          <path d="M14 19h17" stroke={detail} strokeWidth="1.2" />
          {base}
        </g>
      );
    case 'b':
      return (
        <g>
          <circle cx="22.5" cy="6.5" r="2.6" {...p} />
          <path d="M22.5 9c-7 5-9 11-6 17h12c3-6 1-12-6-17z" {...p} />
          <path d="M22 14l4 6" stroke={detail} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 26h13l2 4H14z" {...p} />
          <path d="M14 30c3 2 2 6 0 9h17c-2-3-3-7 0-9z" {...p} />
          {base}
        </g>
      );
    case 'n':
      return (
        <g>
          <path d="M14 39c0-8 3-12 8-16-3 0-6 2-8 4-2 1-4 0-4-2 0-3 6-8 9-12l1-5 3 4c7 1 12 7 12 16v11z" {...p} />
          <circle cx="17.5" cy="16.5" r="1.4" fill={detail} />
          <path d="M11.5 25.5l1.5-1" stroke={detail} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M27 13c3 3 5 8 5 14" fill="none" stroke={detail} strokeWidth="1.2" opacity="0.7" />
          {base}
        </g>
      );
    case 'q':
      return (
        <g>
          {[8, 15.5, 22.5, 29.5, 37].map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 ? 7 : 10} r="2.4" {...p} />
          ))}
          <path d="M9 12l4 16h19l4-16-6 10-3-14-4 14-4-14-3 14z" {...p} />
          <path d="M12 28h21l1 5H11z" {...p} />
          <path d="M11 33c1 2 1 4 0 6h23c-1-2-1-4 0-6z" {...p} />
          {base}
        </g>
      );
    case 'k':
      return (
        <g>
          <path d="M22.5 3v8M18.5 7h8" stroke={line} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M22.5 13c-3-4-9-3-9 3 0 3 3 6 5 10h8c2-4 5-7 5-10 0-6-6-7-9-3z" {...p} />
          <path d="M12 26h21l1 6H11z" {...p} />
          <path d="M11 32c1 2 1 5 0 7h23c-1-2-1-5 0-7z" {...p} />
          <path d="M14 29h17" stroke={detail} strokeWidth="1.2" />
          {base}
        </g>
      );
  }
}

const FILES = 'abcdefgh';
const sq = (name: string): [number, number] => [FILES.indexOf(name[0]), 8 - Number(name[1])];

export interface DiagramSpec {
  /** Piece placement part of a FEN, e.g. 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'. */
  fen: string;
  /** Squares painted green: the piece that moves, the key square. */
  marks?: string[];
  /** Squares the piece can go to, shown as dots. */
  dots?: string[];
  /** Squares under attack, painted red. */
  hits?: string[];
  arrows?: [string, string][];
  caption?: string;
}

export function ChessBoard({ fen, marks = [], dots = [], hits = [], arrows = [], size = 320, caption }: DiagramSpec & { size?: number }) {
  const pieces: { x: number; y: number; kind: Kind; side: Side }[] = [];
  fen.split('/').forEach((row, y) => {
    let x = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) x += Number(ch);
      else {
        pieces.push({ x, y, kind: ch.toLowerCase() as Kind, side: ch === ch.toUpperCase() ? 'w' : 'b' });
        x++;
      }
    }
  });
  const S = 45;
  const paint = (list: string[], color: string) =>
    list.map((n) => {
      const [x, y] = sq(n);
      return <rect key={`${color}${n}`} x={x * S} y={y * S} width={S} height={S} fill={color} />;
    });
  return (
    <figure className="chess-diagram">
      <svg width={size} height={size} viewBox="-14 -4 382 382" role="img" aria-label={caption ?? 'Шахматная доска'}>
        <rect x="-4" y="-4" width="368" height="368" rx="10" fill="#b98a62" />
        {Array.from({ length: 64 }, (_, i) => {
          const x = i % 8;
          const y = Math.floor(i / 8);
          return <rect key={i} x={x * S} y={y * S} width={S} height={S} fill={(x + y) % 2 ? '#c9a27e' : '#f6e7cf'} />;
        })}
        {paint(marks, 'rgba(121, 199, 166, 0.75)')}
        {paint(hits, 'rgba(239, 112, 96, 0.6)')}
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} fontSize="10" fontWeight="700" fill="#6b4c33" fontFamily="sans-serif">
            <text x={i * S + S / 2} y="372" textAnchor="middle">{FILES[i]}</text>
            <text x="-9" y={i * S + S / 2 + 4} textAnchor="middle">{8 - i}</text>
          </g>
        ))}
        {pieces.map((pc, i) => (
          <g key={i} transform={`translate(${pc.x * S} ${pc.y * S})`}>
            <PieceShape kind={pc.kind} side={pc.side} />
          </g>
        ))}
        {dots.map((n) => {
          const [x, y] = sq(n);
          return <circle key={`d${n}`} cx={x * S + S / 2} cy={y * S + S / 2} r="7" fill="rgba(47, 120, 90, 0.55)" />;
        })}
        <defs>
          <marker id="chess-arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0 0L4 2L0 4z" fill="#e8743b" />
          </marker>
        </defs>
        {arrows.map(([a, b]) => {
          const [x1, y1] = sq(a);
          const [x2, y2] = sq(b);
          const k = 0.72;
          const ex = x1 + (x2 - x1) * k + (x2 - x1 === 0 ? 0 : 0);
          const ey = y1 + (y2 - y1) * k;
          return (
            <line
              key={`${a}${b}`}
              x1={x1 * S + S / 2}
              y1={y1 * S + S / 2}
              x2={ex * S + S / 2 + ((x2 - x1) * (1 - k) * S) / 2}
              y2={ey * S + S / 2 + ((y2 - y1) * (1 - k) * S) / 2}
              stroke="#e8743b"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.85"
              markerEnd="url(#chess-arrow)"
            />
          );
        })}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** One big piece for cards and headers. */
export function ChessPiece({ kind, side = 'w', size = 90 }: { kind: Kind; side?: Side; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 45 45" aria-hidden>
      <PieceShape kind={kind} side={side} />
    </svg>
  );
}

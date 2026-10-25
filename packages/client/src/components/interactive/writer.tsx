import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { say } from '../../speech';
import type { Tc } from './kit';

/** One letter of a copybook: the sign, how it sounds and something to remember it by. */
export interface CopyLetter {
  ch: string;
  sound: string;
  hint?: string;
  pic?: string;
  word?: string;
  wordTr?: string;
  /** What to say for the letter when it is not the sign itself (Greek letters are read by name: «άλφα»). */
  say?: string;
}

type Strokes = Record<string, string[]>;
const cache: Record<string, Promise<Strokes>> = {};
const loadStrokes = (file: string) => (cache[file] ??= fetch(`/data/${file}`).then((r) => r.json() as Promise<Strokes>));

type Pt = { x: number; y: number };
type Mode = 'watch' | 'trace' | 'write';

/** Points along every stroke of a letter, to compare with what the child drew. */
function samplePaths(paths: string[], step = 3): Pt[] {
  if (typeof document === 'undefined') return [];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);
  const out: Pt[] = [];
  for (const d of paths) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
    const len = p.getTotalLength();
    for (let l = 0; l <= len; l += step) {
      const q = p.getPointAtLength(l);
      out.push({ x: q.x, y: q.y });
    }
  }
  svg.remove();
  return out;
}

/** How well the ink covers the letter (0..1): both "all of the letter is drawn" and "nothing extra". */
function score(ref: Pt[], ink: Pt[][]): number {
  const pts = ink.flat();
  if (!pts.length || !ref.length) return 0;
  const near = (a: Pt, list: Pt[], r: number) => list.some((b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= r * r);
  const covered = ref.filter((p) => near(p, pts, 10)).length / ref.length;
  const clean = pts.filter((p) => near(p, ref, 13)).length / pts.length;
  return Math.min(covered, clean);
}

/** The cell lines of a copybook page. */
function Ruling({ kind }: { kind: 'grid' | 'lines' }) {
  return kind === 'grid' ? (
    <g stroke="#f2b8a2" strokeWidth="0.6" fill="none">
      <rect x="2" y="2" width="105" height="105" rx="4" strokeWidth="1.2" />
      <path d="M54.5 2v105M2 54.5h105" strokeDasharray="3 3" />
    </g>
  ) : (
    <g stroke="#f2b8a2" strokeWidth="0.6" fill="none">
      <rect x="2" y="2" width="105" height="105" rx="4" strokeWidth="1.2" />
      <path d="M2 21h105M2 61h105" strokeDasharray="3 3" />
      <path d="M2 41h105" strokeDasharray="1 3" opacity="0.6" />
    </g>
  );
}

/**
 * A copybook: first the letter is written stroke by stroke (with numbers and the direction),
 * then the child traces it over a pale sample, then writes it alone and checks the result.
 */
export function Copybook({ letters, file, lang, ruling, tc, title }: { letters: CopyLetter[]; file: string; lang: string; ruling: 'grid' | 'lines'; tc: Tc; title: string }) {
  const [strokes, setStrokes] = useState<Strokes | null>(null);
  const [cur, setCur] = useState(0);
  const [mode, setMode] = useState<Mode>('watch');
  const [run, setRun] = useState(0);
  const [ink, setInk] = useState<Pt[][]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [dictation, setDictation] = useState<number | null>(null);
  const drawing = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadStrokes(file).then(setStrokes).catch(() => setStrokes({}));
  }, [file]);

  const letter = letters[dictation ?? cur];
  const paths = strokes?.[letter.ch] ?? [];
  const ref = useMemo(() => samplePaths(paths), [paths]);

  const reset = (m: Mode = mode) => {
    setMode(m);
    setInk([]);
    setResult(null);
    setRun((r) => r + 1);
  };
  const pick = (i: number) => {
    setCur(i);
    setDictation(null);
    reset('watch');
  };
  const listen = async () => {
    await say(letter.say ?? letter.ch, lang, 0, 0.75);
    if (letter.word && dictation === null) await say(letter.word, lang, 0, 0.8);
  };

  const toPt = (e: RPointerEvent<SVGSVGElement>): Pt => {
    const svg = svgRef.current!;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: q.x, y: q.y };
  };
  const canDraw = mode !== 'watch';

  if (!strokes) return null;
  if (!paths.length) return null;
  const hidden = dictation !== null && result === null;

  return (
    <figure className="music-diagram scene copybook">
      <figcaption className="md-title">{title}</figcaption>
      <div className="cb-letters" role="tablist">
        {letters.map((l, i) => (
          <button key={l.ch} type="button" className={i === cur && dictation === null ? 'on' : ''} onClick={() => pick(i)} lang={lang}>
            {l.ch}
          </button>
        ))}
      </div>
      <div className="cb-main">
        <div className="cb-cell">
          <svg
            ref={svgRef}
            viewBox="0 0 109 109"
            width="100%"
            style={{ touchAction: 'none', cursor: canDraw ? 'crosshair' : 'default' }}
            onPointerDown={(e) => {
              if (!canDraw) return;
              (e.currentTarget as Element).setPointerCapture(e.pointerId);
              drawing.current = true;
              setResult(null);
              setInk((s) => [...s, [toPt(e)]]);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const p = toPt(e);
              setInk((s) => [...s.slice(0, -1), [...s[s.length - 1], p]]);
            }}
            onPointerUp={() => (drawing.current = false)}
          >
            <Ruling kind={ruling} />
            {mode === 'watch' && (
              <g key={run}>
                {paths.map((d, i) => (
                  <path key={`g${i}`} d={d} fill="none" stroke="#e8e2f3" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {paths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    pathLength={1}
                    className="cb-stroke"
                    style={{ animationDelay: `${i * 1.1}s` }}
                    fill="none"
                    stroke="#34404f"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {paths.map((d, i) => {
                  const m = /M\s*([\d.-]+)[ ,]([\d.-]+)/.exec(d);
                  if (!m) return null;
                  return (
                    <g key={`n${i}`} className="cb-num" style={{ animationDelay: `${i * 1.1}s` }}>
                      <circle cx={+m[1]} cy={+m[2]} r="5" fill="#e07a3f" />
                      <text x={+m[1]} y={+m[2] + 2.3} textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#fff">
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
            {mode === 'trace' &&
              paths.map((d, i) => <path key={i} d={d} fill="none" stroke="#d9e9f5" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />)}
            {mode !== 'watch' &&
              ink.map((s, i) => (
                <polyline key={i} points={s.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#2f7d5b" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            {result !== null && mode === 'write' && (
              <g opacity="0.45">
                {paths.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#e07a3f" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
                ))}
              </g>
            )}
          </svg>
        </div>
        <div className="cb-side">
          {hidden ? (
            <div className="cb-big cb-mystery">?</div>
          ) : (
            <div className="cb-big" lang={lang}>
              {letter.ch}
            </div>
          )}
          {!hidden && (
            <p className="cb-sound">
              {tc('Звук')}: <b>{letter.sound}</b>
            </p>
          )}
          {!hidden && letter.hint && <p className="cb-hint">{letter.pic} {tc(letter.hint)}</p>}
          {!hidden && letter.word && (
            <p className="cb-hint">
              {letter.pic} <b lang={lang}>{letter.word}</b> {letter.wordTr && `· ${tc(letter.wordTr)}`}
            </p>
          )}
          <button type="button" className="listen-btn" onClick={listen}>
            <span aria-hidden>▶</span> {tc('Послушать')}
          </button>
        </div>
      </div>
      <div className="chips-row md-choices cb-modes">
        <button type="button" className={`fchip${mode === 'watch' ? ' on' : ''}`} disabled={dictation !== null} onClick={() => reset('watch')}>
          1. {tc('Смотри, как пишется')}
        </button>
        <button type="button" className={`fchip${mode === 'trace' ? ' on' : ''}`} disabled={dictation !== null} onClick={() => reset('trace')}>
          2. {tc('Обведи')}
        </button>
        <button type="button" className={`fchip${mode === 'write' && dictation === null ? ' on' : ''}`} onClick={() => { setDictation(null); reset('write'); }}>
          3. {tc('Напиши сам')}
        </button>
        <button
          type="button"
          className={`fchip${dictation !== null ? ' on' : ''}`}
          onClick={() => {
            const i = Math.floor(Math.random() * letters.length);
            setDictation(i);
            reset('write');
            say(letters[i].say ?? letters[i].ch, lang, 0, 0.75);
          }}
        >
          🎧 {tc('Диктант')}
        </button>
      </div>
      {mode === 'watch' ? (
        <div className="scene-controls">
          <button type="button" className="btn btn-light btn-small" onClick={() => setRun((r) => r + 1)}>
            ↻ {tc('Показать ещё раз')}
          </button>
          <span className="muted small">{tc('Цифры показывают порядок черт, а линия рисуется в ту сторону, куда ведут рукой.')}</span>
        </div>
      ) : (
        <div className="scene-controls">
          {dictation !== null && result === null && <span className="muted small">{tc('Послушай и напиши букву, которую услышал.')}</span>}
          {dictation !== null && result === null && (
            <button type="button" className="btn btn-light btn-small" onClick={listen}>
              🎧 {tc('Ещё раз')}
            </button>
          )}
          <button type="button" className="btn btn-light btn-small" onClick={() => { setInk([]); setResult(null); }}>
            {tc('Стереть')}
          </button>
          <button type="button" className="btn btn-primary btn-small" disabled={!ink.length} onClick={() => setResult(score(ref, ink))}>
            {tc('Проверить')}
          </button>
          {result !== null && (
            <span className={`cb-result ${result >= 0.55 ? 'ok' : 'try'}`}>
              {result >= 0.75 ? `⭐⭐⭐ ${tc('Отлично!')}` : result >= 0.55 ? `⭐⭐ ${tc('Хорошо! Можно ещё аккуратнее.')}` : `${tc('Попробуй ещё раз. Посмотри, как пишется, и обведи.')}`}
            </span>
          )}
          {result !== null && paths.length > 1 && ink.length !== paths.length && (
            <span className="muted small">{tc('Черт в этой букве')}: {paths.length}</span>
          )}
        </div>
      )}
    </figure>
  );
}

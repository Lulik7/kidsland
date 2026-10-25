import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';

export type Tc = (s: string) => string;
export const INK = '#34404f';
export const MINT = '#79c7a6';
export const PEACH = '#f4b391';
export const SKY = '#cfe9f7';
export const ORANGE = '#e07a3f';

/** A titled interactive picture: SVG scene, controls under it and short numbered hints. */
export function Scene({ title, w = 460, h = 260, children, controls, notes }: { title: string; w?: number; h?: number; children: ReactNode; controls?: ReactNode; notes?: string[] }) {
  return (
    <figure className="music-diagram scene">
      <figcaption className="md-title">{title}</figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w, touchAction: 'none' }} role="img" aria-label={title}>
        {children}
      </svg>
      {controls && <div className="scene-controls">{controls}</div>}
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

/** Converts a pointer position to the coordinates of the SVG the element is in. */
export function svgPoint(e: { clientX: number; clientY: number; currentTarget: Element }) {
  const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  const m = svg.getScreenCTM();
  return m ? p.matrixTransform(m.inverse()) : p;
}

/**
 * Makes SVG things draggable. `get(id)` gives props for a <g> that should follow the pointer;
 * `onDrop` runs when it is released.
 */
export function useDrag<T extends string | number>(start: Record<T, { x: number; y: number }>, onDrop?: (id: T, p: { x: number; y: number }) => { x: number; y: number } | void) {
  const [pos, setPos] = useState(start);
  const drag = useRef<{ id: T; dx: number; dy: number } | null>(null);
  const get = (id: T) => ({
    transform: `translate(${pos[id].x} ${pos[id].y})`,
    style: { cursor: 'grab', touchAction: 'none' } as const,
    onPointerDown: (e: RPointerEvent<SVGGElement>) => {
      const p = svgPoint(e);
      drag.current = { id, dx: p.x - pos[id].x, dy: p.y - pos[id].y };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: RPointerEvent<SVGGElement>) => {
      if (!drag.current || drag.current.id !== id) return;
      const p = svgPoint(e);
      setPos((s) => ({ ...s, [id]: { x: p.x - drag.current!.dx, y: p.y - drag.current!.dy } }));
    },
    onPointerUp: () => {
      if (!drag.current) return;
      const fixed = onDrop?.(id, pos[id]);
      if (fixed) setPos((s) => ({ ...s, [id]: fixed }));
      drag.current = null;
    },
  });
  return { pos, setPos, get };
}

/** A labelled range slider. */
export function Slider({ label, value, min, max, step = 1, onChange, hint }: { label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; hint?: ReactNode }) {
  return (
    <label className="metro-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="muted small">{hint}</span>}
    </label>
  );
}

/** A row of choice chips. */
export function Choices<T extends string>({ items, value, onChange }: { items: [T, string][]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div className="chips-row md-choices">
      {items.map(([id, label]) => (
        <button key={id} type="button" className={value === id ? 'fchip on' : 'fchip'} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** A message shown under a scene after the child does something. */
export const Say = ({ children }: { children: ReactNode }) => <div className="scene-say">{children}</div>;

/** Repeats an animation frame callback while mounted. */
export function useTicker(on: boolean, fn: (dt: number) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  const [, force] = useState(0);
  useAnimation(on, (dt) => {
    ref.current(dt);
    force((n) => n + 1);
  });
}

function useAnimation(on: boolean, fn: (dt: number) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!on) return;
    let last = performance.now();
    let id = requestAnimationFrame(function loop(now) {
      ref.current(Math.min(0.05, (now - last) / 1000));
      last = now;
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [on]);
}

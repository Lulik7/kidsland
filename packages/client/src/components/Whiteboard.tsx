import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Stroke } from '../api';
import { useT } from '../i18n';

const COLORS = ['#241d4f', '#ff6b3d', '#2fc46b', '#4c97ff', '#9966ff', '#ffab19'];
const WIDTHS = [3, 6, 12];

function draw(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  if (!s.points.length) return;
  ctx.save();
  ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  // Line width is relative to an 800px-wide board so it scales with the canvas.
  const lw = (s.width * (s.tool === 'eraser' ? 3 : 1) * w) / 800;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (s.points.length === 1) {
    ctx.beginPath();
    ctx.arc(s.points[0][0] * w, s.points[0][1] * h, lw / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(s.points[0][0] * w, s.points[0][1] * h);
    for (const [x, y] of s.points.slice(1)) ctx.lineTo(x * w, y * h);
    ctx.stroke();
  }
  ctx.restore();
}

/** Shared drawing board. Coordinates are stored normalised (0..1), so every screen size sees the same picture. */
export function Whiteboard({
  strokes,
  onStroke,
  onClear,
  label,
}: {
  strokes: Stroke[];
  onStroke?: (s: Stroke) => void;
  onClear?: () => void;
  label?: string;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = useRef<Stroke | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [color, setColor] = useState(COLORS[1]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [tool, setTool] = useState<Stroke['tool']>('pen');

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
      setSize({ w: el.width, h: el.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const redraw = () => {
    const el = canvasRef.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    for (const s of strokes) draw(ctx, s, el.width, el.height);
    if (current.current) draw(ctx, current.current, el.width, el.height);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(redraw, [strokes, size]);

  const point = (e: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    return [clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)];
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!onStroke) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = { color, width, tool, points: [point(e)] };
    redraw();
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const s = current.current;
    if (!s) return;
    const p = point(e);
    const last = s.points[s.points.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.003 || s.points.length >= 1000) return;
    s.points.push([Math.round(p[0] * 10000) / 10000, Math.round(p[1] * 10000) / 10000]);
    redraw();
  };
  const up = () => {
    const s = current.current;
    current.current = null;
    if (s && onStroke) onStroke(s);
  };

  return (
    <div className="board">
      <div className="board-tools">
        <b className="board-label">{label ?? t('Доска')}</b>
        {onStroke && (
          <>
            <div className="swatches">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={tool === 'pen' && color === c ? 'swatch on' : 'swatch'}
                  style={{ background: c }}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  aria-label={`${t('Цвет')} ${c}`}
                />
              ))}
            </div>
            <div className="widths">
              {WIDTHS.map((w) => (
                <button key={w} className={width === w ? 'wbtn on' : 'wbtn'} onClick={() => setWidth(w)} aria-label={`${t('Толщина')} ${w}`}>
                  <i style={{ width: w + 2, height: w + 2 }} />
                </button>
              ))}
            </div>
            <button className={tool === 'eraser' ? 'wbtn on tool' : 'wbtn tool'} onClick={() => setTool('eraser')}>
              {t('Ластик')}
            </button>
            {onClear && (
              <button className="wbtn tool" onClick={onClear}>
                {t('Очистить')}
              </button>
            )}
          </>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className={onStroke ? 'board-canvas' : 'board-canvas readonly'}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
    </div>
  );
}

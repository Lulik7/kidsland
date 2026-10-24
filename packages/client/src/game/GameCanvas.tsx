import type { Direction, LevelConfig, RobotState, Theme } from '@kidsland/shared';
import { useEffect, useRef } from 'react';
import { THEMES } from '../themes';

const CELL = 72;
const ANGLE: Record<Direction, number> = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI };

interface Props {
  config: LevelConfig;
  theme: Theme;
  state: RobotState;
  /** Shows a crash wobble when the last step bumped into something. */
  crashed?: boolean;
  /** Animation length of one step in ms. */
  stepMs: number;
}

interface Pose {
  x: number;
  y: number;
  angle: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Shortest rotation from a to b, so turning left from "up" goes the short way round. */
function angleTarget(from: number, to: number) {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return from + d;
}

export function GameCanvas({ config, theme, state, crashed, stepMs }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pose = useRef<Pose>({ x: state.x, y: state.y, angle: ANGLE[state.dir] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const t = THEMES[theme];
    const dpr = window.devicePixelRatio || 1;
    const w = config.width * CELL;
    const h = config.height * CELL;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const from = { ...pose.current };
    const to: Pose = { x: state.x, y: state.y, angle: angleTarget(from.angle, ANGLE[state.dir]) };
    const collected = new Set(state.collected.map((p) => `${p.x},${p.y}`));
    const started = performance.now();
    let frame = 0;

    const emoji = (char: string, cx: number, cy: number, size: number) => {
      ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, cx, cy);
    };

    const draw = (now: number) => {
      const k = Math.min(1, (now - started) / Math.max(1, stepMs * 0.85));
      const e = 1 - (1 - k) ** 3;
      const p: Pose = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), angle: lerp(from.angle, to.angle, e) };
      pose.current = p;

      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          ctx.fillStyle = t.cell;
          ctx.beginPath();
          ctx.roundRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8, 12);
          ctx.fill();
        }
      }
      for (const wall of config.walls) emoji(t.wall, wall.x * CELL + CELL / 2, wall.y * CELL + CELL / 2, CELL * 0.6);
      emoji(t.goal, config.goal.x * CELL + CELL / 2, config.goal.y * CELL + CELL / 2, CELL * 0.55);
      const bob = Math.sin(now / 250) * 3;
      for (const c of config.coins) {
        if (!collected.has(`${c.x},${c.y}`)) emoji('🪙', c.x * CELL + CELL / 2, c.y * CELL + CELL / 2 + bob, CELL * 0.45);
      }

      const wobble = crashed && k >= 1 ? Math.sin(now / 40) * 4 : 0;
      const cx = p.x * CELL + CELL / 2 + wobble;
      const cy = p.y * CELL + CELL / 2;
      // Halo plus a pointer showing which way the hero faces.
      ctx.fillStyle = t.accent;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(p.angle);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(CELL * 0.48, 0);
      ctx.lineTo(CELL * 0.34, -CELL * 0.1);
      ctx.lineTo(CELL * 0.34, CELL * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      emoji(t.hero, cx, cy, CELL * 0.55);

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [config, theme, state, crashed, stepMs]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      style={{ aspectRatio: `${config.width} / ${config.height}` }}
      aria-label="Игровое поле"
    />
  );
}

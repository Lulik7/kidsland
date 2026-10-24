import type { Direction, LevelConfig, Point, RobotState, Theme } from '@kidsland/shared';
import { useEffect, useRef } from 'react';
import { THEMES } from '../themes';
import { COIN, GOAL, HERO, ROTATES, WALL, spriteImage } from './sprites';

const CELL = 80;
const PAD = 14;
const ANGLE: Record<Direction, number> = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI };

interface Props {
  config: LevelConfig;
  theme: Theme;
  state: RobotState;
  /** Cells visited so far, drawn as a dotted trail. */
  trail?: Point[];
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

/** Deterministic pseudo-random per cell, for decorative specks that do not flicker between frames. */
const hash = (x: number, y: number, k = 0) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

export function GameCanvas({ config, theme, state, trail = [], crashed, stepMs }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pose = useRef<Pose>({ x: state.x, y: state.y, angle: ANGLE[state.dir] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const t = THEMES[theme];
    const dpr = window.devicePixelRatio || 1;
    const w = config.width * CELL + PAD * 2;
    const h = config.height * CELL + PAD * 2;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const from = { ...pose.current };
    const to: Pose = { x: state.x, y: state.y, angle: angleTarget(from.angle, ANGLE[state.dir]) };
    const collected = new Set(state.collected.map((p) => `${p.x},${p.y}`));
    const walls = config.walls;
    const heroImg = spriteImage(HERO[theme](state.dir));
    const goalImg = spriteImage(GOAL[theme]);
    const wallImg = spriteImage(WALL[theme]);
    const coinImg = spriteImage(COIN);
    const started = performance.now();
    let frame = 0;

    const cx = (x: number) => PAD + x * CELL + CELL / 2;
    const cy = (y: number) => PAD + y * CELL + CELL / 2;
    const sprite = (img: HTMLImageElement, x: number, y: number, size: number) => {
      if (img.complete) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    };

    const drawBoard = (now: number) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, t.bg);
      bg.addColorStop(1, t.bg2);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          const px = PAD + x * CELL;
          const py = PAD + y * CELL;
          ctx.fillStyle = t.tileEdge;
          ctx.beginPath();
          ctx.roundRect(px + 3, py + 6, CELL - 6, CELL - 6, 14);
          ctx.fill();
          ctx.fillStyle = (x + y) % 2 === 0 ? t.tileA : t.tileB;
          ctx.beginPath();
          ctx.roundRect(px + 3, py + 3, CELL - 6, CELL - 7, 14);
          ctx.fill();
          if (theme === 'space') {
            for (let k = 0; k < 3; k++) {
              const tw = 0.4 + 0.6 * Math.abs(Math.sin(now / 700 + hash(x, y, k) * 6));
              ctx.fillStyle = `rgba(255,255,255,${0.5 * tw})`;
              ctx.beginPath();
              ctx.arc(px + 12 + hash(x, y, k) * (CELL - 24), py + 12 + hash(y, x, k) * (CELL - 24), 1.4, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (theme === 'ocean') {
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 2;
            const off = Math.sin(now / 900 + x + y) * 4;
            ctx.beginPath();
            ctx.moveTo(px + 14, py + 30 + off);
            ctx.quadraticCurveTo(px + CELL / 2, py + 22 + off, px + CELL - 14, py + 30 + off);
            ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(42,35,80,0.18)';
            for (const [ox, oy] of [[10, 10], [CELL - 16, 10], [10, CELL - 17], [CELL - 16, CELL - 17]]) {
              ctx.beginPath();
              ctx.arc(px + ox + 3, py + oy + 3, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Pulsing ring around the goal.
      const pulse = 0.5 + 0.5 * Math.sin(now / 300);
      ctx.strokeStyle = `rgba(255, 210, 63, ${0.45 + 0.4 * pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(PAD + config.goal.x * CELL + 5, PAD + config.goal.y * CELL + 5, CELL - 10, CELL - 11, 14);
      ctx.stroke();
    };

    const draw = (now: number) => {
      const k = Math.min(1, (now - started) / Math.max(1, stepMs * 0.85));
      const e = 1 - (1 - k) ** 3;
      const p: Pose = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), angle: lerp(from.angle, to.angle, e) };
      pose.current = p;

      drawBoard(now);

      ctx.fillStyle = t.trail;
      for (const c of trail) {
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(cx(c.x), cy(c.y) + 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      sprite(goalImg, cx(config.goal.x), cy(config.goal.y) + Math.sin(now / 400) * 2, CELL * 0.72);
      for (const wl of walls) sprite(wallImg, cx(wl.x), cy(wl.y), CELL * 0.8);
      const bob = Math.sin(now / 250) * 3;
      for (const c of config.coins) {
        if (collected.has(`${c.x},${c.y}`)) continue;
        const squash = Math.abs(Math.cos(now / 500 + c.x));
        if (coinImg.complete) {
          const s = CELL * 0.5;
          ctx.drawImage(coinImg, cx(c.x) - (s * squash) / 2, cy(c.y) - s / 2 + bob, s * squash, s);
        }
      }

      const wobble = crashed && k >= 1 ? Math.sin(now / 40) * 4 : 0;
      const hx = PAD + p.x * CELL + CELL / 2 + wobble;
      const hy = PAD + p.y * CELL + CELL / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(hx, hy + CELL * 0.33, CELL * 0.3, CELL * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(hx, hy - 4);
      if (ROTATES[theme]) {
        // Facing left would draw the vehicle upside down, so mirror it instead.
        const a = ((p.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (a > Math.PI / 2 + 0.01 && a < (3 * Math.PI) / 2 - 0.01) {
          ctx.scale(-1, 1);
          ctx.rotate(Math.PI - p.angle);
        } else {
          ctx.rotate(p.angle);
        }
      } else {
        // The robot leans a little toward its heading.
        ctx.rotate(Math.cos(p.angle) * 0.08);
      }
      if (heroImg.complete) ctx.drawImage(heroImg, -CELL * 0.42, -CELL * 0.42, CELL * 0.84, CELL * 0.84);
      ctx.restore();

      if (!ROTATES[theme]) {
        // Small arrow so the heading is obvious for the robot.
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(p.angle);
        ctx.fillStyle = '#ff9f1c';
        ctx.strokeStyle = '#2a2350';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(CELL * 0.5, 0);
        ctx.lineTo(CELL * 0.36, -CELL * 0.11);
        ctx.lineTo(CELL * 0.36, CELL * 0.11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [config, theme, state, trail, crashed, stepMs]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      style={{ aspectRatio: `${config.width * CELL + PAD * 2} / ${config.height * CELL + PAD * 2}` }}
      aria-label="Игровое поле"
    />
  );
}

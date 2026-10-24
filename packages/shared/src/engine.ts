import type {
  BlockType,
  Condition,
  Direction,
  FailReason,
  LevelConfig,
  Point,
  Program,
  RobotState,
  RunResult,
  Statement,
  TraceStep,
} from './types';

export const MAX_STEPS = 1000;
export const MAX_NODES = 200;
export const MAX_DEPTH = 8;
export const MAX_REPEAT = 20;

const DIRS: Direction[] = ['up', 'right', 'down', 'left'];
const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function countBlocks(program: Program): number {
  return program.reduce((n, s) => n + 1 + ('body' in s ? countBlocks(s.body) : 0), 0);
}

/** Structural validation for programs coming from an untrusted client. Returns an error message or null. */
export function validateProgram(input: unknown, depth = 0): string | null {
  if (!Array.isArray(input)) return 'program must be an array';
  if (depth > MAX_DEPTH) return 'program is nested too deeply';
  for (const s of input) {
    if (typeof s !== 'object' || s === null) return 'invalid statement';
    const st = s as Record<string, unknown>;
    if (st.id !== undefined && typeof st.id !== 'string') return 'invalid block id';
    switch (st.type) {
      case 'move':
      case 'turn_left':
      case 'turn_right':
      case 'collect':
        break;
      case 'repeat':
        if (!Number.isInteger(st.times) || (st.times as number) < 1 || (st.times as number) > MAX_REPEAT) {
          return `repeat count must be 1..${MAX_REPEAT}`;
        }
        break;
      case 'repeat_until_goal':
        break;
      case 'if':
        if (st.condition !== 'coin_here' && st.condition !== 'path_ahead' && st.condition !== 'wall_ahead') {
          return 'unknown condition';
        }
        break;
      default:
        return `unknown statement type: ${String(st.type)}`;
    }
    if ('body' in st || st.type === 'repeat' || st.type === 'repeat_until_goal' || st.type === 'if') {
      const err = validateProgram(st.body, depth + 1);
      if (err) return err;
    }
  }
  if (depth === 0 && countBlocks(input as Program) > MAX_NODES) return 'program is too long';
  return null;
}

class Halt extends Error {
  constructor(public reason: FailReason) {
    super(reason);
  }
}

export function runProgram(level: LevelConfig, program: Program): RunResult {
  const walls = new Set(level.walls.map((p) => `${p.x},${p.y}`));
  const coinsLeft = new Set(level.coins.map((p) => `${p.x},${p.y}`));
  const state: RobotState = { x: level.start.x, y: level.start.y, dir: level.start.dir, collected: [] };
  const trace: TraceStep[] = [];
  let steps = 0;

  const snapshot = (): RobotState => ({ ...state, collected: [...state.collected] });
  const push = (event: TraceStep['event'], blockId?: string) => {
    trace.push({ blockId, event, state: snapshot() });
  };
  const tick = () => {
    if (++steps > MAX_STEPS) throw new Halt('too_many_steps');
  };
  const ahead = (): Point => ({ x: state.x + DELTA[state.dir].x, y: state.y + DELTA[state.dir].y });
  const blocked = (p: Point) =>
    p.x < 0 || p.y < 0 || p.x >= level.width || p.y >= level.height || walls.has(`${p.x},${p.y}`);
  const atGoal = () => samePoint(state, level.goal);

  const check = (c: Condition): boolean => {
    if (c === 'coin_here') return coinsLeft.has(`${state.x},${state.y}`);
    if (c === 'path_ahead') return !blocked(ahead());
    return blocked(ahead());
  };

  const exec = (body: Statement[]) => {
    for (const s of body) {
      tick();
      switch (s.type) {
        case 'move': {
          const next = ahead();
          if (blocked(next)) {
            push('bump', s.id);
            throw new Halt('crashed');
          }
          state.x = next.x;
          state.y = next.y;
          push('move', s.id);
          break;
        }
        case 'turn_left':
          state.dir = DIRS[(DIRS.indexOf(state.dir) + 3) % 4];
          push('turn', s.id);
          break;
        case 'turn_right':
          state.dir = DIRS[(DIRS.indexOf(state.dir) + 1) % 4];
          push('turn', s.id);
          break;
        case 'collect': {
          const key = `${state.x},${state.y}`;
          if (coinsLeft.delete(key)) {
            state.collected.push({ x: state.x, y: state.y });
            push('collect', s.id);
          } else {
            push('collect_miss', s.id);
          }
          break;
        }
        case 'repeat':
          for (let i = 0; i < s.times; i++) exec(s.body);
          break;
        case 'repeat_until_goal':
          while (!atGoal()) {
            tick();
            push('check', s.id);
            exec(s.body);
          }
          break;
        case 'if':
          push('check', s.id);
          if (check(s.condition)) exec(s.body);
          break;
      }
    }
  };

  const blocksUsed = countBlocks(program);
  const finish = (failReason?: FailReason): RunResult => {
    const success = !failReason;
    const stars = !success
      ? 0
      : blocksUsed <= level.optimalBlocks
        ? 3
        : blocksUsed <= level.optimalBlocks + 2
          ? 2
          : 1;
    return {
      success,
      failReason,
      trace,
      coinsCollected: state.collected.length,
      blocksUsed,
      stars,
      score: success ? stars * 100 + state.collected.length * 10 : 0,
    };
  };

  if (program.length === 0) return finish('empty_program');
  try {
    exec(program);
  } catch (e) {
    if (e instanceof Halt) return finish(e.reason);
    throw e;
  }
  if (!atGoal()) return finish('not_at_goal');
  if (coinsLeft.size > 0) return finish('coins_left');
  return finish();
}

export function blockTypeOf(s: Statement): BlockType {
  switch (s.type) {
    case 'move':
      return 'move_forward';
    case 'turn_left':
    case 'turn_right':
      return s.type;
    case 'collect':
      return 'collect_coin';
    case 'repeat':
      return 'repeat_times';
    case 'repeat_until_goal':
      return 'repeat_until_goal';
    case 'if':
      return s.condition === 'coin_here' ? 'if_coin' : 'if_path_ahead';
  }
}

/** Returns the first block type the program uses that the level does not offer, or null. */
export function findForbiddenBlock(program: Program, allowed: BlockType[]): BlockType | null {
  for (const s of program) {
    const t = blockTypeOf(s);
    if (!allowed.includes(t)) return t;
    if ('body' in s) {
      const inner = findForbiddenBlock(s.body, allowed);
      if (inner) return inner;
    }
  }
  return null;
}

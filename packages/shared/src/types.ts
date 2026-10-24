export type Direction = 'up' | 'right' | 'down' | 'left';

export type Theme = 'space' | 'ocean' | 'robot';

export interface Point {
  x: number;
  y: number;
}

/** Block types a level may offer in the Blockly toolbox. */
export type BlockType =
  | 'move_forward'
  | 'turn_left'
  | 'turn_right'
  | 'collect_coin'
  | 'repeat_times'
  | 'repeat_until_goal'
  | 'if_coin'
  | 'if_path_ahead';

/** Concepts a level teaches; used later by the parent dashboard. */
export type Concept = 'sequence' | 'loops' | 'conditions';

export interface LevelConfig {
  width: number;
  height: number;
  start: Point & { dir: Direction };
  goal: Point;
  walls: Point[];
  coins: Point[];
  availableBlocks: BlockType[];
  /** Block count of the reference solution; drives the star rating. */
  optimalBlocks: number;
  /** Max blocks the workspace accepts (0 = unlimited). */
  maxBlocks?: number;
  concepts: Concept[];
  hint?: string;
}

export type Condition = 'coin_here' | 'path_ahead' | 'wall_ahead';

/** Program AST produced from the Blockly workspace. `id` is the Blockly block id, used for highlighting. */
export type Statement =
  | { type: 'move'; id?: string }
  | { type: 'turn_left'; id?: string }
  | { type: 'turn_right'; id?: string }
  | { type: 'collect'; id?: string }
  | { type: 'repeat'; times: number; body: Statement[]; id?: string }
  | { type: 'repeat_until_goal'; body: Statement[]; id?: string }
  | { type: 'if'; condition: Condition; body: Statement[]; id?: string };

export type Program = Statement[];

export interface RobotState {
  x: number;
  y: number;
  dir: Direction;
  collected: Point[];
}

export type StepEvent = 'move' | 'turn' | 'collect' | 'collect_miss' | 'bump' | 'check';

export interface TraceStep {
  blockId?: string;
  event: StepEvent;
  state: RobotState;
}

export type FailReason = 'crashed' | 'not_at_goal' | 'coins_left' | 'too_many_steps' | 'empty_program';

export interface RunResult {
  success: boolean;
  failReason?: FailReason;
  trace: TraceStep[];
  coinsCollected: number;
  blocksUsed: number;
  stars: 0 | 1 | 2 | 3;
  score: number;
}

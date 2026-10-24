import { runProgram, type LevelConfig, type Point, type Program, type RobotState } from '@kidsland/shared';
import { useEffect, useMemo, useState } from 'react';
import { GameCanvas } from '../game/GameCanvas';

const CONFIG: LevelConfig = {
  width: 5,
  height: 4,
  start: { x: 0, y: 3, dir: 'right' },
  goal: { x: 3, y: 0 },
  walls: [
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 1 },
  ],
  coins: [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 3, y: 0 },
  ],
  availableBlocks: [],
  optimalBlocks: 6,
  concepts: ['loops'],
};

const PROGRAM: Program = [
  {
    type: 'repeat',
    times: 3,
    id: 'loop',
    body: [
      { type: 'move', id: 'move1' },
      { type: 'turn_left', id: 'left' },
      { type: 'move', id: 'move2' },
      { type: 'collect', id: 'coin' },
      { type: 'turn_right', id: 'right' },
    ],
  },
];

const LINES = [
  { id: 'loop', text: 'Повторить 3 раза', cls: 'loop', indent: false },
  { id: 'move1', text: 'Шаг вперёд', cls: 'move', indent: true },
  { id: 'left', text: 'Налево', cls: 'move', indent: true },
  { id: 'move2', text: 'Шаг вперёд', cls: 'move', indent: true },
  { id: 'coin', text: 'Собрать монету', cls: 'coin', indent: true },
  { id: 'right', text: 'Направо', cls: 'move', indent: true },
];

const STEP_MS = 520;

/** Landing-page demo: plays a short program on a loop so visitors see the game in action. */
export function DemoBoard() {
  const trace = useMemo(() => runProgram(CONFIG, PROGRAM).trace, []);
  const [i, setI] = useState(-1);

  useEffect(() => {
    const t = window.setTimeout(() => setI((n) => (n + 1 > trace.length + 2 ? -1 : n + 1)), i < 0 ? 1200 : STEP_MS);
    return () => window.clearTimeout(t);
  }, [i, trace.length]);

  const step = i >= 0 ? trace[Math.min(i, trace.length - 1)] : null;
  const state: RobotState = step?.state ?? { ...CONFIG.start, collected: [] };
  const trail = useMemo<Point[]>(
    () => [CONFIG.start, ...trace.slice(0, Math.max(0, Math.min(i, trace.length - 1)) + 1).filter((s) => s.event === 'move').map((s) => s.state)],
    [i, trace],
  );
  const active = i >= 0 && i < trace.length ? trace[i].blockId : null;

  return (
    <div className="demo">
      <div className="demo-code">
        <div className="demo-line start">Старт</div>
        {LINES.map((l) => (
          <div key={l.id} className={`demo-line ${l.cls}${l.indent ? ' indent' : ''}${active === l.id ? ' on' : ''}`}>
            {l.text}
          </div>
        ))}
      </div>
      <div className="demo-board">
        <GameCanvas config={CONFIG} theme="robot" state={state} trail={i >= 0 ? trail : []} stepMs={STEP_MS} />
      </div>
    </div>
  );
}

import type { BlockType, Program, Statement } from '@kidsland/shared';
import * as Blockly from 'blockly';
import * as Ru from 'blockly/msg/ru';

Blockly.setLocale(Ru as unknown as { [key: string]: string });

const START = 'kl_start';

const COLORS = { motion: 210, action: 45, loop: 120, logic: 290, start: 20 };

let defined = false;

export function defineBlocks() {
  if (defined) return;
  defined = true;
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: START,
      message0: '▶ Старт',
      nextStatement: null,
      colour: COLORS.start,
      tooltip: 'Программа начинается здесь',
    },
    {
      type: 'move_forward',
      message0: '⬆️ Шаг вперёд',
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.motion,
    },
    {
      type: 'turn_left',
      message0: '↩️ Повернуть налево',
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.motion,
    },
    {
      type: 'turn_right',
      message0: '↪️ Повернуть направо',
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.motion,
    },
    {
      type: 'collect_coin',
      message0: '🪙 Собрать монету',
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.action,
    },
    {
      type: 'repeat_times',
      message0: '🔁 Повторить %1 раз',
      args0: [{ type: 'field_number', name: 'TIMES', value: 3, min: 1, max: 20, precision: 1 }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.loop,
    },
    {
      type: 'repeat_until_goal',
      message0: '🔁 Повторять, пока не у цели',
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.loop,
    },
    {
      type: 'if_coin',
      message0: '❓ Если здесь монета',
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.logic,
    },
    {
      type: 'if_path_ahead',
      message0: '❓ Если %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'COND',
          options: [
            ['путь свободен', 'path_ahead'],
            ['впереди стена', 'wall_ahead'],
          ],
        },
      ],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.logic,
    },
  ]);
}

export function toolboxFor(blocks: BlockType[]): Blockly.utils.toolbox.ToolboxDefinition {
  return { kind: 'flyoutToolbox', contents: blocks.map((type) => ({ kind: 'block', type })) };
}

function chainToProgram(first: Blockly.Block | null): Program {
  const out: Statement[] = [];
  for (let b = first; b; b = b.getNextBlock()) {
    if (!b.isEnabled()) continue;
    const body = () => chainToProgram(b.getInputTargetBlock('DO'));
    switch (b.type) {
      case 'move_forward':
        out.push({ type: 'move', id: b.id });
        break;
      case 'turn_left':
        out.push({ type: 'turn_left', id: b.id });
        break;
      case 'turn_right':
        out.push({ type: 'turn_right', id: b.id });
        break;
      case 'collect_coin':
        out.push({ type: 'collect', id: b.id });
        break;
      case 'repeat_times':
        out.push({ type: 'repeat', times: Number(b.getFieldValue('TIMES')), body: body(), id: b.id });
        break;
      case 'repeat_until_goal':
        out.push({ type: 'repeat_until_goal', body: body(), id: b.id });
        break;
      case 'if_coin':
        out.push({ type: 'if', condition: 'coin_here', body: body(), id: b.id });
        break;
      case 'if_path_ahead':
        out.push({ type: 'if', condition: b.getFieldValue('COND'), body: body(), id: b.id });
        break;
    }
  }
  return out;
}

/** Only blocks attached under the start block are part of the program; loose blocks are ignored. */
export function workspaceToProgram(ws: Blockly.Workspace): Program {
  const start = ws.getBlocksByType(START, false)[0];
  return start ? chainToProgram(start.getNextBlock()) : [];
}

type BlockState = Blockly.serialization.blocks.State;

function statementToState(s: Statement, next?: BlockState): BlockState {
  const withNext = (state: BlockState): BlockState => (next ? { ...state, next: { block: next } } : state);
  const bodyInput = (body: Statement[]) => {
    const inner = programToChain(body);
    return inner ? { inputs: { DO: { block: inner } } } : {};
  };
  switch (s.type) {
    case 'move':
      return withNext({ type: 'move_forward' });
    case 'turn_left':
    case 'turn_right':
      return withNext({ type: s.type });
    case 'collect':
      return withNext({ type: 'collect_coin' });
    case 'repeat':
      return withNext({ type: 'repeat_times', fields: { TIMES: s.times }, ...bodyInput(s.body) });
    case 'repeat_until_goal':
      return withNext({ type: 'repeat_until_goal', ...bodyInput(s.body) });
    case 'if':
      return s.condition === 'coin_here'
        ? withNext({ type: 'if_coin', ...bodyInput(s.body) })
        : withNext({ type: 'if_path_ahead', fields: { COND: s.condition }, ...bodyInput(s.body) });
  }
}

function programToChain(program: Program): BlockState | undefined {
  let next: BlockState | undefined;
  for (let i = program.length - 1; i >= 0; i--) next = statementToState(program[i], next);
  return next;
}

/** Clears the workspace and lays out the start block, optionally followed by a saved program. */
export function loadProgram(ws: Blockly.WorkspaceSvg, program: Program | null) {
  ws.clear();
  const chain = program ? programToChain(program) : undefined;
  Blockly.serialization.blocks.append(
    { type: START, x: 24, y: 24, deletable: false, ...(chain ? { next: { block: chain } } : {}) },
    ws,
  );
}

import type { BlockType, Program, Statement } from '@kidsland/shared';
import * as Blockly from 'blockly';
import * as Ru from 'blockly/msg/ru';
import { COIN, toDataUrl } from './sprites';

Blockly.setLocale(Ru as unknown as { [key: string]: string });

const START = 'kl_start';

const COLORS = { motion: '#4c97ff', action: '#ffab19', loop: '#40bf4a', logic: '#9966ff', start: '#ff6680' };

export const KIDS_THEME = Blockly.Theme.defineTheme('kidsland', {
  name: 'kidsland',
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#f7f5ff',
    toolboxBackgroundColour: '#efeaff',
    flyoutBackgroundColour: '#efeaff',
    flyoutOpacity: 1,
    scrollbarColour: '#c9bff5',
    scrollbarOpacity: 0.8,
    insertionMarkerColour: '#7b5cff',
    insertionMarkerOpacity: 0.4,
  },
  fontStyle: { family: 'Nunito, sans-serif', weight: '800', size: 13 },
  startHats: true,
});

const icon = (d: string, fill = 'none') =>
  toDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`,
  );

const ICONS = {
  start: icon('<path d="M5 22V4h12l-2.5 4.5L17 13H5"/>', '#fff'),
  move: icon('<path d="M12 20V5M5 11l7-7 7 7"/>'),
  left: icon('<path d="M18 20v-6a6 6 0 0 0-6-6H5M9 3 4 8l5 5"/>'),
  right: icon('<path d="M6 20v-6a6 6 0 0 1 6-6h7M15 3l5 5-5 5"/>'),
  coin: toDataUrl(COIN),
  loop: icon('<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>'),
  ask: icon('<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 1 1 4 2.8c-.8.3-1 .9-1 1.7M12 17h.01"/>'),
};

const img = (src: string) => ({ type: 'field_image', src, width: 22, height: 22, alt: '' });

let defined = false;

export function defineBlocks() {
  if (defined) return;
  defined = true;
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: START,
      message0: '%1 Старт',
      args0: [img(ICONS.start)],
      nextStatement: null,
      colour: COLORS.start,
      tooltip: 'Программа начинается здесь',
    },
    {
      type: 'move_forward',
      message0: '%1 Шаг вперёд',
      args0: [img(ICONS.move)],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.motion,
    },
    {
      type: 'turn_left',
      message0: '%1 Налево',
      args0: [img(ICONS.left)],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.motion,
    },
    {
      type: 'turn_right',
      message0: '%1 Направо',
      args0: [img(ICONS.right)],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.motion,
    },
    {
      type: 'collect_coin',
      message0: '%1 Собрать монету',
      args0: [img(ICONS.coin)],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.action,
    },
    {
      type: 'repeat_times',
      message0: '%1 Повторить %2 раз',
      args0: [img(ICONS.loop), { type: 'field_number', name: 'TIMES', value: 3, min: 1, max: 20, precision: 1 }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.loop,
    },
    {
      type: 'repeat_until_goal',
      message0: '%1 Повторять, пока не у цели',
      args0: [img(ICONS.loop)],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.loop,
    },
    {
      type: 'if_coin',
      message0: '%1 Если здесь монета',
      args0: [img(ICONS.ask)],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLORS.logic,
    },
    {
      type: 'if_path_ahead',
      message0: '%1 Если %2',
      args0: [
        img(ICONS.ask),
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
    { type: START, x: 40, y: 40, deletable: false, ...(chain ? { next: { block: chain } } : {}) },
    ws,
  );
}

import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels';
import { findForbiddenBlock, runProgram, validateProgram } from './engine';
import type { LevelConfig } from './types';

const corridor: LevelConfig = {
  width: 4,
  height: 1,
  start: { x: 0, y: 0, dir: 'right' },
  goal: { x: 3, y: 0 },
  walls: [],
  coins: [],
  availableBlocks: ['move_forward'],
  optimalBlocks: 3,
  concepts: ['sequence'],
};

describe('levels', () => {
  it.each(LEVELS.map((l) => [l.slug, l] as const))('%s is solvable with 3 stars', (_slug, level) => {
    expect(validateProgram(level.solution)).toBeNull();
    const result = runProgram(level.config, level.solution);
    expect(result.failReason).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.stars).toBe(3);
    expect(result.coinsCollected).toBe(level.config.coins.length);
  });

  it('has unique slugs', () => {
    expect(new Set(LEVELS.map((l) => l.slug)).size).toBe(LEVELS.length);
  });
});

describe('runProgram', () => {
  it('crashes into the border', () => {
    const r = runProgram(corridor, [{ type: 'repeat', times: 5, body: [{ type: 'move' }] }]);
    expect(r.success).toBe(false);
    expect(r.failReason).toBe('crashed');
    expect(r.trace.at(-1)?.event).toBe('bump');
  });

  it('fails when short of the goal', () => {
    expect(runProgram(corridor, [{ type: 'move' }]).failReason).toBe('not_at_goal');
  });

  it('rejects an empty program', () => {
    expect(runProgram(corridor, []).failReason).toBe('empty_program');
  });

  it('stops endless loops', () => {
    const r = runProgram(corridor, [{ type: 'repeat_until_goal', body: [{ type: 'turn_left' }] }]);
    expect(r.failReason).toBe('too_many_steps');
  });

  it('requires all coins', () => {
    const level = { ...corridor, coins: [{ x: 1, y: 0 }] };
    const moves = [{ type: 'move' as const }, { type: 'move' as const }, { type: 'move' as const }];
    expect(runProgram(level, moves).failReason).toBe('coins_left');
  });

  it('gives fewer stars for longer programs', () => {
    const long = [
      { type: 'turn_left' as const },
      { type: 'turn_right' as const },
      { type: 'turn_left' as const },
      { type: 'turn_right' as const },
      { type: 'move' as const },
      { type: 'move' as const },
      { type: 'move' as const },
    ];
    const r = runProgram(corridor, long);
    expect(r.success).toBe(true);
    expect(r.stars).toBe(1);
  });

  it('records block ids for highlighting', () => {
    const r = runProgram(corridor, [{ type: 'repeat', times: 3, id: 'loop', body: [{ type: 'move', id: 'step' }] }]);
    expect(r.trace.map((t) => t.blockId)).toEqual(['step', 'step', 'step']);
  });
});

describe('validateProgram', () => {
  it('rejects garbage', () => {
    expect(validateProgram('x')).not.toBeNull();
    expect(validateProgram([{ type: 'fly' }])).not.toBeNull();
    expect(validateProgram([{ type: 'repeat', times: 999, body: [] }])).not.toBeNull();
    expect(validateProgram([{ type: 'if', condition: 'coin_here' }])).not.toBeNull();
  });

  it('rejects deep nesting', () => {
    let p: unknown = [{ type: 'move' }];
    for (let i = 0; i < 12; i++) p = [{ type: 'repeat', times: 2, body: p }];
    expect(validateProgram(p)).not.toBeNull();
  });
});

describe('findForbiddenBlock', () => {
  it('spots blocks the level does not offer', () => {
    const p = [{ type: 'repeat' as const, times: 2, body: [{ type: 'collect' as const }] }];
    expect(findForbiddenBlock(p, ['repeat_times'])).toBe('collect_coin');
    expect(findForbiddenBlock(p, ['repeat_times', 'collect_coin'])).toBeNull();
  });

  it('accepts every reference solution', () => {
    for (const l of LEVELS) expect(findForbiddenBlock(l.solution, l.config.availableBlocks)).toBeNull();
  });
});

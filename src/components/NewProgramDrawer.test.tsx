import { describe, it, expect } from 'vitest';
import { canCreateProgram } from './NewProgramDrawer';

describe('canCreateProgram', () => {
  it('is false with no name and no blocks', () => {
    expect(canCreateProgram('', [])).toBe(false);
  });

  it('is false with a name but no blocks', () => {
    expect(canCreateProgram('Push Day', [])).toBe(false);
  });

  it('is false with a name and a block that has no exercises', () => {
    const blocks = [{ id: 'b1', title: 'Warm-up', subtitle: '', blockType: 'warmup' as const, durationMinutes: 5, exercises: [] }];
    expect(canCreateProgram('Push Day', blocks)).toBe(false);
  });

  it('is false with a block containing an exercise but a blank name', () => {
    const blocks = [
      { id: 'b1', title: 'Warm-up', subtitle: '', blockType: 'warmup' as const, durationMinutes: 5, exercises: [{ id: 'e1', exerciseId: 'ex-1' }] },
    ];
    expect(canCreateProgram('   ', blocks)).toBe(false);
  });

  it('is true with a name and at least one block containing at least one exercise', () => {
    const blocks = [
      { id: 'b1', title: 'Warm-up', subtitle: '', blockType: 'warmup' as const, durationMinutes: 5, exercises: [] },
      { id: 'b2', title: 'Strength', subtitle: '', blockType: 'strength' as const, durationMinutes: 20, exercises: [{ id: 'e1', exerciseId: 'ex-1' }] },
    ];
    expect(canCreateProgram('Push Day', blocks)).toBe(true);
  });
});

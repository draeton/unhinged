import { describe, it, expect } from 'vitest';
import { resolveExercise } from './resolveExercise';
import type { Exercise } from '../types/workout';
import type { BlockExercise } from '../types/program';

const baseExercise: Exercise = {
  id: 'ex-1',
  userId: 'user-1',
  name: 'Pull-Ups',
  workSeconds: null,
  restSeconds: 90,
  sets: 5,
  repsOrTime: '8 Reps',
  targetMuscles: ['lats', 'biceps'],
  equipment: 'Pull-Up Bar',
  description: 'Strict pull-ups.',
  formCues: ['Full range of motion'],
  safetyTip: 'Stop if grip fails.',
  videoUrls: [],
};

const noOverrides: BlockExercise = {
  id: 'be-1',
  blockId: 'block-1',
  exerciseId: 'ex-1',
  position: 0,
  setsOverride: null,
  workSecondsOverride: null,
  restSecondsOverride: null,
  repsOrTimeOverride: null,
};

describe('resolveExercise', () => {
  it('falls back to the library exercise defaults when all overrides are null', () => {
    const resolved = resolveExercise(baseExercise, noOverrides);

    expect(resolved.sets).toBe(5);
    expect(resolved.restSeconds).toBe(90);
    expect(resolved.workSeconds).toBeNull();
    expect(resolved.repsOrTime).toBe('8 Reps');
  });

  it('respects an explicit override of 0, not treating it as unset', () => {
    const resolved = resolveExercise(baseExercise, { ...noOverrides, restSecondsOverride: 0, workSecondsOverride: 0 });

    expect(resolved.restSeconds).toBe(0);
    expect(resolved.workSeconds).toBe(0);
  });

  it('applies mixed partial overrides, leaving unset fields at their defaults', () => {
    const resolved = resolveExercise(baseExercise, { ...noOverrides, setsOverride: 3, repsOrTimeOverride: '3 x 12 Reps' });

    expect(resolved.sets).toBe(3);
    expect(resolved.repsOrTime).toBe('3 x 12 Reps');
    expect(resolved.restSeconds).toBe(90); // unset override still falls back to default
    expect(resolved.workSeconds).toBeNull();
  });

  it('carries the blockExerciseId through so the placement can be edited/removed', () => {
    const resolved = resolveExercise(baseExercise, { ...noOverrides, id: 'be-42' });
    expect(resolved.blockExerciseId).toBe('be-42');
    expect(resolved.id).toBe('ex-1');
  });
});

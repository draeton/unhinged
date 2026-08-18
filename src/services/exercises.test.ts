import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseFrom } from '../test-utils/mockSupabaseClient';

vi.mock('../utils/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../utils/supabase';
import { listExercises, createExercise, checkExerciseUsage, deleteExercise } from './exercises';

const exerciseRow = {
  id: 'ex-1',
  user_id: 'user-1',
  name: 'Pull-Ups',
  work_seconds: null,
  rest_seconds: 90,
  sets: 3,
  reps_or_time: '8 Reps',
  target_muscles: ['lats', 'biceps'],
  equipment: 'Pull-Up Bar',
  description: 'Strict pull-ups.',
  form_cues: ['Full range of motion'],
  safety_tip: 'Stop if grip fails.',
  video_urls: [],
};

describe('exercises service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listExercises maps snake_case rows to camelCase Exercise objects', async () => {
    (supabase.from as any).mockImplementation(
      mockSupabaseFrom({ exercises: { data: [exerciseRow], error: null } })
    );

    const result = await listExercises('user-1');

    expect(result).toEqual([
      {
        id: 'ex-1',
        userId: 'user-1',
        name: 'Pull-Ups',
        workSeconds: null,
        restSeconds: 90,
        sets: 3,
        repsOrTime: '8 Reps',
        targetMuscles: ['lats', 'biceps'],
        equipment: 'Pull-Up Bar',
        description: 'Strict pull-ups.',
        formCues: ['Full range of motion'],
        safetyTip: 'Stop if grip fails.',
        videoUrls: [],
      },
    ]);
  });

  it('createExercise sends the owning user_id and mapped columns', async () => {
    const insert = vi.fn(() => query);
    const query: any = {
      insert,
      select: vi.fn(() => query),
      single: vi.fn(() => Promise.resolve({ data: exerciseRow, error: null })),
    };
    (supabase.from as any).mockImplementation(() => query);

    const result = await createExercise('user-1', {
      name: 'Pull-Ups',
      workSeconds: null,
      restSeconds: 90,
      sets: 3,
      repsOrTime: '8 Reps',
      targetMuscles: ['lats', 'biceps'],
      equipment: 'Pull-Up Bar',
      description: 'Strict pull-ups.',
      formCues: ['Full range of motion'],
      safetyTip: 'Stop if grip fails.',
      videoUrls: [],
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', name: 'Pull-Ups', rest_seconds: 90 })
    );
    expect(result.id).toBe('ex-1');
  });

  it('checkExerciseUsage counts distinct blocks and programs', async () => {
    (supabase.from as any).mockImplementation(
      mockSupabaseFrom({
        program_block_exercises: {
          data: [{ block_id: 'block-1' }, { block_id: 'block-2' }],
          error: null,
        },
        program_blocks: {
          data: [{ program_id: 'prog-1' }, { program_id: 'prog-1' }],
          error: null,
        },
      })
    );

    const usage = await checkExerciseUsage('ex-1');

    expect(usage).toEqual({ blockCount: 2, programCount: 1 });
  });

  it('checkExerciseUsage returns zero without querying program_blocks when unused', async () => {
    (supabase.from as any).mockImplementation(
      mockSupabaseFrom({ program_block_exercises: { data: [], error: null } })
    );

    const usage = await checkExerciseUsage('ex-1');

    expect(usage).toEqual({ blockCount: 0, programCount: 0 });
  });

  it('deleteExercise refuses to delete an exercise that is still in use', async () => {
    (supabase.from as any).mockImplementation(
      mockSupabaseFrom({
        program_block_exercises: { data: [{ block_id: 'block-1' }], error: null },
        program_blocks: { data: [{ program_id: 'prog-1' }], error: null },
      })
    );

    await expect(deleteExercise('ex-1')).rejects.toThrow(/Used in 1 block/);
  });

  it('deleteExercise deletes when unused', async () => {
    const deleteFn = vi.fn(() => query);
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      delete: deleteFn,
      then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'program_block_exercises') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })) };
      }
      return query;
    });

    await deleteExercise('ex-1');

    expect(deleteFn).toHaveBeenCalled();
  });
});

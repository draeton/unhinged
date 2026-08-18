import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseFrom } from '../test-utils/mockSupabaseClient';

vi.mock('../utils/supabase', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

import { supabase } from '../utils/supabase';
import { getResolvedProgram, createBlock, reorderBlocks } from './programs';

describe('programs service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getResolvedProgram assembles blocks + placements + exercises and applies overrides', async () => {
    (supabase.from as any).mockImplementation(
      mockSupabaseFrom({
        programs: {
          data: { id: 'prog-1', user_id: 'user-1', name: 'Test Program', description: '', created_at: 't', updated_at: 't' },
          error: null,
        },
        program_blocks: {
          data: [{ id: 'block-1', user_id: 'user-1', program_id: 'prog-1', title: 'Warm-up', subtitle: '', block_type: 'warmup', badge_color: '#00F0FF', duration_minutes: 10, position: 0 }],
          error: null,
        },
        program_block_exercises: {
          data: [{ id: 'be-1', user_id: 'user-1', block_id: 'block-1', exercise_id: 'ex-1', position: 0, sets_override: 2, work_seconds_override: null, rest_seconds_override: null, reps_or_time_override: null }],
          error: null,
        },
        exercises: {
          data: [{ id: 'ex-1', user_id: 'user-1', name: 'Push-Ups', work_seconds: null, rest_seconds: 60, sets: 3, reps_or_time: '10 Reps', target_muscles: [], equipment: '', description: '', form_cues: [], safety_tip: '', video_urls: [] }],
          error: null,
        },
      })
    );

    const resolved = await getResolvedProgram('prog-1');

    expect(resolved.name).toBe('Test Program');
    expect(resolved.blocks).toHaveLength(1);
    expect(resolved.blocks[0].blockType).toBe('warmup');
    expect(resolved.blocks[0].exercises).toHaveLength(1);
    expect(resolved.blocks[0].exercises[0]).toMatchObject({
      name: 'Push-Ups',
      sets: 2, // overridden
      restSeconds: 60, // falls back to the library default (override was null)
    });
  });

  it('createBlock assigns the next position based on max+1, not the list length (survives gaps)', async () => {
    const insert = vi.fn(() => insertQuery);
    const insertQuery: any = {
      select: vi.fn(() => insertQuery),
      single: vi.fn(() => Promise.resolve({
        data: { id: 'block-new', user_id: 'user-1', program_id: 'prog-1', title: 'New Block', subtitle: '', block_type: 'strength', badge_color: '#00F0FF', duration_minutes: 15, position: 3 },
        error: null,
      })),
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'program_blocks') {
        // First call in createBlock is listBlocks' select (returns blocks with a gap:
        // positions 0 and 2, as if position 1 was deleted); the actual insert call is
        // captured separately via the `insert` mock below regardless of chain shape.
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  { id: 'block-a', user_id: 'user-1', program_id: 'prog-1', title: 'A', subtitle: '', block_type: 'warmup', badge_color: '#00F0FF', duration_minutes: 10, position: 0 },
                  { id: 'block-b', user_id: 'user-1', program_id: 'prog-1', title: 'B', subtitle: '', block_type: 'cooldown', badge_color: '#00F0FF', duration_minutes: 5, position: 2 },
                ],
                error: null,
              })),
            })),
          })),
          insert,
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    await createBlock('user-1', 'prog-1', { title: 'New Block', subtitle: '', blockType: 'strength', badgeColor: '#00F0FF', durationMinutes: 15 });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ position: 3 }));
  });

  it('reorderBlocks upserts full rows (all NOT NULL columns) with reindexed positions', async () => {
    const upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'program_blocks') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  { id: 'block-a', user_id: 'user-1', program_id: 'prog-1', title: 'A', subtitle: '', block_type: 'warmup', badge_color: '#00F0FF', duration_minutes: 10, position: 0 },
                  { id: 'block-b', user_id: 'user-1', program_id: 'prog-1', title: 'B', subtitle: '', block_type: 'cooldown', badge_color: '#00F0FF', duration_minutes: 5, position: 1 },
                ],
                error: null,
              })),
            })),
          })),
          upsert,
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    await reorderBlocks('user-1', 'prog-1', ['block-b', 'block-a']);

    expect(upsert).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'block-b', position: 0, program_id: 'prog-1', user_id: 'user-1', block_type: 'cooldown' }),
      expect.objectContaining({ id: 'block-a', position: 1, program_id: 'prog-1', user_id: 'user-1', block_type: 'warmup' }),
    ]);
  });
});

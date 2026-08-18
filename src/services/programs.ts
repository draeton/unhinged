import { supabase } from '../utils/supabase';
import type { Exercise } from '../types/workout';
import type { Program, ProgramBlock, BlockExercise, BlockType, ResolvedProgram } from '../types/program';
import { resolveExercise } from './resolveExercise';
import { rowToExercise } from './exercises';

interface ProgramRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProgramBlockRow {
  id: string;
  user_id: string;
  program_id: string;
  title: string;
  subtitle: string;
  block_type: BlockType;
  badge_color: string;
  duration_minutes: number;
  position: number;
}

interface BlockExerciseRow {
  id: string;
  user_id: string;
  block_id: string;
  exercise_id: string;
  position: number;
  sets_override: number | null;
  work_seconds_override: number | null;
  rest_seconds_override: number | null;
  reps_or_time_override: string | null;
}

const rowToProgram = (row: ProgramRow): Program => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToBlock = (row: ProgramBlockRow): ProgramBlock => ({
  id: row.id,
  programId: row.program_id,
  title: row.title,
  subtitle: row.subtitle,
  blockType: row.block_type,
  badgeColor: row.badge_color,
  durationMinutes: row.duration_minutes,
  position: row.position,
});

const rowToBlockExercise = (row: BlockExerciseRow): BlockExercise => ({
  id: row.id,
  blockId: row.block_id,
  exerciseId: row.exercise_id,
  position: row.position,
  setsOverride: row.sets_override,
  workSecondsOverride: row.work_seconds_override,
  restSecondsOverride: row.rest_seconds_override,
  repsOrTimeOverride: row.reps_or_time_override,
});

const nextPosition = (items: { position: number }[]): number =>
  items.reduce((max, item) => Math.max(max, item.position), -1) + 1;

// --- Programs ---------------------------------------------------------------

export async function listPrograms(userId: string): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToProgram);
}

export async function getProgram(id: string): Promise<Program | null> {
  const { data, error } = await supabase.from('programs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToProgram(data) : null;
}

export async function createProgram(userId: string, name: string, description = ''): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .insert({ user_id: userId, name, description })
    .select('*')
    .single();
  if (error) throw error;
  return rowToProgram(data);
}

// Duplicates an existing (caller-owned) program via the clone_program RPC, which reuses
// the source's exercise_id references rather than cloning exercise rows -- duplicating a
// program shares the library, it doesn't fork it. See supabase/migrations for the RPC.
export async function duplicateProgram(userId: string, sourceProgramId: string, newName: string): Promise<Program> {
  const { data: newProgramId, error } = await supabase.rpc('clone_program', {
    p_source_program_id: sourceProgramId,
    p_user_id: userId,
    p_new_name: newName,
  });
  if (error) throw error;

  const program = await getProgram(newProgramId as string);
  if (!program) throw new Error('Duplicated program could not be loaded.');
  return program;
}

export async function renameProgram(id: string, name: string, description?: string): Promise<Program> {
  const patch: Record<string, unknown> = { name };
  if (description !== undefined) patch.description = description;
  const { data, error } = await supabase.from('programs').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return rowToProgram(data);
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw error;
}

// --- Blocks -------------------------------------------------------------------

export async function listBlocks(programId: string): Promise<ProgramBlock[]> {
  const { data, error } = await supabase
    .from('program_blocks')
    .select('*')
    .eq('program_id', programId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToBlock);
}

export interface BlockInput {
  title: string;
  subtitle: string;
  blockType: BlockType;
  badgeColor: string;
  durationMinutes: number;
}

export async function createBlock(userId: string, programId: string, input: BlockInput): Promise<ProgramBlock> {
  const existing = await listBlocks(programId);
  const { data, error } = await supabase
    .from('program_blocks')
    .insert({
      user_id: userId,
      program_id: programId,
      title: input.title,
      subtitle: input.subtitle,
      block_type: input.blockType,
      badge_color: input.badgeColor,
      duration_minutes: input.durationMinutes,
      position: nextPosition(existing),
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToBlock(data);
}

export async function updateBlock(id: string, input: Partial<BlockInput>): Promise<ProgramBlock> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle;
  if (input.blockType !== undefined) patch.block_type = input.blockType;
  if (input.badgeColor !== undefined) patch.badge_color = input.badgeColor;
  if (input.durationMinutes !== undefined) patch.duration_minutes = input.durationMinutes;

  const { data, error } = await supabase.from('program_blocks').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return rowToBlock(data);
}

export async function deleteBlock(id: string): Promise<void> {
  const { error } = await supabase.from('program_blocks').delete().eq('id', id);
  if (error) throw error;
}

// Batched upsert of every block's full row with a new `position`, in one request/one
// transaction -- a plain per-row `.update({position})` can transiently collide with the
// (program_id, position) unique constraint on a simple two-item swap, since each
// supabase-js call is its own transaction and the constraint's DEFERRABLE clause only
// helps within a single transaction. A one-request upsert needs every NOT NULL column,
// which is why this re-sends the full block rows rather than just id+position.
export async function reorderBlocks(userId: string, programId: string, orderedBlockIds: string[]): Promise<void> {
  const blocks = await listBlocks(programId);
  const byId = new Map(blocks.map(b => [b.id, b]));

  const rows = orderedBlockIds.map((id, index) => {
    const block = byId.get(id);
    if (!block) throw new Error(`reorderBlocks: block ${id} not found in program ${programId}`);
    return {
      id: block.id,
      user_id: userId,
      program_id: block.programId,
      title: block.title,
      subtitle: block.subtitle,
      block_type: block.blockType,
      badge_color: block.badgeColor,
      duration_minutes: block.durationMinutes,
      position: index,
    };
  });

  const { error } = await supabase.from('program_blocks').upsert(rows);
  if (error) throw error;
}

// --- Block <-> Exercise placements --------------------------------------------

export async function listBlockExercises(blockId: string): Promise<BlockExercise[]> {
  const { data, error } = await supabase
    .from('program_block_exercises')
    .select('*')
    .eq('block_id', blockId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToBlockExercise);
}

export interface BlockExerciseOverrides {
  setsOverride?: number | null;
  workSecondsOverride?: number | null;
  restSecondsOverride?: number | null;
  repsOrTimeOverride?: string | null;
}

export async function addExerciseToBlock(
  userId: string,
  blockId: string,
  exerciseId: string,
  overrides: BlockExerciseOverrides = {}
): Promise<BlockExercise> {
  const existing = await listBlockExercises(blockId);
  const { data, error } = await supabase
    .from('program_block_exercises')
    .insert({
      user_id: userId,
      block_id: blockId,
      exercise_id: exerciseId,
      position: nextPosition(existing),
      sets_override: overrides.setsOverride ?? null,
      work_seconds_override: overrides.workSecondsOverride ?? null,
      rest_seconds_override: overrides.restSecondsOverride ?? null,
      reps_or_time_override: overrides.repsOrTimeOverride ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToBlockExercise(data);
}

export async function updateBlockExercise(id: string, overrides: BlockExerciseOverrides): Promise<BlockExercise> {
  const patch: Record<string, unknown> = {};
  if (overrides.setsOverride !== undefined) patch.sets_override = overrides.setsOverride;
  if (overrides.workSecondsOverride !== undefined) patch.work_seconds_override = overrides.workSecondsOverride;
  if (overrides.restSecondsOverride !== undefined) patch.rest_seconds_override = overrides.restSecondsOverride;
  if (overrides.repsOrTimeOverride !== undefined) patch.reps_or_time_override = overrides.repsOrTimeOverride;

  const { data, error } = await supabase
    .from('program_block_exercises')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToBlockExercise(data);
}

export async function removeExerciseFromBlock(id: string): Promise<void> {
  const { error } = await supabase.from('program_block_exercises').delete().eq('id', id);
  if (error) throw error;
}

// See reorderBlocks -- same batched-upsert rationale.
export async function reorderBlockExercises(userId: string, blockId: string, orderedBlockExerciseIds: string[]): Promise<void> {
  const items = await listBlockExercises(blockId);
  const byId = new Map(items.map(i => [i.id, i]));

  const rows = orderedBlockExerciseIds.map((id, index) => {
    const item = byId.get(id);
    if (!item) throw new Error(`reorderBlockExercises: placement ${id} not found in block ${blockId}`);
    return {
      id: item.id,
      user_id: userId,
      block_id: item.blockId,
      exercise_id: item.exerciseId,
      position: index,
      sets_override: item.setsOverride,
      work_seconds_override: item.workSecondsOverride,
      rest_seconds_override: item.restSecondsOverride,
      reps_or_time_override: item.repsOrTimeOverride,
    };
  });

  const { error } = await supabase.from('program_block_exercises').upsert(rows);
  if (error) throw error;
}

// --- The core "run this program" fetch ----------------------------------------

// Three explicit queries (blocks -> block_exercises -> exercises), assembled in-memory
// via resolveExercise, rather than one clever embedded PostgREST query -- matches this
// codebase's preference (see supabaseSync.ts) for very explicit, easy-to-debug code.
export async function getResolvedProgram(programId: string): Promise<ResolvedProgram> {
  const program = await getProgram(programId);
  if (!program) throw new Error(`Program ${programId} not found.`);

  const blocks = await listBlocks(programId);
  if (blocks.length === 0) return { id: program.id, name: program.name, blocks: [] };

  const blockIds = blocks.map(b => b.id);
  const { data: placementRows, error: placementsError } = await supabase
    .from('program_block_exercises')
    .select('*')
    .in('block_id', blockIds)
    .order('position', { ascending: true });
  if (placementsError) throw placementsError;
  const placements = (placementRows ?? []).map(rowToBlockExercise);

  const exerciseIds = Array.from(new Set(placements.map(p => p.exerciseId)));
  let exercisesById = new Map<string, Exercise>();
  if (exerciseIds.length > 0) {
    const { data: exerciseRows, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .in('id', exerciseIds);
    if (exercisesError) throw exercisesError;
    exercisesById = new Map((exerciseRows ?? []).map((row: any) => [row.id, rowToExercise(row)]));
  }

  const placementsByBlock = new Map<string, BlockExercise[]>();
  placements.forEach(placement => {
    const list = placementsByBlock.get(placement.blockId) ?? [];
    list.push(placement);
    placementsByBlock.set(placement.blockId, list);
  });

  const resolvedBlocks = blocks.map(block => ({
    id: block.id,
    title: block.title,
    subtitle: block.subtitle,
    durationMinutes: block.durationMinutes,
    blockType: block.blockType,
    badgeColor: block.badgeColor,
    exercises: (placementsByBlock.get(block.id) ?? [])
      .map(placement => {
        const exercise = exercisesById.get(placement.exerciseId);
        return exercise ? resolveExercise(exercise, placement) : null;
      })
      .filter((resolved): resolved is NonNullable<typeof resolved> => resolved !== null),
  }));

  return { id: program.id, name: program.name, blocks: resolvedBlocks };
}

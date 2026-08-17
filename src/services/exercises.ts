import { supabase } from '../utils/supabase';
import type { Exercise, TargetMuscle } from '../types/workout';

interface ExerciseRow {
  id: string;
  user_id: string;
  name: string;
  work_seconds: number | null;
  rest_seconds: number | null;
  sets: number;
  reps_or_time: string;
  target_muscles: string[];
  equipment: string;
  description: string;
  form_cues: string[];
  safety_tip: string;
  video_urls: { title: string; url: string }[];
}

const rowToExercise = (row: ExerciseRow): Exercise => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  workSeconds: row.work_seconds,
  restSeconds: row.rest_seconds,
  sets: row.sets,
  repsOrTime: row.reps_or_time,
  targetMuscles: row.target_muscles as TargetMuscle[],
  equipment: row.equipment,
  description: row.description,
  formCues: row.form_cues,
  safetyTip: row.safety_tip,
  videoUrls: row.video_urls,
});

export type ExerciseInput = Omit<Exercise, 'id' | 'userId'>;

const inputToRow = (input: Partial<ExerciseInput>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.workSeconds !== undefined) row.work_seconds = input.workSeconds;
  if (input.restSeconds !== undefined) row.rest_seconds = input.restSeconds;
  if (input.sets !== undefined) row.sets = input.sets;
  if (input.repsOrTime !== undefined) row.reps_or_time = input.repsOrTime;
  if (input.targetMuscles !== undefined) row.target_muscles = input.targetMuscles;
  if (input.equipment !== undefined) row.equipment = input.equipment;
  if (input.description !== undefined) row.description = input.description;
  if (input.formCues !== undefined) row.form_cues = input.formCues;
  if (input.safetyTip !== undefined) row.safety_tip = input.safetyTip;
  if (input.videoUrls !== undefined) row.video_urls = input.videoUrls;
  return row;
};

export async function listExercises(userId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToExercise);
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToExercise(data) : null;
}

export async function createExercise(userId: string, input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ user_id: userId, ...inputToRow(input) })
    .select('*')
    .single();

  if (error) throw error;
  return rowToExercise(data);
}

export async function updateExercise(id: string, input: Partial<ExerciseInput>): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update(inputToRow(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return rowToExercise(data);
}

export interface ExerciseUsage {
  blockCount: number;
  programCount: number;
}

// Used to block/warn before deleting a library exercise that's still placed in a block --
// the DB's ON DELETE RESTRICT on program_block_exercises.exercise_id is the hard backstop,
// this is what lets the UI explain *why* before the request round-trips and fails.
export async function checkExerciseUsage(id: string): Promise<ExerciseUsage> {
  const { data: placements, error: placementsError } = await supabase
    .from('program_block_exercises')
    .select('block_id')
    .eq('exercise_id', id);

  if (placementsError) throw placementsError;

  const blockIds = Array.from(new Set((placements ?? []).map((p: { block_id: string }) => p.block_id)));
  if (blockIds.length === 0) return { blockCount: 0, programCount: 0 };

  const { data: blocks, error: blocksError } = await supabase
    .from('program_blocks')
    .select('program_id')
    .in('id', blockIds);

  if (blocksError) throw blocksError;

  const programCount = new Set((blocks ?? []).map((b: { program_id: string }) => b.program_id)).size;
  return { blockCount: blockIds.length, programCount };
}

export async function deleteExercise(id: string): Promise<void> {
  const usage = await checkExerciseUsage(id);
  if (usage.blockCount > 0) {
    throw new Error(
      `Used in ${usage.blockCount} block${usage.blockCount === 1 ? '' : 's'} across ${usage.programCount} program${usage.programCount === 1 ? '' : 's'} — remove it from those first.`
    );
  }

  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}

import type { TargetMuscle } from './workout';

export type BlockType = 'warmup' | 'strength' | 'mobility' | 'cardio' | 'cooldown';

export interface Program {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramBlock {
  id: string;
  programId: string;
  title: string;
  subtitle: string;
  blockType: BlockType;
  badgeColor: string;
  durationMinutes: number;
  position: number;
}

// The join row as stored -- overrides are nullable, null = fall back to the library
// exercise's own default for that field.
export interface BlockExercise {
  id: string;
  blockId: string;
  exerciseId: string;
  position: number;
  setsOverride: number | null;
  workSecondsOverride: number | null;
  restSecondsOverride: number | null;
  repsOrTimeOverride: string | null;
}

// Runtime shape after merging a library Exercise's defaults with its BlockExercise
// overrides -- this is what LivePlayer/RoutineOverview actually consume. Deliberately
// field-compatible with the old flattened Exercise shape so that existing render code
// needs minimal changes.
export interface ResolvedExercise {
  id: string;              // == Exercise.id (stable across placements/programs)
  blockExerciseId: string; // == BlockExercise.id (needed to edit/remove this placement)
  name: string;
  workSeconds: number | null;
  restSeconds: number | null;
  sets: number;
  repsOrTime: string;
  targetMuscles: TargetMuscle[];
  equipment: string;
  description: string;
  formCues: string[];
  safetyTip: string;
  videoUrls?: { title: string; url: string }[];
}

export interface ResolvedBlock {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  blockType: BlockType;
  badgeColor: string;
  exercises: ResolvedExercise[];
}

export interface ResolvedProgram {
  id: string;
  name: string;
  blocks: ResolvedBlock[];
}

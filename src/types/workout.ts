export type TargetMuscle = 
  | 'lats' 
  | 'biceps' 
  | 'scapula' 
  | 'hamstrings' 
  | 'glutes' 
  | 'lower_back' 
  | 'wrist_flexors' 
  | 'wrist_extensors' 
  | 'grip';

// Exercise is the user-owned exercise library entity (backed by the Supabase `exercises`
// table, see src/services/exercises.ts). It has no block-type/category of its own — that's
// a property of the *block* an exercise is placed into (see BlockType in
// src/types/program.ts, which also defines ResolvedBlock/ResolvedExercise — the runtime
// shapes actually consumed by the live player and routine overview).
export interface Exercise {
  id: string;
  userId: string;
  name: string;
  workSeconds: number | null; // Timed hold/work duration; null = no work timer
  restSeconds: number | null; // Rest-between-sets duration; null = no rest timer
  sets: number;
  repsOrTime: string;
  targetMuscles: TargetMuscle[];
  equipment: string;
  description: string;
  formCues: string[];
  safetyTip: string;
  videoUrls?: { title: string; url: string; }[];
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weightLbs: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
}

export interface CompletedWorkout {
  id: string;
  date: string; // ISO string
  durationMinutes: number;
  totalSetsCompleted: number;
  rpe: number; // 1-10 rate of perceived exertion
  notes: string;
  exerciseLogs: ExerciseLog[];
  // Snapshot of the active program's name at completion time (not a live FK -- a
  // renamed/deleted program shouldn't rewrite history). Optional since workouts
  // completed before this field existed won't have it.
  programName?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeightLbs: number;
  maxReps: number;
  date: string;
}

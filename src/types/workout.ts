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

export type Category = 'warmup' | 'pullups' | 'hamstrings' | 'wrists' | 'cooldown';

// Exercise is the user-owned exercise library entity (backed by the Supabase `exercises`
// table, see src/services/exercises.ts). It has no block-type/category of its own — that's
// a property of the *block* an exercise is placed into (see WorkoutBlock.category below,
// and BlockType in src/types/program.ts for the new configurable-program model).
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

export interface WorkoutBlock {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  category: Category;
  badgeColor: string;
  exercises: Exercise[];
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
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeightLbs: number;
  maxReps: number;
  date: string;
}

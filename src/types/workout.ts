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

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  durationSeconds: number; // For timed holds or estimated set time
  restSeconds: number;
  sets: number;
  repsOrTime: string;
  targetMuscles: TargetMuscle[];
  equipment: string;
  description: string;
  formCues: string[];
  safetyTip: string;
  videoUrls?: { title: string; url: string; }[];
  isCustom?: boolean;
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

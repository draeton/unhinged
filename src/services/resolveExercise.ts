import type { Exercise } from '../types/workout';
import type { BlockExercise, ResolvedExercise } from '../types/program';

// Merges a library Exercise's defaults with its BlockExercise placement overrides.
export function resolveExercise(exercise: Exercise, override: BlockExercise): ResolvedExercise {
  return {
    id: exercise.id,
    blockExerciseId: override.id,
    name: exercise.name,
    // `??`, not `||` -- an explicit override of 0 (e.g. zero rest seconds) must be
    // respected, not treated as "unset".
    workSeconds: override.workSecondsOverride ?? exercise.workSeconds,
    restSeconds: override.restSecondsOverride ?? exercise.restSeconds,
    sets: override.setsOverride ?? exercise.sets,
    repsOrTime: override.repsOrTimeOverride ?? exercise.repsOrTime,
    targetMuscles: exercise.targetMuscles,
    equipment: exercise.equipment,
    description: exercise.description,
    formCues: exercise.formCues,
    safetyTip: exercise.safetyTip,
    videoUrls: exercise.videoUrls,
  };
}

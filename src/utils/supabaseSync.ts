import { supabase } from './supabase';
import type { CompletedWorkout } from '../types/workout';
import { getCompletedWorkouts } from './storage';

/**
 * Uploads a single completed workout to Supabase if the user is authenticated.
 */
export const syncWorkoutToSupabase = async (workout: CompletedWorkout) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return; // Not logged in

    const { error } = await supabase
      .from('completed_workouts')
      .upsert({
        id: workout.id,
        user_id: session.session.user.id,
        date: workout.date,
        duration_minutes: workout.durationMinutes,
        total_sets_completed: workout.totalSetsCompleted,
        rpe: workout.rpe,
        notes: workout.notes,
        exercise_logs: workout.exerciseLogs,
        program_name: workout.programName ?? null,
      });

    if (error) {
      console.error('Error syncing workout to Supabase:', error);
    }
  } catch (err) {
    console.error('Failed to sync workout to Supabase:', err);
  }
};

/**
 * Downloads all completed workouts for the authenticated user and merges them 
 * with the local storage workouts, ensuring no duplicates.
 */
export const syncWorkoutsFromSupabase = async (): Promise<CompletedWorkout[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return getCompletedWorkouts(); // Return local if not logged in

    const { data, error } = await supabase
      .from('completed_workouts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts from Supabase:', error);
      return getCompletedWorkouts();
    }

    // Convert snake_case db rows back to camelCase frontend models
    const supabaseWorkouts: CompletedWorkout[] = data.map((row: any) => ({
      id: row.id,
      date: row.date,
      durationMinutes: row.duration_minutes,
      totalSetsCompleted: row.total_sets_completed,
      rpe: row.rpe,
      notes: row.notes,
      exerciseLogs: row.exercise_logs,
      programName: row.program_name ?? undefined,
    }));

    // Merge with local workouts (prioritizing Supabase data for duplicates)
    const localWorkouts = getCompletedWorkouts();
    const mergedMap = new Map<string, CompletedWorkout>();

    // Add local first
    localWorkouts.forEach(w => mergedMap.set(w.id, w));
    
    // Override/Add Supabase
    supabaseWorkouts.forEach(w => mergedMap.set(w.id, w));

    // Sort by date descending
    const mergedList = Array.from(mergedMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Update local storage with the complete merged list
    localStorage.setItem('unhinged_completed_workouts', JSON.stringify(mergedList));

    return mergedList;

  } catch (err) {
    console.error('Failed to download workouts from Supabase:', err);
    return getCompletedWorkouts();
  }
};

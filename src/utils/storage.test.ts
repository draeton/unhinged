import { describe, it, expect, beforeEach } from 'vitest';
import { getCompletedWorkouts, saveCompletedWorkout, clearActiveWorkoutState } from './storage';
import type { CompletedWorkout } from '../types/workout';

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty array if no workouts are saved', () => {
    const workouts = getCompletedWorkouts();
    expect(workouts).toEqual([]);
  });

  it('should save and retrieve completed workouts', () => {
    const workout: CompletedWorkout = {
      id: 'test-1',
      date: '2026-08-10',
      durationMinutes: 45,
      totalSetsCompleted: 10,
      rpe: 8,
      notes: 'Good workout',
      exerciseLogs: [],
    };

    saveCompletedWorkout(workout);
    
    const retrieved = getCompletedWorkouts();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0]).toEqual(workout);
  });

  it('should clear active workout state from localStorage', () => {
    localStorage.setItem('unhinged_isWorkoutStarted', 'true');
    localStorage.setItem('unhinged_totalSecondsElapsed', '100');
    localStorage.setItem('unhinged_currentIndex', '2');
    localStorage.setItem('unhinged_completedSets', '{"test": 1}');
    
    clearActiveWorkoutState();
    
    expect(localStorage.getItem('unhinged_isWorkoutStarted')).toBeNull();
    expect(localStorage.getItem('unhinged_totalSecondsElapsed')).toBeNull();
    expect(localStorage.getItem('unhinged_currentIndex')).toBeNull();
    expect(localStorage.getItem('unhinged_completedSets')).toBeNull();
  });
});

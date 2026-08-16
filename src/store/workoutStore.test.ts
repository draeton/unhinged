import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from './workoutStore';

describe('workoutStore timers', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetStore();
  });

  it('starts a timer at the configured duration', () => {
    useWorkoutStore.getState().startTimer('m1:work', 90);
    const timer = useWorkoutStore.getState().timers['m1:work'];
    expect(timer).toEqual({ remainingSeconds: 90, totalSeconds: 90, isStarted: true, isPaused: false });
  });

  it('ticks a timer down by one second, floored at zero', () => {
    useWorkoutStore.getState().startTimer('m1:work', 1);
    useWorkoutStore.getState().tickTimer('m1:work');
    useWorkoutStore.getState().tickTimer('m1:work');
    expect(useWorkoutStore.getState().timers['m1:work'].remainingSeconds).toBe(0);
  });

  it('pauses and resumes a timer', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    useWorkoutStore.getState().pauseTimer('m1:rest');
    expect(useWorkoutStore.getState().timers['m1:rest'].isPaused).toBe(true);
    useWorkoutStore.getState().resumeTimer('m1:rest');
    expect(useWorkoutStore.getState().timers['m1:rest'].isPaused).toBe(false);
  });

  it('resets a timer back to its total duration and stops it', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    useWorkoutStore.getState().tickTimer('m1:rest');
    useWorkoutStore.getState().resetTimer('m1:rest');
    const timer = useWorkoutStore.getState().timers['m1:rest'];
    expect(timer.remainingSeconds).toBe(60);
    expect(timer.isStarted).toBe(false);
  });

  it('expires a timer, stopping it at zero', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    useWorkoutStore.getState().expireTimer('m1:rest');
    const timer = useWorkoutStore.getState().timers['m1:rest'];
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.isStarted).toBe(false);
  });

  it('adjusts a running timer by +/-15s, never below 5s', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 10);
    useWorkoutStore.getState().adjustTimer('m1:rest', -15);
    expect(useWorkoutStore.getState().timers['m1:rest'].remainingSeconds).toBe(5);

    useWorkoutStore.getState().adjustTimer('m1:rest', 15);
    expect(useWorkoutStore.getState().timers['m1:rest'].remainingSeconds).toBe(20);
  });

  it('clears all timers on resetStore', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    useWorkoutStore.getState().resetStore();
    expect(useWorkoutStore.getState().timers).toEqual({});
  });
});

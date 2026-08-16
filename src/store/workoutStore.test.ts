import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  it('clears all timers on resetStore', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    useWorkoutStore.getState().resetStore();
    expect(useWorkoutStore.getState().timers).toEqual({});
  });

  it('starting the rest timer resets a started work timer for the same exercise', () => {
    useWorkoutStore.getState().startTimer('m1:work', 90);
    useWorkoutStore.getState().tickTimer('m1:work');
    useWorkoutStore.getState().tickTimer('m1:work');

    useWorkoutStore.getState().startTimer('m1:rest', 60);

    const work = useWorkoutStore.getState().timers['m1:work'];
    expect(work).toEqual({ remainingSeconds: 90, totalSeconds: 90, isStarted: false, isPaused: false });
    expect(useWorkoutStore.getState().timers['m1:rest']).toEqual({
      remainingSeconds: 60, totalSeconds: 60, isStarted: true, isPaused: false,
    });
  });

  it('starting the work timer resets a started (even paused) rest timer for the same exercise', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    useWorkoutStore.getState().tickTimer('m1:rest');
    useWorkoutStore.getState().pauseTimer('m1:rest');

    useWorkoutStore.getState().startTimer('m1:work', 90);

    const rest = useWorkoutStore.getState().timers['m1:rest'];
    expect(rest).toEqual({ remainingSeconds: 60, totalSeconds: 60, isStarted: false, isPaused: false });
  });

  it('does not touch a sibling timer that was never started', () => {
    useWorkoutStore.getState().startTimer('m1:work', 90);
    expect(useWorkoutStore.getState().timers['m1:rest']).toBeUndefined();
  });

  it('does not reset timers belonging to a different exercise', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    useWorkoutStore.getState().startTimer('m2:work', 120);

    expect(useWorkoutStore.getState().timers['m1:rest'].isStarted).toBe(true);
  });
});

describe('workoutStore global elapsed time', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    useWorkoutStore.getState().resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reflects real elapsed time on refresh, even without any ticks in between (throttled/backgrounded)', () => {
    useWorkoutStore.getState().startWorkout();

    // Simulate the tab being backgrounded for 45s with zero intervening refreshes.
    vi.setSystemTime(new Date('2026-01-01T00:00:45.000Z'));
    useWorkoutStore.getState().refreshElapsedTime();

    expect(useWorkoutStore.getState().totalSecondsElapsed).toBe(45);
  });

  it('does not advance while paused, and resumes counting from the correct base', () => {
    useWorkoutStore.getState().startWorkout();

    vi.setSystemTime(new Date('2026-01-01T00:00:10.000Z'));
    useWorkoutStore.getState().pauseWorkout();
    expect(useWorkoutStore.getState().totalSecondsElapsed).toBe(10);

    // Time passes while paused — should not count.
    vi.setSystemTime(new Date('2026-01-01T00:05:10.000Z'));
    useWorkoutStore.getState().refreshElapsedTime();
    expect(useWorkoutStore.getState().totalSecondsElapsed).toBe(10);

    // Resume, then more time passes.
    useWorkoutStore.getState().resumeWorkout();
    vi.setSystemTime(new Date('2026-01-01T00:05:25.000Z'));
    useWorkoutStore.getState().refreshElapsedTime();

    // 10s before the pause + 15s after resuming.
    expect(useWorkoutStore.getState().totalSecondsElapsed).toBe(25);
  });

  it('is a no-op when the workout has not started', () => {
    useWorkoutStore.getState().refreshElapsedTime();
    expect(useWorkoutStore.getState().totalSecondsElapsed).toBe(0);
  });

  it('is a no-op while paused', () => {
    useWorkoutStore.getState().startWorkout();
    useWorkoutStore.getState().pauseWorkout();

    vi.setSystemTime(new Date('2026-01-01T01:00:00.000Z'));
    useWorkoutStore.getState().refreshElapsedTime();

    expect(useWorkoutStore.getState().totalSecondsElapsed).toBe(0);
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTimerTicker } from './useTimerTicker';
import { useWorkoutStore } from '../store/workoutStore';

describe('useTimerTicker', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks a running timer down by one second per second', () => {
    useWorkoutStore.getState().startTimer('m1:work', 10);
    renderHook(() => useTimerTicker(() => {}));

    act(() => { vi.advanceTimersByTime(1000); });
    expect(useWorkoutStore.getState().timers['m1:work'].remainingSeconds).toBe(9);

    act(() => { vi.advanceTimersByTime(3000); });
    expect(useWorkoutStore.getState().timers['m1:work'].remainingSeconds).toBe(6);
  });

  it('does not tick a paused timer', () => {
    useWorkoutStore.getState().startTimer('m1:work', 10);
    useWorkoutStore.getState().pauseTimer('m1:work');
    renderHook(() => useTimerTicker(() => {}));

    act(() => { vi.advanceTimersByTime(3000); });
    expect(useWorkoutStore.getState().timers['m1:work'].remainingSeconds).toBe(10);
  });

  it('expires the timer and fires onExpire exactly once, without restarting it', () => {
    useWorkoutStore.getState().startTimer('m1:work', 2);
    const onExpire = vi.fn();
    renderHook(() => useTimerTicker(onExpire));

    act(() => { vi.advanceTimersByTime(2000); });

    const timer = useWorkoutStore.getState().timers['m1:work'];
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.isStarted).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledWith('m1:work');

    act(() => { vi.advanceTimersByTime(3000); });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('stops ticking once unmounted', () => {
    useWorkoutStore.getState().startTimer('m1:work', 10);
    const { unmount } = renderHook(() => useTimerTicker(() => {}));

    act(() => { vi.advanceTimersByTime(1000); });
    unmount();
    act(() => { vi.advanceTimersByTime(5000); });

    expect(useWorkoutStore.getState().timers['m1:work'].remainingSeconds).toBe(9);
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimerDrawer } from './TimerDrawer';
import { useWorkoutStore } from '../store/workoutStore';

describe('TimerDrawer', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetStore();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    exerciseId: 'm1',
    exerciseName: 'Pike Pulses / Active Compression',
    type: 'work' as const,
    configuredSeconds: 90,
  };

  it('shows the configured duration before the timer is started', () => {
    render(<TimerDrawer {...defaultProps} />);
    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Timer' })).toBeInTheDocument();
  });

  it('starts the timer on first tap', () => {
    render(<TimerDrawer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Timer' }));

    const timer = useWorkoutStore.getState().timers['m1:work'];
    expect(timer).toEqual({ remainingSeconds: 90, totalSeconds: 90, isStarted: true, isPaused: false });
    expect(screen.getByRole('button', { name: 'Pause Timer' })).toBeInTheDocument();
  });

  it('pauses and resumes the running timer', () => {
    useWorkoutStore.getState().startTimer('m1:work', 90);
    render(<TimerDrawer {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pause Timer' }));
    expect(useWorkoutStore.getState().timers['m1:work'].isPaused).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Resume Timer' }));
    expect(useWorkoutStore.getState().timers['m1:work'].isPaused).toBe(false);
  });

  it('resets a started timer back to its configured duration and stops it', () => {
    useWorkoutStore.getState().startTimer('m1:work', 90);
    useWorkoutStore.getState().tickTimer('m1:work');
    render(<TimerDrawer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Reset Timer'));
    const timer = useWorkoutStore.getState().timers['m1:work'];
    expect(timer.remainingSeconds).toBe(90);
    expect(timer.isStarted).toBe(false);
  });

  it('disables Reset before the timer has been started', () => {
    render(<TimerDrawer {...defaultProps} />);
    expect(screen.getByTitle('Reset Timer')).toBeDisabled();
  });
});

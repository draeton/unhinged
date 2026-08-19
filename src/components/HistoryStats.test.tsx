import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HistoryStats } from './HistoryStats';
import type { CompletedWorkout } from '../types/workout';

const baseWorkout: CompletedWorkout = {
  id: 'w1',
  date: '2026-01-01T12:00:00.000Z',
  durationMinutes: 45,
  totalSetsCompleted: 10,
  rpe: 7,
  notes: '',
  exerciseLogs: [],
};

describe('HistoryStats session titles', () => {
  it('includes the program name in the session title when set', () => {
    render(<HistoryStats workouts={[{ ...baseWorkout, programName: 'My Custom Program' }]} />);
    expect(screen.getByText('My Custom Program — Session #1')).toBeInTheDocument();
  });

  it('falls back to a generic title for workouts logged before programName existed', () => {
    render(<HistoryStats workouts={[baseWorkout]} />);
    expect(screen.getByText('Workout — Session #1')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DayDetailDrawer } from './DayDetailDrawer';
import type { CompletedWorkout } from '../types/workout';

const workoutOn = (dateStr: string, overrides: Partial<CompletedWorkout> = {}): CompletedWorkout => ({
  id: overrides.id ?? 'w1',
  date: `${dateStr}T12:00:00.000Z`,
  durationMinutes: 45,
  totalSetsCompleted: 10,
  rpe: 7,
  notes: '',
  exerciseLogs: [],
  ...overrides,
});

describe('DayDetailDrawer workout titles', () => {
  it('shows the program name for a single workout that day, without a number suffix', () => {
    render(
      <DayDetailDrawer
        dateStr="2026-01-01"
        completedWorkouts={[workoutOn('2026-01-01', { programName: 'My Custom Program' })]}
      />
    );
    expect(screen.getByText('My Custom Program')).toBeInTheDocument();
  });

  it('falls back to a generic label for a workout with no stored program name', () => {
    render(<DayDetailDrawer dateStr="2026-01-01" completedWorkouts={[workoutOn('2026-01-01')]} />);
    expect(screen.getByText('Workout')).toBeInTheDocument();
  });

  it('numbers entries when more than one workout was logged the same day', () => {
    render(
      <DayDetailDrawer
        dateStr="2026-01-01"
        completedWorkouts={[
          workoutOn('2026-01-01', { id: 'w1', programName: 'Program A' }),
          workoutOn('2026-01-01', { id: 'w2', programName: 'Program B' }),
        ]}
      />
    );
    expect(screen.getByText('Program A #1')).toBeInTheDocument();
    expect(screen.getByText('Program B #2')).toBeInTheDocument();
  });
});

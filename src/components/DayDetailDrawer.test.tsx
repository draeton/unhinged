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

describe('DayDetailDrawer set-completion diagram', () => {
  it('renders the diagram when a workout has exercise logs', () => {
    render(
      <DayDetailDrawer
        dateStr="2026-01-01"
        completedWorkouts={[
          workoutOn('2026-01-01', {
            exerciseLogs: [
              { exerciseId: 'ex-1', exerciseName: 'Pull-Ups', sets: [{ setNumber: 1, reps: 0, weightLbs: 0, completed: false }] },
            ],
          }),
        ]}
      />
    );
    expect(screen.getByLabelText('Pull-Ups: not completed')).toBeInTheDocument();
  });

  it('omits the diagram for older workouts with no exercise logs', () => {
    render(<DayDetailDrawer dateStr="2026-01-01" completedWorkouts={[workoutOn('2026-01-01')]} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { DayDetailDrawer } from './DayDetailDrawer';
import type { CompletedWorkout } from '../types/workout';

// jsdom doesn't implement pointer capture -- stub it so SwipeToDelete's drag handling doesn't throw.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: vi.fn(), writable: true });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { value: vi.fn(), writable: true });
});

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
        onDeleteWorkout={vi.fn()}
      />
    );
    expect(screen.getByText('My Custom Program')).toBeInTheDocument();
  });

  it('falls back to a generic label for a workout with no stored program name', () => {
    render(<DayDetailDrawer dateStr="2026-01-01" completedWorkouts={[workoutOn('2026-01-01')]} onDeleteWorkout={vi.fn()} />);
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
        onDeleteWorkout={vi.fn()}
      />
    );
    expect(screen.getByText('Program A #1')).toBeInTheDocument();
    expect(screen.getByText('Program B #2')).toBeInTheDocument();
  });
});

describe('DayDetailDrawer stats row', () => {
  it('renders RPE in the same row as duration and sets', () => {
    render(<DayDetailDrawer dateStr="2026-01-01" completedWorkouts={[workoutOn('2026-01-01', { rpe: 8 })]} onDeleteWorkout={vi.fn()} />);

    const minsRow = screen.getByText('45 mins').closest('div')!.parentElement!;
    expect(within(minsRow).getByText('8/10')).toBeInTheDocument();
  });

  it('omits RPE entirely when not set', () => {
    render(<DayDetailDrawer dateStr="2026-01-01" completedWorkouts={[workoutOn('2026-01-01', { rpe: 0 })]} onDeleteWorkout={vi.fn()} />);
    expect(screen.queryByText(/\/10/)).not.toBeInTheDocument();
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
        onDeleteWorkout={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Pull-Ups: not completed')).toBeInTheDocument();
  });

  it('omits the diagram for older workouts with no exercise logs', () => {
    render(<DayDetailDrawer dateStr="2026-01-01" completedWorkouts={[workoutOn('2026-01-01')]} onDeleteWorkout={vi.fn()} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('DayDetailDrawer delete', () => {
  it('calls onDeleteWorkout with the workout id when the revealed delete button is tapped', () => {
    const onDeleteWorkout = vi.fn();
    render(
      <DayDetailDrawer
        dateStr="2026-01-01"
        completedWorkouts={[workoutOn('2026-01-01', { programName: 'My Custom Program' })]}
        onDeleteWorkout={onDeleteWorkout}
      />
    );

    const title = screen.getByText('My Custom Program');
    fireEvent.pointerDown(title, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(title, { clientX: 140, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(title, { clientX: 140, clientY: 100, pointerId: 1 });

    fireEvent.click(screen.getByRole('button', { name: /Delete My Custom Program/ }));
    expect(onDeleteWorkout).toHaveBeenCalledWith('w1');
  });
});

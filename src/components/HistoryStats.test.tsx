import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { HistoryStats } from './HistoryStats';
import type { CompletedWorkout } from '../types/workout';

// jsdom doesn't implement pointer capture -- stub it so SwipeToDelete's drag handling doesn't throw.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: vi.fn(), writable: true });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { value: vi.fn(), writable: true });
});

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
    render(<HistoryStats workouts={[{ ...baseWorkout, programName: 'My Custom Program' }]} onDeleteWorkout={vi.fn()} />);
    expect(screen.getByText('My Custom Program — Session #1')).toBeInTheDocument();
  });

  it('falls back to a generic title for workouts logged before programName existed', () => {
    render(<HistoryStats workouts={[baseWorkout]} onDeleteWorkout={vi.fn()} />);
    expect(screen.getByText('Workout — Session #1')).toBeInTheDocument();
  });
});

describe('HistoryStats set-completion diagram', () => {
  it('renders the diagram when a workout has exercise logs', () => {
    render(
      <HistoryStats
        workouts={[
          {
            ...baseWorkout,
            exerciseLogs: [
              { exerciseId: 'ex-1', exerciseName: 'Pull-Ups', sets: [{ setNumber: 1, reps: 0, weightLbs: 0, completed: true }] },
            ],
          },
        ]}
        onDeleteWorkout={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Pull-Ups: completed')).toBeInTheDocument();
  });

  it('omits the diagram for older workouts with no exercise logs', () => {
    render(<HistoryStats workouts={[baseWorkout]} onDeleteWorkout={vi.fn()} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('HistoryStats delete', () => {
  it('calls onDeleteWorkout with the workout id when the revealed delete button is tapped', () => {
    const onDeleteWorkout = vi.fn();
    render(<HistoryStats workouts={[{ ...baseWorkout, programName: 'My Custom Program' }]} onDeleteWorkout={onDeleteWorkout} />);

    const title = screen.getByText('My Custom Program — Session #1');
    fireEvent.pointerDown(title, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(title, { clientX: 140, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(title, { clientX: 140, clientY: 100, pointerId: 1 });

    fireEvent.click(screen.getByRole('button', { name: /Delete My Custom Program/ }));
    expect(onDeleteWorkout).toHaveBeenCalledWith('w1');
  });
});

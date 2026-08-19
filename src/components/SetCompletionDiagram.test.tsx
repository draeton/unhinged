import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SetCompletionDiagram } from './SetCompletionDiagram';
import type { ExerciseLog } from '../types/workout';

const logFor = (exerciseName: string, completedFlags: boolean[]): ExerciseLog => ({
  exerciseId: exerciseName,
  exerciseName,
  sets: completedFlags.map((completed, i) => ({
    setNumber: i + 1,
    reps: 0,
    weightLbs: 0,
    completed,
  })),
});

describe('SetCompletionDiagram', () => {
  it('renders nothing when there are no exercise logs', () => {
    const { container } = render(<SetCompletionDiagram exerciseLogs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one dot per set, marked completed or not completed', () => {
    render(<SetCompletionDiagram exerciseLogs={[logFor('Pull-Ups', [true, true, false])]} />);

    expect(screen.getByLabelText('Pull-Ups set 1 completed')).toBeInTheDocument();
    expect(screen.getByLabelText('Pull-Ups set 2 completed')).toBeInTheDocument();
    expect(screen.getByLabelText('Pull-Ups set 3 not completed')).toBeInTheDocument();
  });

  it('renders every exercise as its own row', () => {
    render(
      <SetCompletionDiagram
        exerciseLogs={[logFor('Pull-Ups', [true]), logFor('Push-Ups', [false, false])]}
      />
    );

    expect(screen.getByText('Pull-Ups')).toBeInTheDocument();
    expect(screen.getByText('Push-Ups')).toBeInTheDocument();
    expect(screen.getByLabelText('Push-Ups set 1 not completed')).toBeInTheDocument();
    expect(screen.getByLabelText('Push-Ups set 2 not completed')).toBeInTheDocument();
  });
});

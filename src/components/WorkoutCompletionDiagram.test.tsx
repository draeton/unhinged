import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkoutCompletionDiagram } from './WorkoutCompletionDiagram';
import type { ExerciseLog } from '../types/workout';

const exerciseLog = (name: string, completedFlags: boolean[]): ExerciseLog => ({
  exerciseId: name,
  exerciseName: name,
  sets: completedFlags.map((completed, i) => ({
    setNumber: i + 1,
    reps: 0,
    weightLbs: 0,
    completed,
  })),
});

describe('WorkoutCompletionDiagram', () => {
  it('renders nothing when there are no exercise logs', () => {
    const { container } = render(<WorkoutCompletionDiagram exerciseLogs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one dot per exercise, not per set', () => {
    render(
      <WorkoutCompletionDiagram
        exerciseLogs={[exerciseLog('Pull-Ups', [true, true, true, true, true]), exerciseLog('Push-Ups', [false])]}
      />
    );
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('marks an exercise complete only when every one of its sets is completed', () => {
    render(<WorkoutCompletionDiagram exerciseLogs={[exerciseLog('Pull-Ups', [true, true, false])]} />);
    expect(screen.getByLabelText('Pull-Ups: not completed')).toBeInTheDocument();
  });

  it('marks a fully-completed exercise as completed', () => {
    render(<WorkoutCompletionDiagram exerciseLogs={[exerciseLog('Pull-Ups', [true, true, true])]} />);
    expect(screen.getByLabelText('Pull-Ups: completed')).toBeInTheDocument();
  });

  it('treats an exercise with zero sets as not completed rather than crashing', () => {
    render(<WorkoutCompletionDiagram exerciseLogs={[exerciseLog('Pull-Ups', [])]} />);
    expect(screen.getByLabelText('Pull-Ups: not completed')).toBeInTheDocument();
  });

  it('renders no visible text labels', () => {
    render(<WorkoutCompletionDiagram exerciseLogs={[exerciseLog('Pull-Ups', [true])]} />);
    expect(screen.queryByText('Pull-Ups')).not.toBeInTheDocument();
  });
});

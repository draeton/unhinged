import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StartScreen } from './StartScreen';
import type { Program } from '../types/program';

const programA: Program = {
  id: 'prog-a',
  userId: 'user-1',
  name: 'Program A',
  description: '',
  createdAt: '',
  updatedAt: '',
};

const programB: Program = {
  id: 'prog-b',
  userId: 'user-1',
  name: 'Program B',
  description: '',
  createdAt: '',
  updatedAt: '',
};

describe('StartScreen Component', () => {
  const defaultProps = {
    programs: [programA],
    activeProgramId: null,
    onSelectProgram: vi.fn(),
    onResumeActiveWorkout: vi.fn(),
    onOpenPrograms: vi.fn(),
    onOpenExerciseLibrary: vi.fn(),
    onOpenCalendar: vi.fn(),
    isWorkoutActive: false,
    isWorkoutPaused: false,
    totalSecondsElapsed: 0,
    completedWorkouts: [],
  };

  it('renders a card for each program', () => {
    render(<StartScreen {...defaultProps} programs={[programA, programB]} />);
    expect(screen.getByText('Program A')).toBeInTheDocument();
    expect(screen.getByText('Program B')).toBeInTheDocument();
  });

  it('shows an empty state when the user has no programs', () => {
    render(<StartScreen {...defaultProps} programs={[]} />);
    expect(screen.getByText('No programs yet')).toBeInTheDocument();
  });

  it('calls onSelectProgram with the clicked program id when no workout is active', () => {
    const onSelectProgram = vi.fn();
    render(<StartScreen {...defaultProps} onSelectProgram={onSelectProgram} />);

    fireEvent.click(screen.getByText('Program A'));
    expect(onSelectProgram).toHaveBeenCalledWith('prog-a');
  });

  it('marks the running program as active and calls onResumeActiveWorkout when it is clicked', () => {
    const onResumeActiveWorkout = vi.fn();
    render(
      <StartScreen
        {...defaultProps}
        programs={[programA, programB]}
        activeProgramId="prog-a"
        isWorkoutActive={true}
        isWorkoutPaused={true}
        onResumeActiveWorkout={onResumeActiveWorkout}
      />
    );

    // Cards carry no status text (icon/name/chevron only) -- the active one is
    // distinguished by its highlighted border/background instead.
    const programACard = screen.getByText('Program A').closest('.glass-panel') as HTMLElement;
    expect(programACard).toHaveStyle({ border: '2px solid #00F0FF' });
    fireEvent.click(programACard);
    expect(onResumeActiveWorkout).toHaveBeenCalled();
  });

  it('disables the non-active program while a workout is in progress', () => {
    const onSelectProgram = vi.fn();
    render(
      <StartScreen
        {...defaultProps}
        programs={[programA, programB]}
        activeProgramId="prog-a"
        isWorkoutActive={true}
        onSelectProgram={onSelectProgram}
      />
    );

    const programBCard = screen.getByText('Program B').closest('.glass-panel') as HTMLElement;
    fireEvent.click(programBCard);
    expect(onSelectProgram).not.toHaveBeenCalled();
    expect(programBCard).toHaveStyle({ cursor: 'not-allowed' });
  });

  it('shows a floating resume button while a workout is active', () => {
    const onResumeActiveWorkout = vi.fn();
    render(
      <StartScreen
        {...defaultProps}
        isWorkoutActive={true}
        totalSecondsElapsed={65}
        onResumeActiveWorkout={onResumeActiveWorkout}
      />
    );

    const fab = screen.getByText(/In Progress · 1:05/i);
    fireEvent.click(fab);
    expect(onResumeActiveWorkout).toHaveBeenCalled();
  });

  it('does not show the floating resume button when no workout is active', () => {
    render(<StartScreen {...defaultProps} isWorkoutActive={false} />);
    expect(screen.queryByText(/In Progress ·/i)).not.toBeInTheDocument();
  });

  it('opens program management when the Programs row is clicked', () => {
    const onOpenPrograms = vi.fn();
    render(<StartScreen {...defaultProps} onOpenPrograms={onOpenPrograms} />);

    fireEvent.click(screen.getByText('Programs'));
    expect(onOpenPrograms).toHaveBeenCalled();
  });

  it('opens the exercise library when the Exercise Library row is clicked', () => {
    const onOpenExerciseLibrary = vi.fn();
    render(<StartScreen {...defaultProps} onOpenExerciseLibrary={onOpenExerciseLibrary} />);

    fireEvent.click(screen.getByText('Exercise Library'));
    expect(onOpenExerciseLibrary).toHaveBeenCalled();
  });
});

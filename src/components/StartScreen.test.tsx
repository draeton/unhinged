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
    onNavigate: vi.fn(),
    programs: [programA],
    activeProgramId: null,
    onSelectProgram: vi.fn(),
    onResumeActiveWorkout: vi.fn(),
    onOpenCalendar: vi.fn(),
    isWorkoutActive: false,
    isWorkoutPaused: false,
    totalSecondsElapsed: 0,
    completedWorkouts: [],
  };

  it('renders a start card for each program', () => {
    render(<StartScreen {...defaultProps} programs={[programA, programB]} />);
    expect(screen.getByText('Program A')).toBeInTheDocument();
    expect(screen.getByText('Program B')).toBeInTheDocument();
    expect(screen.getAllByText(/Start New Session/i)).toHaveLength(2);
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

    expect(screen.getByText(/Resume Active Session/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Program A'));
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

    fireEvent.click(screen.getByText('Program B'));
    expect(onSelectProgram).not.toHaveBeenCalled();
    expect(screen.getByText(/Unavailable/)).toBeInTheDocument();
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
});

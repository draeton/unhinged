import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StartScreen } from './StartScreen';

describe('StartScreen Component', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    onOpenPreWorkout: vi.fn(),
    onOpenCalendar: vi.fn(),
    isWorkoutActive: false,
    isWorkoutPaused: false,
    totalSecondsElapsed: 0,
    completedWorkouts: [],
  };

  it('renders start button when workout is not active', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByText(/Start New Session/i)).toBeInTheDocument();
  });

  it('renders resume button when workout is active', () => {
    render(<StartScreen {...defaultProps} isWorkoutActive={true} isWorkoutPaused={true} />);
    expect(screen.getByText(/Resume Active Session/i)).toBeInTheDocument();
  });

  it('calls onOpenPreWorkout when start is clicked', () => {
    const onOpenPreWorkout = vi.fn();
    render(<StartScreen onNavigate={vi.fn()} onOpenPreWorkout={onOpenPreWorkout} onOpenCalendar={vi.fn()} isWorkoutActive={false} isWorkoutPaused={false} totalSecondsElapsed={0} completedWorkouts={[]} />);

    fireEvent.click(screen.getByText(/Start New Session/i));
    expect(onOpenPreWorkout).toHaveBeenCalled();
  });

});

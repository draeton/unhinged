import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StartScreen } from './StartScreen';

describe('StartScreen Component', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    isWorkoutActive: false,
    isWorkoutPaused: false,
    totalSecondsElapsed: 0,
    completedWorkoutsCount: 5,
  };

  it('renders start button when workout is not active', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByText(/Start New Session/i)).toBeInTheDocument();
  });

  it('renders resume button when workout is active', () => {
    render(<StartScreen {...defaultProps} isWorkoutActive={true} isWorkoutPaused={true} />);
    expect(screen.getByText(/Resume Active Session/i)).toBeInTheDocument();
  });

  it('calls onNavigate with player when start is clicked', () => {
    const onNavigate = vi.fn();
    render(<StartScreen {...defaultProps} onNavigate={onNavigate} />);
    
    fireEvent.click(screen.getByText(/Start New Session/i));
    expect(onNavigate).toHaveBeenCalledWith('player');
  });

  it('renders completed workouts count', () => {
    render(<StartScreen {...defaultProps} completedWorkoutsCount={12} />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });
});

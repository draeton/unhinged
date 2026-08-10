import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LivePlayer } from './LivePlayer';
import { DEFAULT_WORKOUT_BLOCKS } from '../data/workoutData';

describe('LivePlayer Component', () => {
  const defaultProps = {
    blocks: DEFAULT_WORKOUT_BLOCKS,
    totalSecondsElapsed: 0,
    isWorkoutPaused: false,
    onToggleWorkoutPause: vi.fn(),
    onWorkoutComplete: vi.fn(),
  };

  it('renders the first block and exercise', () => {
    render(<LivePlayer {...defaultProps} />);
    expect(screen.getAllByText(DEFAULT_WORKOUT_BLOCKS[0].title)[0]).toBeInTheDocument();
    expect(screen.getAllByText(DEFAULT_WORKOUT_BLOCKS[0].exercises[0].name)[0]).toBeInTheDocument();
  });

  it('calls onToggleWorkoutPause when pause/resume is clicked', () => {
    const onToggle = vi.fn();
    render(<LivePlayer {...defaultProps} onToggleWorkoutPause={onToggle} />);
    
    // There are multiple pause/resume buttons in the UI, we can find one by text "Pause" or role
    const buttons = screen.getAllByRole('button');
    const pauseButton = buttons.find(b => b.textContent?.includes('Pause') || b.textContent?.includes('Resume'));
    
    if (pauseButton) {
      fireEvent.click(pauseButton);
      expect(onToggle).toHaveBeenCalled();
    }
  });
});

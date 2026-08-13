import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LivePlayer } from './LivePlayer';
import { useWorkoutStore } from '../store/workoutStore';
import { DEFAULT_WORKOUT_BLOCKS } from '../data/workoutData';

describe('LivePlayer Component', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetStore();
  });
  const defaultProps = {
    blocks: DEFAULT_WORKOUT_BLOCKS,
    totalSecondsElapsed: 0,
    isWorkoutPaused: false,
    onToggleWorkoutPause: vi.fn(),
    onWorkoutComplete: vi.fn(),
    onPlayVideo: vi.fn(),
  };

  it('renders the first block and exercise', () => {
    render(<LivePlayer {...defaultProps} />);
    expect(screen.getAllByText('Wrist Mobility Sequence')[0]).toBeInTheDocument();
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

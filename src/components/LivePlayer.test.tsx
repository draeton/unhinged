import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LivePlayer } from './LivePlayer';
import { useWorkoutStore } from '../store/workoutStore';
import { DEFAULT_WORKOUT_BLOCKS } from '../data/workoutData';

describe('LivePlayer Component', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetStore();
  });

  const defaultProps = {
    blocks: DEFAULT_WORKOUT_BLOCKS,
    onPlayVideo: vi.fn(),
  };

  const panelFor = (exerciseName: string) => {
    const heading = screen.getByRole('heading', { name: exerciseName });
    return heading.closest('.glass-panel') as HTMLElement;
  };

  it('renders the first block and exercise', () => {
    render(<LivePlayer {...defaultProps} />);
    expect(screen.getAllByText('Wrist Mobility Sequence')[0]).toBeInTheDocument();
  });

  it('only shows a Rest button for an exercise with no work timer (w1)', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Wrist Mobility Sequence');
    expect(within(panel).getByRole('button', { name: 'Rest' })).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: 'Work' })).not.toBeInTheDocument();
  });

  it('shows both Work and Rest buttons for an exercise with both timers (m1)', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Pike Pulses / Active Compression');
    expect(within(panel).getByRole('button', { name: 'Work' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Rest' })).toBeInTheDocument();
  });

  it('only shows a Work button for the cooldown exercise with no rest timer (c1)', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Child’s Pose with Wrist Relief');
    expect(within(panel).getByRole('button', { name: 'Work' })).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: 'Rest' })).not.toBeInTheDocument();
  });

  it('opens the rest timer drawer, showing the configured duration, when Rest is tapped', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Wrist Mobility Sequence');
    fireEvent.click(within(panel).getByRole('button', { name: 'Rest' }));

    expect(screen.getByText('Rest Timer')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('opens the work timer drawer when Work is tapped', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Pike Pulses / Active Compression');
    fireEvent.click(within(panel).getByRole('button', { name: 'Work' }));

    expect(screen.getByText('Work Timer')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('tapping a set marks progress without navigating the carousel', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Wrist Mobility Sequence');
    fireEvent.click(within(panel).getByRole('button', { name: '1' }));

    expect(useWorkoutStore.getState().completedSets['w1']).toBe(1);
    expect(useWorkoutStore.getState().currentIndex).toBe(0);
  });
});

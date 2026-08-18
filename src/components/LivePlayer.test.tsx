import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LivePlayer } from './LivePlayer';
import { useWorkoutStore } from '../store/workoutStore';
import { RESOLVED_TEST_BLOCKS } from '../test-utils/fixtures';

describe('LivePlayer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    useWorkoutStore.getState().resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    blocks: RESOLVED_TEST_BLOCKS,
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

  it('opens the rest timer drawer and starts the timer when Rest is tapped', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Wrist Mobility Sequence');
    fireEvent.click(within(panel).getByRole('button', { name: 'Rest' }));

    expect(screen.getByText('Rest Timer')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(useWorkoutStore.getState().timers['w1:rest']).toEqual({
      remainingSeconds: 60, totalSeconds: 60, isStarted: true, isPaused: false,
      startedAt: Date.now(), accumulatedMs: 0,
    });
  });

  it('opens the work timer drawer and starts the timer when Work is tapped', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Pike Pulses / Active Compression');
    fireEvent.click(within(panel).getByRole('button', { name: 'Work' }));

    expect(screen.getByText('Work Timer')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(useWorkoutStore.getState().timers['m1:work']).toEqual({
      remainingSeconds: 90, totalSeconds: 90, isStarted: true, isPaused: false,
      startedAt: Date.now(), accumulatedMs: 0,
    });
  });

  it('resumes a paused timer (without resetting elapsed time) when its card button is tapped again', () => {
    useWorkoutStore.getState().startTimer('w1:rest', 60);
    vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
    useWorkoutStore.getState().pauseTimer('w1:rest');

    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Wrist Mobility Sequence');
    fireEvent.click(within(panel).getByRole('button', { name: /Rest/ }));

    const timer = useWorkoutStore.getState().timers['w1:rest'];
    expect(timer.isPaused).toBe(false);
    expect(timer.remainingSeconds).toBe(59);
  });

  it('leaves an already-running timer untouched when its card button is tapped again', () => {
    useWorkoutStore.getState().startTimer('w1:rest', 60);
    const originalStartedAt = useWorkoutStore.getState().timers['w1:rest'].startedAt;
    vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));

    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Wrist Mobility Sequence');
    fireEvent.click(within(panel).getByRole('button', { name: /Rest/ }));

    const timer = useWorkoutStore.getState().timers['w1:rest'];
    expect(timer.isStarted).toBe(true);
    // Untouched, i.e. not re-started: still counting from its original start time.
    expect(timer.startedAt).toBe(originalStartedAt);
  });

  it('starting the work timer from its card button resets an already-started rest timer', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);
    vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));

    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Pike Pulses / Active Compression');
    fireEvent.click(within(panel).getByRole('button', { name: /Work/ }));

    expect(useWorkoutStore.getState().timers['m1:work'].isStarted).toBe(true);
    expect(useWorkoutStore.getState().timers['m1:rest']).toEqual({
      remainingSeconds: 60, totalSeconds: 60, isStarted: false, isPaused: false,
      startedAt: null, accumulatedMs: 0,
    });
  });

  it('stops an active rest timer for the exercise being left when navigating away', () => {
    useWorkoutStore.getState().startTimer('w1:rest', 60);
    vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));

    render(<LivePlayer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pike Pulses / Active Compression' }));

    expect(useWorkoutStore.getState().timers['w1:rest']).toEqual({
      remainingSeconds: 60, totalSeconds: 60, isStarted: false, isPaused: false,
      startedAt: null, accumulatedMs: 0,
    });
    expect(useWorkoutStore.getState().currentIndex).toBe(5);
  });

  it('stops a paused work timer for the exercise being left when navigating away', () => {
    useWorkoutStore.getState().setCurrentIndex(5); // m1
    useWorkoutStore.getState().startTimer('m1:work', 90);
    useWorkoutStore.getState().pauseTimer('m1:work');

    render(<LivePlayer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Wrist Mobility Sequence' }));

    expect(useWorkoutStore.getState().timers['m1:work']).toEqual({
      remainingSeconds: 90, totalSeconds: 90, isStarted: false, isPaused: false,
      startedAt: null, accumulatedMs: 0,
    });
  });

  it('does not touch other exercises\' timers when navigating', () => {
    useWorkoutStore.getState().startTimer('m1:rest', 60);

    render(<LivePlayer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pike Pulses / Active Compression' }));

    expect(useWorkoutStore.getState().timers['m1:rest'].isStarted).toBe(true);
  });

  it('leaves a running timer untouched when tapping the already-active exercise', () => {
    useWorkoutStore.getState().startTimer('w1:rest', 60);

    render(<LivePlayer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Wrist Mobility Sequence' }));

    expect(useWorkoutStore.getState().timers['w1:rest'].isStarted).toBe(true);
  });

  it('tapping a set marks progress without navigating the carousel', () => {
    render(<LivePlayer {...defaultProps} />);
    const panel = panelFor('Wrist Mobility Sequence');
    fireEvent.click(within(panel).getByRole('button', { name: '1' }));

    expect(useWorkoutStore.getState().completedSets['w1']).toBe(1);
    expect(useWorkoutStore.getState().currentIndex).toBe(0);
  });
});

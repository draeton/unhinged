import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from './App';
import { useWorkoutStore } from './store/workoutStore';
import { RESOLVED_TEST_PROGRAM } from './test-utils/fixtures';
import { getCompletedWorkouts } from './utils/storage';

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('./hooks/useActiveProgram', () => ({
  useActiveProgram: () => ({
    program: RESOLVED_TEST_PROGRAM,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('./services/programBootstrap', () => ({
  bootstrapDefaultProgramIfNeeded: vi.fn().mockResolvedValue(undefined),
}));

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkoutStore.getState().resetStore();
  });

  it('starts a new workout and opens player drawer', async () => {
    render(<App />);
    
    const startButton = screen.getByText(/Start New Session/i);
    fireEvent.click(startButton);
    
    const startWorkoutButton = screen.getByText(/Start Workout/i);
    fireEvent.click(startWorkoutButton);
    
    // LivePlayer should be visible
    expect(screen.getAllByText('Wrist Mobility Sequence')[0]).toBeInTheDocument();
    
    // Check Menu is rendered
    expect(document.querySelector('button[title="Menu"]')).toBeInTheDocument();
  });

  it('can open menu and pause workout', async () => {
    render(<App />);
    
    // Start
    fireEvent.click(screen.getByText(/Start New Session/i));
    fireEvent.click(screen.getByText(/Start Workout/i));
    
    // Open Menu
    const menuButton = document.querySelector('button[title="Menu"]') as HTMLButtonElement;
    expect(menuButton).not.toBeNull();
    fireEvent.click(menuButton);
    
    // Click pause
    const pauseButton = screen.getByText('Pause Workout');
    fireEvent.click(pauseButton);
    
    // It should change to Resume
    fireEvent.click(menuButton);
    expect(screen.getByText('Resume Workout')).toBeInTheDocument();
  });
  
  it('resets workout correctly', async () => {
    vi.useFakeTimers();
    render(<App />);
    
    // Start
    fireEvent.click(screen.getByText(/Start New Session/i));
    fireEvent.click(screen.getByText(/Start Workout/i));
    
    // Open Menu
    const menuButton = document.querySelector('button[title="Menu"]') as HTMLButtonElement;
    fireEvent.click(menuButton);
    
    // Reset
    const resetButton = screen.getByText('Reset Workout');
    fireEvent.click(resetButton);
    
    expect(screen.getByText('Reset Session?')).toBeInTheDocument();

    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }

    const yesButton = screen.getByText('Yes, Reset Workout');
    fireEvent.click(yesButton);

    // Wait for start screen
    expect(screen.getByText(/Start New Session/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('completes workout correctly from menu', async () => {
    vi.useFakeTimers();
    render(<App />);
    
    // Start
    fireEvent.click(screen.getByText(/Start New Session/i));
    fireEvent.click(screen.getByText(/Start Workout/i));
    
    // Open Menu
    const menuButton = document.querySelector('button[title="Menu"]') as HTMLButtonElement;
    fireEvent.click(menuButton);
    
    // Complete
    const completeButton = screen.getByText('Complete Workout');
    fireEvent.click(completeButton);
    
    // Verify drawer shows up
    expect(screen.getByText('Complete Session?')).toBeInTheDocument();

    // Advance 3s in steps
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }

    const yesButton = screen.getByText('Yes, Complete Workout');
    fireEvent.click(yesButton);
    
    // Completion modal shows
    expect(screen.getByText('UNHINGED Mastered!')).toBeInTheDocument();
    expect(screen.getByText('0 mins')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('saves a per-exercise, per-set completion snapshot when the workout is saved', async () => {
    vi.useFakeTimers();
    render(<App />);

    // Start
    fireEvent.click(screen.getByText(/Start New Session/i));
    fireEvent.click(screen.getByText(/Start Workout/i));

    // Mark set 1 of the first exercise (w1, 1 set total) as complete. Disambiguate from
    // PreWorkoutDrawer's condensed RoutineOverview (always mounted, uses <h4> for the
    // exercise name) by heading level -- LivePlayer's is an <h2>.
    const heading = screen.getByRole('heading', { name: 'Wrist Mobility Sequence', level: 2 });
    const panel = heading.closest('.glass-panel') as HTMLElement;
    fireEvent.click(within(panel).getByRole('button', { name: '1' }));

    // Complete the workout from the menu
    const menuButton = document.querySelector('button[title="Menu"]') as HTMLButtonElement;
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByText('Complete Workout'));
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    fireEvent.click(screen.getByText('Yes, Complete Workout'));

    // Save
    fireEvent.click(screen.getByRole('button', { name: /Save Workout/i }));

    const [saved] = getCompletedWorkouts();
    const w1Log = saved.exerciseLogs.find(log => log.exerciseId === 'w1');
    expect(w1Log?.sets).toEqual([{ setNumber: 1, reps: 0, weightLbs: 0, completed: true }]);

    // s1 (untouched, 5 sets) should be logged as fully uncompleted, not omitted
    const s1Log = saved.exerciseLogs.find(log => log.exerciseId === 's1');
    expect(s1Log?.sets.every(s => !s.completed)).toBe(true);
    expect(s1Log?.sets).toHaveLength(5);

    vi.useRealTimers();
  });
});

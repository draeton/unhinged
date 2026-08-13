import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from './App';
import { useWorkoutStore } from './store/workoutStore';

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
});

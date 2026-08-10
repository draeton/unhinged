import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from './App';
import { clearActiveWorkoutState } from './utils/storage';

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    clearActiveWorkoutState();
  });

  it('starts a new workout and opens player drawer', async () => {
    render(<App />);
    
    const startButton = screen.getByText(/Start New Session/i);
    fireEvent.click(startButton);
    
    // LivePlayer should be visible
    expect(screen.getAllByText('1. WARM-UP (0–10 min)')[0]).toBeInTheDocument();
    
    // Check FAB is rendered
    expect(document.querySelector('button[title="Menu"]')).toBeInTheDocument();
  });

  it('can open FAB menu and pause workout', async () => {
    render(<App />);
    
    // Start
    fireEvent.click(screen.getByText(/Start New Session/i));
    
    // Open FAB
    const fabButton = document.querySelector('button[title="Menu"]') as HTMLButtonElement;
    expect(fabButton).not.toBeNull();
    fireEvent.click(fabButton);
    
    // Click pause
    const pauseButton = screen.getByText('Pause Workout');
    fireEvent.click(pauseButton);
    
    // It should change to Resume
    fireEvent.click(fabButton);
    expect(screen.getByText('Resume Workout')).toBeInTheDocument();
  });
  
  it('resets workout correctly', async () => {
    render(<App />);
    
    // Start
    fireEvent.click(screen.getByText(/Start New Session/i));
    
    // Open FAB
    const fabButton = document.querySelector('button[title="Menu"]') as HTMLButtonElement;
    fireEvent.click(fabButton);
    
    // Reset
    const resetButton = screen.getByText('Reset Workout');
    fireEvent.click(resetButton);
    
    // Wait for start screen
    await waitFor(() => {
      expect(screen.getByText(/Start New Session/i)).toBeInTheDocument();
    });
  });
});

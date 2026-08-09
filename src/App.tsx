import { useState, useEffect, useRef } from 'react';
import { DEFAULT_WORKOUT_BLOCKS } from './data/workoutData';
import type { CompletedWorkout } from './types/workout';
import { getCompletedWorkouts, saveCompletedWorkout, clearActiveWorkoutState } from './utils/storage';
import { audio } from './utils/audio';

import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import type { ScreenType } from './components/StartScreen';
import { LivePlayer } from './components/LivePlayer';
import { RoutineOverview } from './components/RoutineOverview';
import { AsymmetryGuide } from './components/AsymmetryGuide';
import { HistoryStats } from './components/HistoryStats';
import { CompletionModal } from './components/CompletionModal';

export function App() {
  // Workout Global Timer State
  const [isWorkoutStarted, setIsWorkoutStarted] = useState<boolean>(() => localStorage.getItem('unhinged_isWorkoutStarted') === 'true');
  const [isWorkoutPaused, setIsWorkoutPaused] = useState<boolean>(() => localStorage.getItem('unhinged_isWorkoutStarted') === 'true' ? true : false); // Pause on resume
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(() => parseInt(localStorage.getItem('unhinged_totalSecondsElapsed') || '0', 10));

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(isWorkoutStarted ? 'player' : 'start');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionStats, setCompletionStats] = useState<{ durationMinutes: number; completedSets: number }>({ durationMinutes: 60, completedSets: 0 });

  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCompletedWorkouts(getCompletedWorkouts());
  }, []);

  // Global Workout Timer counter (Counts UP while workout is active and not paused)
  useEffect(() => {
    if (isWorkoutStarted && !isWorkoutPaused) {
      workoutTimerRef.current = setInterval(() => {
        setTotalSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    }

    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [isWorkoutStarted, isWorkoutPaused]);

  // Persist global state
  useEffect(() => {
    if (isWorkoutStarted) {
      localStorage.setItem('unhinged_isWorkoutStarted', 'true');
      localStorage.setItem('unhinged_totalSecondsElapsed', String(totalSecondsElapsed));
    }
  }, [isWorkoutStarted, totalSecondsElapsed]);

  // Scroll to top when changing screens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  // Navigate to screen
  const handleNavigate = (screen: ScreenType) => {
    if (screen === 'player') {
      if (!isWorkoutStarted) {
        // Start a brand new workout if none started!
        setIsWorkoutStarted(true);
        setIsWorkoutPaused(false);
        setTotalSecondsElapsed(0);
        audio.playStart();
      }
    }
    setCurrentScreen(screen);
  };


  const handleToggleWorkoutPause = () => {
    setIsWorkoutPaused(prev => !prev);
  };

  const handleStopWorkout = () => {
    setIsWorkoutStarted(false);
    setIsWorkoutPaused(false);
    setTotalSecondsElapsed(0);
    clearActiveWorkoutState();
    setCurrentScreen('start');
  };

  const handleToggleSound = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    audio.setMuted(nextMuted);
  };

  const handleWorkoutComplete = (durationMinutes: number, completedSets: number) => {
    setIsWorkoutPaused(true);
    setCompletionStats({ durationMinutes, completedSets });
    setShowCompletionModal(true);
  };

  const handleSaveWorkout = (rpe: number, notes: string) => {
    const newWorkout: CompletedWorkout = {
      id: `w-${Date.now()}`,
      date: new Date().toISOString(),
      durationMinutes: completionStats.durationMinutes,
      totalSetsCompleted: completionStats.completedSets,
      rpe,
      notes,
      exerciseLogs: [],
    };
    saveCompletedWorkout(newWorkout);
    setCompletedWorkouts(prev => [newWorkout, ...prev]);
    setShowCompletionModal(false);
    
    // Reset workout timer state
    setIsWorkoutStarted(false);
    setIsWorkoutPaused(false);
    setTotalSecondsElapsed(0);
    clearActiveWorkoutState();

    setCurrentScreen('history');
  };

  const handleStartFromBlock = () => {
    handleNavigate('player');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Header Bar */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isWorkoutActive={isWorkoutStarted}
        isWorkoutPaused={isWorkoutPaused}
        onToggleWorkoutPause={handleToggleWorkoutPause}
        onStopWorkout={handleStopWorkout}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Main Screen Body */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {currentScreen === 'start' && (
          <StartScreen
            onNavigate={handleNavigate}
            isWorkoutActive={isWorkoutStarted}
            totalSecondsElapsed={totalSecondsElapsed}
            completedWorkoutsCount={completedWorkouts.length}
          />
        )}

        {currentScreen === 'player' && (
          <LivePlayer
            blocks={DEFAULT_WORKOUT_BLOCKS}
            totalSecondsElapsed={totalSecondsElapsed}
            isWorkoutPaused={isWorkoutPaused}
            onToggleWorkoutPause={handleToggleWorkoutPause}
            onWorkoutComplete={handleWorkoutComplete}
          />
        )}

        {currentScreen === 'blueprint' && (
          <RoutineOverview
            blocks={DEFAULT_WORKOUT_BLOCKS}
            onStartFromBlock={handleStartFromBlock}
          />
        )}

        {currentScreen === 'guide' && (
          <AsymmetryGuide />
        )}

        {currentScreen === 'history' && (
          <HistoryStats
            workouts={completedWorkouts}
          />
        )}
      </main>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal
          durationMinutes={completionStats.durationMinutes}
          completedSetsCount={completionStats.completedSets}
          onSaveAndClose={handleSaveWorkout}
        />
      )}
    </div>
  );
}

export default App;

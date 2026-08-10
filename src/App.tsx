import { useState, useEffect, useRef } from 'react';
import { DEFAULT_WORKOUT_BLOCKS } from './data/workoutData';
import type { CompletedWorkout } from './types/workout';
import { getCompletedWorkouts, saveCompletedWorkout, clearActiveWorkoutState } from './utils/storage';
import { audio } from './utils/audio';
import { Play, Pause, Square, Settings, X, Volume2, VolumeX } from 'lucide-react';

import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import type { ScreenType } from './components/StartScreen';
import { LivePlayer } from './components/LivePlayer';
import { RoutineOverview } from './components/RoutineOverview';
import { AsymmetryGuide } from './components/AsymmetryGuide';
import { HistoryStats } from './components/HistoryStats';
import { CompletionModal } from './components/CompletionModal';
import { Drawer } from './components/Drawer';

export function App() {
  // Workout Global Timer State
  const [isWorkoutStarted, setIsWorkoutStarted] = useState<boolean>(() => localStorage.getItem('unhinged_isWorkoutStarted') === 'true');
  const [isWorkoutPaused, setIsWorkoutPaused] = useState<boolean>(() => localStorage.getItem('unhinged_isWorkoutStarted') === 'true' ? true : false); // Pause on resume
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(() => parseInt(localStorage.getItem('unhinged_totalSecondsElapsed') || '0', 10));

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('start');
  const [activeDrawer, setActiveDrawer] = useState<'blueprint' | 'guide' | 'history' | 'player' | null>(isWorkoutStarted ? 'player' : null);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionStats, setCompletionStats] = useState<{ durationMinutes: number; completedSets: number }>({ durationMinutes: 60, completedSets: 0 });

  const [isFabMenuOpen, setIsFabMenuOpen] = useState<boolean>(false);
  const fabMenuRef = useRef<HTMLDivElement>(null);
  
  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabMenuRef.current && !fabMenuRef.current.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (screen === 'blueprint' || screen === 'guide' || screen === 'history' || screen === 'player') {
      if (screen === 'player') {
        if (!isWorkoutStarted) {
          // Start a brand new workout if none started!
          setIsWorkoutStarted(true);
          setTotalSecondsElapsed(0);
          audio.playStart();
        }
        setIsWorkoutPaused(false);
      }
      setActiveDrawer(screen as 'blueprint' | 'guide' | 'history' | 'player');
      return;
    }

    setCurrentScreen(screen);
    setActiveDrawer(null);
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
    setActiveDrawer(null);
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

    setCurrentScreen('start');
    setActiveDrawer('history');
  };

  const handleStartFromBlock = () => {
    handleNavigate('player');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Header Bar */}
      <Header
        onNavigate={handleNavigate}
      />

      {/* Main Screen Body */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {currentScreen === 'start' && (
          <StartScreen
            onNavigate={handleNavigate}
            isWorkoutActive={isWorkoutStarted}
            isWorkoutPaused={isWorkoutPaused}
            totalSecondsElapsed={totalSecondsElapsed}
            completedWorkoutsCount={completedWorkouts.length}
          />
        )}
      </main>

      <Drawer isOpen={activeDrawer === 'player'} onClose={() => setActiveDrawer(null)}>
        <LivePlayer
          blocks={DEFAULT_WORKOUT_BLOCKS}
          totalSecondsElapsed={totalSecondsElapsed}
          isWorkoutPaused={isWorkoutPaused}
          onToggleWorkoutPause={handleToggleWorkoutPause}
          onWorkoutComplete={handleWorkoutComplete}
        />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'blueprint'} onClose={() => setActiveDrawer(null)}>
        <RoutineOverview
          blocks={DEFAULT_WORKOUT_BLOCKS}
          onStartFromBlock={handleStartFromBlock}
        />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'guide'} onClose={() => setActiveDrawer(null)}>
        <AsymmetryGuide />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'history'} onClose={() => setActiveDrawer(null)}>
        <HistoryStats
          workouts={completedWorkouts}
        />
      </Drawer>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal
          durationMinutes={completionStats.durationMinutes}
          completedSetsCount={completionStats.completedSets}
          onSaveAndClose={handleSaveWorkout}
        />
      )}

      {/* Global FAB Action Menu (Visible when workout is active) */}
      {isWorkoutStarted && (
        <div style={{ position: 'fixed', bottom: '24px', right: '20px', zIndex: 1000 }} ref={fabMenuRef}>
          {isFabMenuOpen && (
            <div className="glass-panel" style={{
              position: 'absolute',
              bottom: '70px',
              right: 0,
              width: '220px',
              padding: '8px',
              background: 'rgba(14, 18, 28, 0.96)',
              border: '1px solid var(--border-glow)',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <button
                onClick={() => {
                  handleToggleWorkoutPause();
                  setIsFabMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: isWorkoutPaused ? '#00F0FF' : '#FF6B00',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                {isWorkoutPaused ? <Play size={16} fill="#00F0FF" /> : <Pause size={16} fill="#FF6B00" />}
                <span>{isWorkoutPaused ? 'Resume Workout' : 'Pause Workout'}</span>
              </button>

              <button
                onClick={() => {
                  handleStopWorkout();
                  setIsFabMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 0, 122, 0.1)',
                  color: '#FF007A',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <Square size={16} fill="#FF007A" />
                <span>Reset Workout</span>
              </button>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
              <button
                onClick={() => {
                  handleToggleSound();
                  setIsFabMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: soundMuted ? 'var(--text-dim)' : 'var(--text-main)',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                {soundMuted ? <VolumeX size={16} color="var(--text-dim)" /> : <Volume2 size={16} color="var(--accent-cyan)" />}
                <span>{soundMuted ? 'Unmute Audio Beeps' : 'Mute Audio Beeps'}</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            title="Menu"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              background: isFabMenuOpen ? 'rgba(0, 240, 255, 0.2)' : 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(18, 24, 38, 0.9) 100%)',
              border: isFabMenuOpen ? '1px solid #00F0FF' : '1px solid rgba(0, 240, 255, 0.3)',
              color: isFabMenuOpen ? '#00F0FF' : '#FFFFFF',
              boxShadow: isFabMenuOpen ? '0 0 20px rgba(0, 240, 255, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            {isFabMenuOpen ? <X size={24} /> : <Settings size={24} />}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

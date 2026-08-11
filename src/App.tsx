import { useState, useEffect, useRef } from 'react';
import { DEFAULT_WORKOUT_BLOCKS } from './data/workoutData';
import type { CompletedWorkout } from './types/workout';
import { getCompletedWorkouts, saveCompletedWorkout, clearActiveWorkoutState } from './utils/storage';
import { audio } from './utils/audio';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, CheckCircle } from 'lucide-react';

import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import type { ScreenType } from './components/StartScreen';
import { LivePlayer } from './components/LivePlayer';
import { RoutineOverview } from './components/RoutineOverview';
import { AsymmetryGuide } from './components/AsymmetryGuide';
import { HistoryStats } from './components/HistoryStats';
import { CompletionModal } from './components/CompletionModal';
import { Drawer } from './components/Drawer';
import { VideoModal } from './components/VideoModal';

export function App() {
  // Workout Global Timer State
  const [isWorkoutStarted, setIsWorkoutStarted] = useState<boolean>(() => localStorage.getItem('unhinged_isWorkoutStarted') === 'true');
  const [isWorkoutPaused, setIsWorkoutPaused] = useState<boolean>(() => localStorage.getItem('unhinged_isWorkoutStarted') === 'true' ? true : false); // Pause on resume
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(() => parseInt(localStorage.getItem('unhinged_totalSecondsElapsed') || '0', 10));

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const savedScreen = localStorage.getItem('unhinged_currentScreen');
    if (savedScreen === 'start' || savedScreen === 'player') {
      return savedScreen as ScreenType;
    }
    return isWorkoutStarted ? 'player' : 'start';
  });
  const [activeDrawer, setActiveDrawer] = useState<'blueprint' | 'guide' | 'history' | 'workoutMenu' | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionStats, setCompletionStats] = useState<{ durationMinutes: number; completedSets: number }>({ durationMinutes: 60, completedSets: 0 });

  const [showConfirmComplete, setShowConfirmComplete] = useState<boolean>(false);
  const [confirmCountdown, setConfirmCountdown] = useState<number>(3);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [resetCountdown, setResetCountdown] = useState<number>(3);
  
  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<any>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // Screen Wake Lock for Live Workout Drawer
  useEffect(() => {
    const requestWakeLock = async () => {
      if (currentScreen === 'player' && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };

    if (currentScreen === 'player') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentScreen === 'player') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentScreen]);



  useEffect(() => {
    setCompletedWorkouts(getCompletedWorkouts());
  }, []);

  useEffect(() => {
    let timerComplete: any;
    if (showConfirmComplete && confirmCountdown > 0) {
      timerComplete = setTimeout(() => {
        setConfirmCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerComplete);
  }, [showConfirmComplete, confirmCountdown]);

  useEffect(() => {
    let timerReset: any;
    if (showConfirmReset && resetCountdown > 0) {
      timerReset = setTimeout(() => {
        setResetCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerReset);
  }, [showConfirmReset, resetCountdown]);

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
    localStorage.setItem('unhinged_currentScreen', currentScreen);
  }, [currentScreen]);

  // Navigate to screen
  const handleNavigate = (screen: ScreenType) => {
    if (screen === 'blueprint' || screen === 'guide' || screen === 'history') {
      setActiveDrawer(screen as 'blueprint' | 'guide' | 'history');
      return;
    }

    if (screen === 'player') {
      if (!isWorkoutStarted) {
        // Start a brand new workout if none started!
        setIsWorkoutStarted(true);
        setTotalSecondsElapsed(0);
        audio.playStart();
      }
      setIsWorkoutPaused(false);
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

  const handleResetWorkoutClick = () => {
    setResetCountdown(3);
    setShowConfirmReset(true);
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
    setActiveDrawer(null);
  };

  const handleCompleteWorkoutClick = () => {
    setConfirmCountdown(3);
    setShowConfirmComplete(true);
  };

  const handleForceCompleteWorkout = () => {
    const completedSetsDict = JSON.parse(localStorage.getItem('unhinged_completedSets') || '{}');
    const totalSets = Object.values(completedSetsDict).reduce((a: any, b: any) => a + Number(b), 0) as number;
    const durationMinutes = Math.round(totalSecondsElapsed / 60);
    handleWorkoutComplete(durationMinutes, totalSets);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Header Bar */}
      <Header
        onNavigate={handleNavigate}
        onMenuClick={() => setActiveDrawer('workoutMenu')}
      />

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
        {currentScreen === 'player' && (
          <LivePlayer
            blocks={DEFAULT_WORKOUT_BLOCKS}
            totalSecondsElapsed={totalSecondsElapsed}
            isWorkoutPaused={isWorkoutPaused}
            onToggleWorkoutPause={handleToggleWorkoutPause}
            onWorkoutComplete={handleWorkoutComplete}
            onPlayVideo={setActiveVideoUrl}
          />
        )}
      </main>

      <Drawer isOpen={activeDrawer === 'blueprint'} onClose={() => setActiveDrawer(null)}>
        <RoutineOverview blocks={DEFAULT_WORKOUT_BLOCKS} onPlayVideo={setActiveVideoUrl} />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'guide'} onClose={() => setActiveDrawer(null)}>
        <AsymmetryGuide />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'history'} onClose={() => setActiveDrawer(null)}>
        <HistoryStats
          workouts={completedWorkouts}
        />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'workoutMenu'} onClose={() => setActiveDrawer(null)}>
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: '#fff' }}>
            {currentScreen === 'start' ? 'App Menu' : 'Workout Menu'}
          </h2>
          
          {currentScreen === 'player' && isWorkoutStarted && (
            <>
              <button
                className="btn-secondary"
                onClick={() => {
                  handleToggleWorkoutPause();
                  setActiveDrawer(null);
                }}
                style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '1rem', background: 'rgba(255,255,255,0.04)' }}
              >
                {isWorkoutPaused ? <Play size={20} fill="#fff" /> : <Pause size={20} fill="#fff" />}
                <span>{isWorkoutPaused ? 'Resume Workout' : 'Pause Workout'}</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  handleCompleteWorkoutClick();
                  setActiveDrawer(null);
                }}
                style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '1rem', background: 'rgba(255,255,255,0.04)' }}
              >
                <CheckCircle size={20} fill="#fff" stroke="#050B14" />
                <span>Complete Workout</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  handleResetWorkoutClick();
                  setActiveDrawer(null);
                }}
                style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '1rem', background: 'rgba(255,255,255,0.04)', color: '#FF3366' }}
              >
                <RotateCcw size={20} />
                <span>Reset Workout</span>
              </button>
            </>
          )}

          {currentScreen === 'start' && (
            <button
              className="btn-secondary"
              onClick={() => {
                handleToggleSound();
              }}
              style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '1rem', background: 'rgba(255,255,255,0.04)' }}
            >
              {soundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              <span>{soundMuted ? 'Sound Off' : 'Sound On'}</span>
            </button>
          )}
        </div>
      </Drawer>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal 
          durationMinutes={completionStats.durationMinutes} 
          completedSetsCount={completionStats.completedSets} 
          onSaveAndClose={handleSaveWorkout}
        />
      )}

      {/* Full Screen Video Modal */}
      <VideoModal url={activeVideoUrl} onClose={() => setActiveVideoUrl(null)} />

      {/* Confirmation Drawer for Reset */}
      {showConfirmReset && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }} 
            onClick={() => setShowConfirmReset(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--bg-dark)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderTop: '1px solid var(--border-glow)',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
            padding: '24px',
            paddingBottom: '40px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'slideUp 0.3s ease-out forwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>Reset Session?</h3>
              <button
                onClick={() => setShowConfirmReset(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}
              >
                <X size={24} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Are you sure you want to completely reset this session? All current progress will be lost.
            </p>
            <button
              disabled={resetCountdown > 0}
              onClick={() => {
                setShowConfirmReset(false);
                handleStopWorkout();
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: resetCountdown > 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 0, 122, 0.8)',
                color: resetCountdown > 0 ? 'rgba(255, 255, 255, 0.5)' : '#FFFFFF',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: resetCountdown > 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                marginTop: '8px',
              }}
            >
              {resetCountdown > 0 ? `Confirm in ${resetCountdown}s` : 'Yes, Reset Workout'}
            </button>
          </div>
        </>
      )}

      {/* Confirmation Drawer for Complete */}
      {showConfirmComplete && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }} 
            onClick={() => setShowConfirmComplete(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--bg-dark)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderTop: '1px solid var(--border-glow)',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
            padding: '24px',
            paddingBottom: '40px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'slideUp 0.3s ease-out forwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>Complete Session?</h3>
              <button
                onClick={() => setShowConfirmComplete(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}
              >
                <X size={24} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Are you sure you want to finish this session? This will stop the timer and log your workout stats.
            </p>
            <button
              disabled={confirmCountdown > 0}
              onClick={() => {
                setShowConfirmComplete(false);
                handleForceCompleteWorkout();
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: confirmCountdown > 0 ? 'rgba(255, 255, 255, 0.1)' : 'var(--accent-cyan)',
                color: confirmCountdown > 0 ? 'rgba(255, 255, 255, 0.5)' : '#050B14',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: confirmCountdown > 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                marginTop: '8px',
              }}
            >
              {confirmCountdown > 0 ? `Confirm in ${confirmCountdown}s` : 'Yes, Complete Workout'}
            </button>
          </div>
        </>
      )}

    </div>
  );
}

export default App;

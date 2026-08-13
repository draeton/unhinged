import { useState, useEffect, useRef } from 'react';
import { DEFAULT_WORKOUT_BLOCKS } from './data/workoutData';
import type { CompletedWorkout } from './types/workout';
import { getCompletedWorkouts, saveCompletedWorkout } from './utils/storage';
import { audio } from './utils/audio';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, CheckCircle } from 'lucide-react';

import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import type { ScreenType } from './components/StartScreen';
import { LivePlayer } from './components/LivePlayer';
import { AsymmetryGuide } from './components/AsymmetryGuide';
import { HistoryStats } from './components/HistoryStats';
import { CompletionModal } from './components/CompletionModal';
import { PreWorkoutDrawer } from './components/PreWorkoutDrawer';
import { Drawer } from './components/Drawer';
import { VideoModal } from './components/VideoModal';
import { CalendarDrawer } from './components/CalendarDrawer';
import { DayDetailDrawer } from './components/DayDetailDrawer';

import { useWorkoutStore } from './store/workoutStore';

export function App() {
  const {
    isWorkoutStarted,
    isWorkoutPaused,
    totalSecondsElapsed,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    incrementTotalTime
  } = useWorkoutStore();

  const [isPreWorkoutOpen, setIsPreWorkoutOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  
  const [activeDrawer, setActiveDrawer] = useState<'blueprint' | 'guide' | 'history' | 'workoutMenu' | 'calendar' | null>(null);
  const [activeDayDetail, setActiveDayDetail] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionStats, setCompletionStats] = useState<{ durationMinutes: number; completedSets: number }>({ durationMinutes: 60, completedSets: 0 });

  const [showConfirmComplete, setShowConfirmComplete] = useState<boolean>(false);
  const [confirmCountdown, setConfirmCountdown] = useState<number>(3);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [resetCountdown, setResetCountdown] = useState<number>(3);
  
  const wakeLockRef = useRef<any>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      if (isPlayerOpen && 'wakeLock' in navigator) {
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

    if (isPlayerOpen) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlayerOpen) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlayerOpen]);



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

  // Global Workout Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      useWorkoutStore.getState().incrementTotalTime();
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  // Navigate to screen
  const handleNavigate = (screen: ScreenType) => {
    if (screen === 'blueprint' || screen === 'guide' || screen === 'history') {
      setActiveDrawer(screen as 'blueprint' | 'guide' | 'history');
      return;
    }
    setActiveDrawer(null);
  };

  const handleStartWorkout = () => {
    if (!isWorkoutStarted) {
      startWorkout();
      audio.playStart();
    }
    resumeWorkout();
    setIsPlayerOpen(true);
  };


  const handleToggleWorkoutPause = () => {
    if (isWorkoutPaused) resumeWorkout();
    else pauseWorkout();
  };

  const handleStopWorkout = () => {
    stopWorkout();
    setIsPlayerOpen(false);
    setIsPreWorkoutOpen(false);
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
    pauseWorkout();
    setCompletionStats({ durationMinutes, completedSets });
    setShowCompletionModal(true);
    setActiveDrawer(null);
  };

  const handleCompleteWorkoutClick = () => {
    setConfirmCountdown(3);
    setShowConfirmComplete(true);
  };

  const handleForceCompleteWorkout = () => {
    const completedSetsDict = useWorkoutStore.getState().completedSets;
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
    stopWorkout();

    setIsPlayerOpen(false);
    setIsPreWorkoutOpen(false);
    setActiveDrawer('history');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Header Bar */}
      <Header
        onNavigate={handleNavigate}
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        <StartScreen
          onNavigate={handleNavigate}
          onOpenPreWorkout={() => setIsPreWorkoutOpen(true)}
          onOpenCalendar={() => setActiveDrawer('calendar')}
          isWorkoutActive={isWorkoutStarted}
          isWorkoutPaused={isWorkoutPaused}
          totalSecondsElapsed={totalSecondsElapsed}
          completedWorkoutsCount={completedWorkouts.length}
          completedWorkouts={completedWorkouts}
        />
      </main>

      {/* Pre-Workout Drawer */}
      <Drawer isOpen={isPreWorkoutOpen} onClose={() => setIsPreWorkoutOpen(false)}>
        <PreWorkoutDrawer
          isWorkoutStarted={isWorkoutStarted}
          isWorkoutPaused={isWorkoutPaused}
          totalSecondsElapsed={totalSecondsElapsed}
          onStart={handleStartWorkout}
          onMenuClick={() => setActiveDrawer('workoutMenu')}
          onPlayVideo={setActiveVideoUrl}
        />
      </Drawer>

      {/* Live Player Drawer */}
      <Drawer isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)}>
        <LivePlayer
          blocks={DEFAULT_WORKOUT_BLOCKS}
          totalSecondsElapsed={totalSecondsElapsed}
          isWorkoutPaused={isWorkoutPaused}
          onToggleWorkoutPause={handleToggleWorkoutPause}
          onWorkoutComplete={handleWorkoutComplete}
          onPlayVideo={setActiveVideoUrl}
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

      <Drawer isOpen={activeDrawer === 'workoutMenu'} onClose={() => setActiveDrawer(null)}>
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
              <button
                className="btn-secondary"
                disabled={!isWorkoutStarted}
                onClick={() => {
                  handleToggleWorkoutPause();
                  setActiveDrawer(null);
                }}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '16px', 
                  fontSize: '1rem',
                  background: 'rgba(255,255,255,0.04)',
                  opacity: !isWorkoutStarted ? 0.5 : 1,
                  cursor: !isWorkoutStarted ? 'not-allowed' : 'pointer'
                }}
              >
                {isWorkoutPaused ? <Play size={20} fill="#fff" /> : <Pause size={20} fill="#fff" />}
                <span>{isWorkoutPaused ? 'Resume Workout' : 'Pause Workout'}</span>
              </button>

              <button
                className="btn-secondary"
                disabled={!isWorkoutStarted}
                onClick={() => {
                  handleCompleteWorkoutClick();
                  setActiveDrawer(null);
                }}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '16px', 
                  fontSize: '1rem', 
                  background: 'rgba(255,255,255,0.04)',
                  opacity: !isWorkoutStarted ? 0.5 : 1,
                  cursor: !isWorkoutStarted ? 'not-allowed' : 'pointer'
                }}
              >
                <CheckCircle size={20} fill="#fff" stroke="#050B14" />
                <span>Complete Workout</span>
              </button>

              <button
                className="btn-secondary"
                disabled={!isWorkoutStarted}
                onClick={() => {
                  handleResetWorkoutClick();
                  setActiveDrawer(null);
                }}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '16px', 
                  fontSize: '1rem', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#FF3366',
                  opacity: !isWorkoutStarted ? 0.5 : 1,
                  cursor: !isWorkoutStarted ? 'not-allowed' : 'pointer'
                }}
              >
                <RotateCcw size={20} />
                <span>Reset Workout</span>
              </button>

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

      {/* Calendar Month Drawer */}
      <Drawer isOpen={activeDrawer === 'calendar'} onClose={() => setActiveDrawer(null)}>
        <CalendarDrawer
          completedWorkouts={completedWorkouts}
          onDayClick={(dateStr) => setActiveDayDetail(dateStr)}
        />
      </Drawer>

      {/* Day Detail Drawer */}
      <Drawer isOpen={!!activeDayDetail} onClose={() => setActiveDayDetail(null)}>
        {activeDayDetail && (
          <DayDetailDrawer
            dateStr={activeDayDetail}
            completedWorkouts={completedWorkouts}
          />
        )}
      </Drawer>
    </div>
  );
}

export default App;

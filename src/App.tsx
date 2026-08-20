import { useState, useEffect, useCallback, useRef } from 'react';
import type { CompletedWorkout, ExerciseLog } from './types/workout';
import type { Program } from './types/program';
import { getCompletedWorkouts, saveCompletedWorkout, deleteCompletedWorkout, setActiveProgramId } from './utils/storage';
import { syncWorkoutToSupabase, syncWorkoutsFromSupabase, deleteWorkoutFromSupabase } from './utils/supabaseSync';
import { supabase } from './utils/supabase';
import { audio } from './utils/audio';
import { useActiveProgram } from './hooks/useActiveProgram';
import { bootstrapDefaultProgramIfNeeded } from './services/programBootstrap';
import { listPrograms } from './services/programs';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, CheckCircle } from 'lucide-react';

import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import type { ScreenType } from './components/StartScreen';
import { LivePlayer } from './components/LivePlayer';
import { HistoryStats } from './components/HistoryStats';
import { CompletionModal } from './components/CompletionModal';
import { PreWorkoutDrawer } from './components/PreWorkoutDrawer';
import { Drawer } from './components/Drawer';
import { VideoModal } from './components/VideoModal';
import { CalendarDrawer } from './components/CalendarDrawer';
import { DayDetailDrawer } from './components/DayDetailDrawer';
import { ExerciseLibraryDrawer } from './components/ExerciseLibraryDrawer';
import { ProgramListDrawer } from './components/ProgramListDrawer';
import { OfflineBanner } from './components/OfflineBanner';

import { useWorkoutStore } from './store/workoutStore';
import { useAuth } from './context/AuthContext';

export function App() {
  const { user, signOut } = useAuth();
  const {
    isWorkoutStarted,
    isWorkoutPaused,
    totalSecondsElapsed,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout
  } = useWorkoutStore();

  const { program: activeProgram, error: activeProgramError, refetch: refetchActiveProgram } = useActiveProgram(user?.id ?? null);

  const [programs, setPrograms] = useState<Program[]>([]);
  const refreshPrograms = useCallback(() => {
    if (!user) {
      setPrograms([]);
      return;
    }
    listPrograms(user.id)
      .then(setPrograms)
      .catch(err => console.error('Failed to load programs:', err));
  }, [user]);

  useEffect(() => {
    refreshPrograms();
  }, [refreshPrograms]);

  const [isPreWorkoutOpen, setIsPreWorkoutOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  
  const [activeDrawer, setActiveDrawer] = useState<'blueprint' | 'history' | 'workoutMenu' | 'calendar' | 'appMenu' | 'exerciseLibrary' | 'programs' | null>(null);
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
    // Initial local load
    setCompletedWorkouts(getCompletedWorkouts());

    // Try fetching from Supabase and update local storage & state if logged in
    syncWorkoutsFromSupabase().then((synced) => {
      setCompletedWorkouts(synced);
    });

    // Also re-sync when auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncWorkoutsFromSupabase().then((synced) => {
        setCompletedWorkouts(synced);
      });

      if (session?.user) {
        bootstrapDefaultProgramIfNeeded(session.user.id).then(() => {
          refetchActiveProgram();
          // Called directly (not via the refreshPrograms callback) to avoid this
          // mount-only effect's stale closure over `user` -- session.user.id is fresh.
          listPrograms(session.user.id).then(setPrograms).catch(err => console.error('Failed to load programs:', err));
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Global Workout Timer counter — derived from actual start/pause timestamps (see
  // refreshElapsedTime) so it stays accurate even if the interval is throttled while the
  // app is backgrounded; also refresh immediately when the app regains focus.
  useEffect(() => {
    const refresh = () => useWorkoutStore.getState().refreshElapsedTime();
    const timer = setInterval(refresh, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refresh);
    };
  }, []);



  // Navigate to screen
  const handleNavigate = (screen: ScreenType) => {
    if (screen === 'blueprint' || screen === 'history') {
      setActiveDrawer(screen as 'blueprint' | 'history');
      return;
    }
    setActiveDrawer(null);
  };

  const handleSelectProgram = (programId: string) => {
    setActiveProgramId(programId);
    refetchActiveProgram();
    setIsPreWorkoutOpen(true);
  };

  const handleResumeActiveWorkout = () => {
    setIsPreWorkoutOpen(true);
  };

  const handleStartWorkout = () => {
    if (!activeProgram || activeProgram.blocks.length === 0) return;
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
    // Read directly from the store rather than a subscribed value -- this must reflect
    // completedSets as it stood at the moment of completion, and stopWorkout() (called
    // below, after saving) resets it back to {}.
    const completedSetsDict = useWorkoutStore.getState().completedSets;
    const exerciseLogs: ExerciseLog[] = (activeProgram?.blocks ?? []).flatMap(block =>
      block.exercises.map((ex): ExerciseLog => {
        const completedCount = completedSetsDict[ex.id] ?? 0;
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            reps: 0,
            weightLbs: 0,
            completed: i < completedCount,
          })),
        };
      })
    );

    const newWorkout: CompletedWorkout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      durationMinutes: completionStats.durationMinutes,
      totalSetsCompleted: completionStats.completedSets,
      rpe,
      notes,
      exerciseLogs,
      programName: activeProgram?.name,
    };
    saveCompletedWorkout(newWorkout);
    syncWorkoutToSupabase(newWorkout); // Push to Supabase async

    // Update local state immediately for snappy UI
    setCompletedWorkouts(getCompletedWorkouts());
    setShowCompletionModal(false);
    
    // Reset workout timer state
    stopWorkout();

    setIsPlayerOpen(false);
    setIsPreWorkoutOpen(false);
    setActiveDrawer('history');
  };

  const handleDeleteWorkout = (id: string) => {
    setCompletedWorkouts(prev => prev.filter(w => w.id !== id));
    deleteCompletedWorkout(id);
    deleteWorkoutFromSupabase(id);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      <OfflineBanner />

      {/* Header Bar */}
      <Header
        onNavigate={handleNavigate}
        onMenuClick={() => setActiveDrawer('appMenu')}
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        <StartScreen
          programs={programs}
          activeProgramId={activeProgram?.id ?? null}
          onSelectProgram={handleSelectProgram}
          onResumeActiveWorkout={handleResumeActiveWorkout}
          onOpenPrograms={() => setActiveDrawer('programs')}
          onOpenExerciseLibrary={() => setActiveDrawer('exerciseLibrary')}
          onOpenCalendar={(dateStr) => {
            setActiveDrawer('calendar');
            if (dateStr) {
              setActiveDayDetail(dateStr);
            }
          }}
          isWorkoutActive={isWorkoutStarted}
          isWorkoutPaused={isWorkoutPaused}
          totalSecondsElapsed={totalSecondsElapsed}

          completedWorkouts={completedWorkouts}
        />
      </main>

      {/* Pre-Workout Drawer */}
      <Drawer isOpen={isPreWorkoutOpen} onClose={() => setIsPreWorkoutOpen(false)}>
        <PreWorkoutDrawer
          blocks={activeProgram?.blocks ?? []}
          programName={activeProgram?.name}
          activeProgramError={activeProgramError}
          onRetryActiveProgram={refetchActiveProgram}
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
          blocks={activeProgram?.blocks ?? []}
          onPlayVideo={setActiveVideoUrl}
        />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'history'} onClose={() => setActiveDrawer(null)}>
        <HistoryStats
          workouts={completedWorkouts}
          onDeleteWorkout={handleDeleteWorkout}
        />
      </Drawer>

      <Drawer isOpen={activeDrawer === 'workoutMenu'} onClose={() => setActiveDrawer(null)}>
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
              <button
                className="btn-secondary"
                onClick={() => {
                  handleToggleWorkoutPause();
                  setActiveDrawer(null);
                }}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '16px', 
                  fontSize: '1rem',
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer'
                }}
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
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '16px', 
                  fontSize: '1rem', 
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer'
                }}
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
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '16px', 
                  fontSize: '1rem', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#FF3366',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={20} />
                <span>Reset Workout</span>
              </button>
        </div>
      </Drawer>

      <Drawer isOpen={activeDrawer === 'appMenu'} onClose={() => setActiveDrawer(null)}>
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />

          <button
            onClick={async () => {
              await signOut();
              setActiveDrawer(null);
            }}
            style={{ width: '100%', padding: '16px', background: 'transparent', border: '1px solid rgba(255, 0, 122, 0.3)', color: '#FF007A', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '1rem' }}
          >
            Sign Out
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
            onDeleteWorkout={handleDeleteWorkout}
          />
        )}
      </Drawer>

      {/* Exercise Library Drawer */}
      <Drawer isOpen={activeDrawer === 'exerciseLibrary'} onClose={() => setActiveDrawer(null)}>
        {user && <ExerciseLibraryDrawer userId={user.id} />}
      </Drawer>

      {/* Programs Drawer */}
      <Drawer isOpen={activeDrawer === 'programs'} onClose={() => { setActiveDrawer(null); refreshPrograms(); }}>
        {user && <ProgramListDrawer userId={user.id} />}
      </Drawer>
    </div>
  );
}

export default App;

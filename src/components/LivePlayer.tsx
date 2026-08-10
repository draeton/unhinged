import React, { useState, useEffect, useRef } from 'react';
import type { WorkoutBlock, Exercise } from '../types/workout';
import { audio } from '../utils/audio';
import { Play, Pause, SkipForward, SkipBack, Plus, Minus, AlertCircle, Sparkles, ShieldAlert, Clock, FileText, Video, RotateCcw } from 'lucide-react';

interface LivePlayerProps {
  blocks: WorkoutBlock[];
  totalSecondsElapsed: number;
  isWorkoutPaused: boolean;
  onToggleWorkoutPause: () => void;
  onWorkoutComplete: (totalMinutes: number, completedSets: number) => void;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  blocks,
  totalSecondsElapsed,
  isWorkoutPaused,
  onToggleWorkoutPause,
  onWorkoutComplete,
}) => {
  // Flatten exercises with block metadata
  const allExercises = React.useMemo(() => {
    const list: { exercise: Exercise; blockTitle: string; blockCategory: string; blockBadgeColor: string }[] = [];
    blocks.forEach(b => {
      b.exercises.forEach(e => {
        list.push({
          exercise: e,
          blockTitle: b.title,
          blockCategory: b.category,
          blockBadgeColor: b.badgeColor,
        });
      });
    });
    return list;
  }, [blocks]);

  const [currentIndex, setCurrentIndex] = useState<number>(() => parseInt(localStorage.getItem('unhinged_currentIndex') || '0', 10));
  const currentIndexRef = useRef<number>(currentIndex);
  const [isResting, setIsResting] = useState<boolean>(() => localStorage.getItem('unhinged_isResting') === 'true');
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const val = localStorage.getItem('unhinged_timeLeft');
    return val ? parseInt(val, 10) : (allExercises[0]?.exercise.durationSeconds || 180);
  });
  const [isIntervalStarted, setIsIntervalStarted] = useState<boolean>(() => localStorage.getItem('unhinged_isIntervalStarted') === 'true');
  const [isIntervalPaused, setIsIntervalPaused] = useState<boolean>(() => localStorage.getItem('unhinged_isIntervalPaused') === 'true');
  const [timeOffset, setTimeOffset] = useState<number>(() => parseInt(localStorage.getItem('unhinged_timeOffset') || '0', 10));


  // Set Tracking per exercise: { [exerciseId]: completedSetCount }
  const [completedSets, setCompletedSets] = useState<{ [exerciseId: string]: number }>(() => JSON.parse(localStorage.getItem('unhinged_completedSets') || '{}'));

  // Mobile / Tablet Panel Switcher: 'details' (Panel 1) vs 'timer' (Panel 2)
  const [mobileActivePanel, setMobileActivePanel] = useState<'details' | 'timer'>('details');

  const currentItem = allExercises[currentIndex];
  const currentExercise = currentItem?.exercise;
  const nextItem = allExercises[currentIndex + 1];

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('unhinged_currentIndex', String(currentIndex));
    localStorage.setItem('unhinged_isResting', String(isResting));
    localStorage.setItem('unhinged_timeLeft', String(timeLeft));
    localStorage.setItem('unhinged_isIntervalStarted', String(isIntervalStarted));
    localStorage.setItem('unhinged_isIntervalPaused', String(isIntervalPaused));
    localStorage.setItem('unhinged_timeOffset', String(timeOffset));
    localStorage.setItem('unhinged_completedSets', JSON.stringify(completedSets));
  }, [currentIndex, isResting, timeLeft, isIntervalStarted, isIntervalPaused, completedSets, timeOffset]);

  // Keep ref in sync so setTimeout callbacks always read the latest index
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // On exercise change: scroll to top and ensure sets tab is active on mobile
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileActivePanel('details');
  }, [currentIndex]);

  const navigateToExercise = (newIndex: number) => {
    setCurrentIndex(newIndex);
    setIsIntervalStarted(false);
    setIsIntervalPaused(false);
    setIsResting(false);
    setTimeLeft(allExercises[newIndex]?.exercise.durationSeconds || 180);
  };

  // Propagate global pause into local interval pause state
  useEffect(() => {
    if (isWorkoutPaused && isIntervalStarted && !isIntervalPaused) {
      setIsIntervalPaused(true);
    }
  }, [isWorkoutPaused, isIntervalStarted, isIntervalPaused]);

  const totalExerciseDuration = isResting
    ? currentExercise?.restSeconds || 30
    : currentExercise?.durationSeconds || 180;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs so the interval callback always reads current values without restarting the effect
  const totalSecondsElapsedRef = useRef<number>(totalSecondsElapsed);
  const completedSetsRef = useRef<{ [exerciseId: string]: number }>({});
  const onWorkoutCompleteRef = useRef(onWorkoutComplete);
  const currentExerciseRef = useRef(currentExercise);
  const timeLeftRef = useRef<number>(timeLeft);
  useEffect(() => { totalSecondsElapsedRef.current = totalSecondsElapsed; }, [totalSecondsElapsed]);
  useEffect(() => { completedSetsRef.current = completedSets; }, [completedSets]);
  useEffect(() => { onWorkoutCompleteRef.current = onWorkoutComplete; }, [onWorkoutComplete]);
  useEffect(() => { currentExerciseRef.current = currentExercise; }, [currentExercise]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Initial reset of timer duration when navigating or switching rest state
  useEffect(() => {
    if (currentExercise) {
      setTimeOffset(0);
      if (isResting) {
        setTimeLeft(currentExercise.restSeconds > 0 ? currentExercise.restSeconds : 30);
      } else {
        setTimeLeft(currentExercise.durationSeconds);
      }
    }
  }, [currentIndex, isResting, currentExercise]);

  // Handle countdown interval — paused by isIntervalPaused (which also absorbs global pauses)
  useEffect(() => {
    if (isIntervalStarted && !isIntervalPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Interval expired
            if (isResting) {
              // Finish rest -> Move to next exercise
              setIsResting(false);
              audio.playStart();
              if (currentIndex < allExercises.length - 1) {
                setCurrentIndex(c => c + 1);
              } else {
                audio.playFanfare();
                onWorkoutCompleteRef.current(
                  Math.round(totalSecondsElapsedRef.current / 60) || 60,
                  Object.values(completedSetsRef.current).reduce((a, b) => a + b, 0)
                );
              }
            } else {
              // Active exercise time finished -> enter rest or advance
              const ex = currentExerciseRef.current;
              if (ex && ex.restSeconds > 0) {
                setIsResting(true);
                audio.playRest();
              } else {
                audio.playStart();
                if (currentIndex < allExercises.length - 1) {
                  setCurrentIndex(c => c + 1);
                } else {
                  audio.playFanfare();
                  onWorkoutCompleteRef.current(
                    Math.round(totalSecondsElapsedRef.current / 60) || 60,
                    Object.values(completedSetsRef.current).reduce((a, b) => a + b, 0)
                  );
                }
              }
            }
            return 0;
          }

          // Audio countdown beeps at 3, 2, 1
          if (prev <= 4 && prev > 1) {
            audio.playBeep(600, 100);
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isIntervalStarted, isIntervalPaused, isResting, currentIndex, allExercises.length]);

  if (!currentExercise) return null;

  // Progress calculations
  const currentMaxDuration = totalExerciseDuration + timeOffset;
  const progressPercent = currentMaxDuration > 0
    ? Math.max(0, Math.min(100, ((currentMaxDuration - timeLeft) / currentMaxDuration) * 100))
    : 0;

  const totalWorkoutProgress = Math.min(100, Math.round((currentIndex / allExercises.length) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleSet = (setNum: number) => {
    const exId = currentExercise.id;
    const currentCount = completedSets[exId] || 0;
    const newCount = setNum === currentCount ? setNum - 1 : setNum;

    setCompletedSets(prev => ({ ...prev, [exId]: newCount }));

    // If completing a set (and not undoing), reset the active interval timer and stop it
    if (newCount > currentCount && newCount < currentExercise.sets) {
      setIsResting(false);
      setTimeLeft(currentExercise.durationSeconds || 180);
      setIsIntervalStarted(false);
      setIsIntervalPaused(false);
    }

    // AUTO ADVANCE: manually completing all sets skips directly to the next exercise
    if (newCount === currentExercise.sets) {
      const snapIndex = currentIndexRef.current;
      const totalCompleted = Object.values(completedSets).reduce((a, b) => a + b, 0) + 1;

      setTimeout(() => {
        setIsResting(false);
        if (snapIndex < allExercises.length - 1) {
          audio.playStart();
          navigateToExercise(snapIndex + 1);
        } else {
          audio.playFanfare();
          onWorkoutComplete(
            Math.round(totalSecondsElapsed / 60) || 60,
            totalCompleted
          );
        }
      }, 400);
    }
  };

  const handleAdjustRest = (deltaSeconds: number) => {
    const prev = timeLeftRef.current;
    const next = Math.max(5, prev + deltaSeconds);
    const actualDelta = next - prev;
    setTimeLeft(next);
    setTimeOffset(o => o + actualDelta);
  };

  const handleSkipNext = () => {
    if (currentIndex < allExercises.length - 1) {
      navigateToExercise(currentIndex + 1);
    }
  };

  const handleSkipPrev = () => {
    if (currentIndex > 0) {
      navigateToExercise(currentIndex - 1);
    }
  };

  // Specific Asymmetry Cues
  const isLeftScapularFocus = currentExercise.id === 's1';
  const isHandstandFocus = currentExercise.id === 's2';
  const isJeffersonCurlFocus = currentExercise.id === 'm3';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Top Total Program Progress Bar */}
          <div className="glass-panel" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: currentItem.blockBadgeColor, fontWeight: '700', textTransform: 'uppercase' }}>
                {currentItem.blockTitle}
              </span>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                Exercise {currentIndex + 1} of {allExercises.length}
              </span>
            </div>

            {/* Global Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${totalWorkoutProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00F0FF 0%, #00FF9D 50%, #FF007A 100%)',
                transition: 'width 0.4s ease',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.5)'
              }} />
            </div>
          </div>
        </div>

      {/* Mobile/Tablet Panel Swapper Toggle Bar */}
      <div className="mobile-panel-toggle" style={{
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '4px',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={() => setMobileActivePanel('details')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: mobileActivePanel === 'details' ? 'linear-gradient(135deg, #00F0FF 0%, #00FF9D 100%)' : 'transparent',
            color: mobileActivePanel === 'details' ? '#050B14' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <FileText size={16} />
          <span>Sets</span>
        </button>

        <button
          onClick={() => setMobileActivePanel('timer')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: mobileActivePanel === 'timer' ? 'linear-gradient(135deg, #00F0FF 0%, #00FF9D 100%)' : 'transparent',
            color: mobileActivePanel === 'timer' ? '#050B14' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Clock size={16} />
          <span>Timer ({formatTime(timeLeft)})</span>
        </button>
      </div>

      {/* Main Layout Grid (Responsive Side-by-Side on Desktop, Swappable Panels on Mobile) */}
      <div className="player-layout-grid">
        
        {/* PANEL 1: Exercise Info, Cues, & Interactive Set Tracker */}
        <div className={`player-panel ${mobileActivePanel === 'details' ? 'active-mobile-panel' : 'hidden-mobile-panel'}`}
             style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Exercise Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>
                  {currentExercise.name}
                </h2>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                  {currentExercise.repsOrTime}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '8px', lineHeight: 1.5 }}>
                {currentExercise.description}
              </p>
            </div>

            {/* SPECIAL CUE HIGHLIGHT: Left Scapular Asymmetry Warning */}
            {isLeftScapularFocus && (
              <div className="left-scapula-badge" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <ShieldAlert size={22} style={{ flexShrink: 0, color: '#D8B4FE', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', letterSpacing: '0.04em' }}>
                    ⚡ LEFT SCAPULAR ASYMMETRY FOCUS
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px', opacity: 0.9 }}>
                    Wrap left shoulder blade DOWN and BACK firmly into back pocket during the 3 slow scapular pull-ups before pulling chin over bar!
                  </div>
                </div>
              </div>
            )}

            {/* SPECIAL CUE HIGHLIGHT: Handstand Parallettes Tip */}
            {isHandstandFocus && (
              <div style={{
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#00F0FF'
              }}>
                <Sparkles size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem' }}>PRO WRIST SAFETY TIP</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                    If your wrists feel limited or fatigued, use parallettes or wrist support blocks to reduce wrist extension angle!
                  </div>
                </div>
              </div>
            )}

            {/* SPECIAL CUE HIGHLIGHT: Jefferson Curl Spine Segmenting */}
            {isJeffersonCurlFocus && (
              <div style={{
                background: 'rgba(255, 0, 122, 0.12)',
                border: '1px solid rgba(255, 0, 122, 0.3)',
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#FF007A'
              }}>
                <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem' }}>SPINAL ARTICULATION RULE</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                    Tuck chin to chest first, then roll down vertebra-by-vertebra. Keep weight light (5–10 lbs max).
                  </div>
                </div>
              </div>
            )}

            {/* Form Cues List */}
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Form Execution Cues
              </div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                {currentExercise.formCues.map((cue, i) => (
                  <li key={i}>{cue}</li>
                ))}
              </ul>
              {currentExercise.videoUrls && currentExercise.videoUrls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {currentExercise.videoUrls.map((video, idx) => (
                    <a
                      key={idx}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        color: 'var(--accent-cyan)',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                      <Video size={16} />
                      {video.title}
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* PANEL 2: Radial Timer & Controls */}
        <div className={`player-panel ${mobileActivePanel === 'timer' ? 'active-mobile-panel' : 'hidden-mobile-panel'}`}>
          <div className="glass-panel" style={{
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
          }}>
            {/* Phase Badge: Active Exercise vs Rest */}
            <div 
              className="badge" 
              onClick={() => setMobileActivePanel('details')}
              style={{
                background: isResting ? 'rgba(255, 107, 0, 0.2)' : 'rgba(0, 255, 157, 0.2)',
                color: isResting ? 'var(--accent-orange)' : 'var(--accent-emerald)',
                border: isResting ? '1px solid var(--accent-orange)' : '1px solid var(--accent-emerald)',
                marginBottom: '16px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {currentExercise.name}
            </div>

            {/* SVG Circular Ring Timer */}
            <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track Circle */}
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Active Progress Circle */}
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  stroke={isResting ? '#FF6B00' : currentItem.blockBadgeColor}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={628.3}
                  strokeDashoffset={628.3 - (628.3 * progressPercent) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>

              {/* Center Time Display */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '3.6rem',
                  fontWeight: '900',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: isResting ? '#FF6B00' : '#FFFFFF',
                  textShadow: isResting ? '0 0 20px rgba(255, 107, 0, 0.5)' : '0 0 20px rgba(0, 240, 255, 0.4)'
                }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {isResting ? 'Rest Remaining' : 'Target Interval'}
                </span>
              </div>
            </div>

            {/* Quick Rest Adjust Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => handleAdjustRest(-15)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Minus size={14} /> 15s
              </button>
              <button className="btn-secondary" onClick={() => handleAdjustRest(15)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Plus size={14} /> 15s
              </button>
            </div>

            {/* Play / Pause & Reset Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  if (!isIntervalStarted) {
                    // Start interval; also resume global if paused
                    setIsIntervalStarted(true);
                    if (isWorkoutPaused) onToggleWorkoutPause();
                  } else if (isIntervalPaused || isWorkoutPaused) {
                    // Resume interval; also resume global if paused
                    setIsIntervalPaused(false);
                    if (isWorkoutPaused) onToggleWorkoutPause();
                  } else {
                    // Pause interval only
                    setIsIntervalPaused(true);
                  }
                }}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  padding: 0,
                  justifyContent: 'center',
                  background: !isIntervalStarted
                    ? 'linear-gradient(135deg, #00FF9D 0%, #00F0FF 100%)'
                    : (isIntervalPaused || isWorkoutPaused)
                    ? 'linear-gradient(135deg, #00F0FF 0%, #00FF9D 100%)'
                    : 'linear-gradient(135deg, #FF007A 0%, #FF6B00 100%)',
                  boxShadow: !isIntervalStarted
                    ? '0 0 25px rgba(0, 255, 157, 0.5)'
                    : (isIntervalPaused || isWorkoutPaused)
                    ? '0 0 25px rgba(0, 240, 255, 0.5)'
                    : '0 0 25px rgba(255, 0, 122, 0.5)'
                }}
              >
                {!isIntervalStarted
                  ? <Play size={28} fill="#050B14" style={{ marginLeft: '4px' }} />
                  : (isIntervalPaused || isWorkoutPaused)
                  ? <Play size={28} fill="#050B14" style={{ marginLeft: '4px' }} />
                  : <Pause size={28} fill="#050B14" />}
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setIsIntervalStarted(false);
                  setIsIntervalPaused(false);
                  setTimeOffset(0);
                  setTimeLeft(isResting ? (currentExercise?.restSeconds || 30) : (currentExercise?.durationSeconds || 180));
                }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  padding: 0,
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                }}
                title="Reset Timer"
              >
                <RotateCcw size={20} color="var(--text-main)" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Globally Visible Shared Bottom Controls (Always visible on mobile across tabs) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        
        {/* Interactive Set Tracker — own container */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Set Progress ({completedSets[currentExercise.id] || 0} / {currentExercise.sets} completed)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
            {Array.from({ length: currentExercise.sets }).map((_, idx) => {
              const setNum = idx + 1;
              const isDone = (completedSets[currentExercise.id] || 0) >= setNum;
              return (
                <button
                  key={setNum}
                  onClick={() => handleToggleSet(setNum)}
                  style={{
                    flex: '1 0 auto',
                    minWidth: '56px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: isDone ? '1px solid #00FF9D' : '1px solid var(--border-subtle)',
                    background: isDone ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: isDone ? '#00FF9D' : 'var(--text-muted)',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {setNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Up Preview Teaser */}
        {nextItem && (
          <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>
                NEXT UP PREVIEW
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#FFFFFF', marginTop: '2px' }}>
                {nextItem.exercise.name}
              </div>
            </div>
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--accent-cyan)' }}>
              {nextItem.exercise.repsOrTime}
            </span>
          </div>
        )}

        {/* Previous / Next Exercise Navigation */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={handleSkipPrev}
            disabled={currentIndex === 0}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', justifyContent: 'center', gap: '8px', opacity: currentIndex === 0 ? 0.4 : 1 }}
          >
            <SkipBack size={16} />
            <span>Previous</span>
          </button>
          <button
            className="btn-secondary"
            onClick={handleSkipNext}
            disabled={currentIndex === allExercises.length - 1}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', justifyContent: 'center', gap: '8px', opacity: currentIndex === allExercises.length - 1 ? 0.4 : 1 }}
          >
            <span>Next</span>
            <SkipForward size={16} />
          </button>
        </div>

      </div>

    </div>
    </div>
  );
};

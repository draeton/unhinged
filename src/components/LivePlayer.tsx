import React, { useState, useEffect, useRef } from 'react';
import type { WorkoutBlock, Exercise } from '../types/workout';
import { audio } from '../utils/audio';
import { Play, Pause, Plus, Minus, RotateCcw, Info } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { Drawer } from './Drawer';
import { ExerciseInfoPanel } from './ExerciseInfoPanel';

interface LivePlayerProps {
  blocks: WorkoutBlock[];
  totalSecondsElapsed: number;
  isWorkoutPaused: boolean;
  onToggleWorkoutPause: () => void;
  onWorkoutComplete: (totalMinutes: number, completedSets: number) => void;
  onPlayVideo: (url: string) => void;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  blocks,
  totalSecondsElapsed,
  isWorkoutPaused,
  onToggleWorkoutPause,
  onWorkoutComplete,
  onPlayVideo,
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

  const {
    currentIndex,
    isResting,
    timeLeft,
    isIntervalStarted,
    isIntervalPaused,
    timeOffset,
    completedSets,
    setCurrentIndex,
    updateCompletedSets,
    setIntervalState,
    setTimeLeft,
  } = useWorkoutStore();

  const currentIndexRef = useRef<number>(currentIndex);

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);



  const currentItem = allExercises[currentIndex];
  const currentExercise = currentItem?.exercise;
  const nextItem = allExercises[currentIndex + 1];

  // Keep ref in sync so setTimeout callbacks always read the latest index
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (index !== currentIndexRef.current && !isNaN(index)) {
              navigateToExercise(index);
            }
          }
        });
      },
      {
        root: mainCarouselContainerRef.current,
        threshold: 0.85,
      }
    );

    const currentRefs = mainCarouselItemRefs.current;
    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      observer.disconnect();
    };
  }, []);

  const carouselRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainCarouselContainerRef = useRef<HTMLDivElement | null>(null);
  const mainCarouselItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // On exercise change: scroll to top and ensure sets tab is active on mobile
  useEffect(() => {
    const drawerContainer = document.getElementById('drawer-scroll-container');
    if (drawerContainer && typeof drawerContainer.scrollTo === 'function') {
      drawerContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Scroll carousel active item into view
    if (carouselRefs.current[currentIndex] && typeof carouselRefs.current[currentIndex]?.scrollIntoView === 'function') {
      carouselRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
    // Scroll main carousel into view
    if (mainCarouselItemRefs.current[currentIndex] && typeof mainCarouselItemRefs.current[currentIndex]?.scrollIntoView === 'function') {
      mainCarouselItemRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  const navigateToExercise = (newIndex: number) => {
    setCurrentIndex(newIndex);
    setIntervalState({
      isIntervalStarted: false,
      isIntervalPaused: false,
      isResting: false,
    });
    setTimeLeft(allExercises[newIndex]?.exercise.durationSeconds || 180);
  };


  // Propagate global pause into local interval pause state
  useEffect(() => {
    if (isWorkoutPaused && isIntervalStarted && !isIntervalPaused) {
      setIntervalState({ isIntervalPaused: true });
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
      setIntervalState({ timeOffset: 0 });
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
              setIntervalState({ isResting: false });
              audio.playStart();
              if (currentIndex < allExercises.length - 1) {
                setCurrentIndex(c => c + 1);
              } else {
                audio.playFanfare();
                onWorkoutCompleteRef.current(
                  Math.round(totalSecondsElapsedRef.current / 60),
                  Object.values(completedSetsRef.current).reduce((a, b) => a + b, 0)
                );
              }
            } else {
              // Active exercise time finished -> enter rest or advance
              const ex = currentExerciseRef.current;
              if (ex && ex.restSeconds > 0) {
                setIntervalState({ isResting: true });
                audio.playRest();
              } else {
                audio.playStart();
                if (currentIndex < allExercises.length - 1) {
                  setCurrentIndex(c => c + 1);
                } else {
                  audio.playFanfare();
                  onWorkoutCompleteRef.current(
                    Math.round(totalSecondsElapsedRef.current / 60),
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleSet = (setNum: number) => {
    const exId = currentExercise.id;
    const currentCount = completedSets[exId] || 0;
    const newCount = setNum === currentCount ? setNum - 1 : setNum;

    updateCompletedSets(exId, newCount);

    // If completing a set (and not undoing), reset the active interval timer and stop it
    if (newCount > currentCount && newCount < currentExercise.sets) {
      setIntervalState({
        isResting: false,
        isIntervalStarted: false,
        isIntervalPaused: false,
      });
      setTimeLeft(currentExercise.durationSeconds || 180);
    }

    // AUTO ADVANCE: manually completing all sets skips directly to the next exercise
    if (newCount === currentExercise.sets) {
      const snapIndex = currentIndexRef.current;
      const totalCompleted = Object.values(completedSets).reduce((a, b) => a + b, 0) + 1;

      setTimeout(() => {
        setIntervalState({ isResting: false });
        if (snapIndex < allExercises.length - 1) {
          audio.playStart();
          navigateToExercise(snapIndex + 1);
        } else {
          audio.playFanfare();
          onWorkoutComplete(
            Math.round(totalSecondsElapsed / 60),
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
    setIntervalState((s) => ({ timeOffset: s.timeOffset + actualDelta }));
  };



  // Specific Asymmetry Cues (moved to ExerciseInfoPanel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Visual Exercise Navigator Carousel */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '12px',
          padding: '0 4px',
          width: '100%',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }} className="hide-scrollbar">
          {allExercises.map((item, index) => {
            const isActive = index === currentIndex;
            const isFullyComplete = (completedSets[item.exercise.id] || 0) >= item.exercise.sets;
            const borderColor = isFullyComplete ? '#00FF9D' : 'rgba(255,255,255,0.1)';
            const bgColor = isFullyComplete ? 'rgba(0, 255, 157, 0.1)' : 'var(--bg-card)';
            const textColor = isFullyComplete ? '#00FF9D' : '#fff';

            return (
              <button
                key={index}
                ref={(el) => {
                  carouselRefs.current[index] = el;
                }}
                onClick={() => navigateToExercise(index)}
                style={{
                  flex: '0 0 auto',
                  width: '100px',
                  height: '100px',
                  borderRadius: '16px',
                  border: `2px solid ${borderColor}`,
                  background: bgColor,
                  scrollSnapAlign: 'start',
                  cursor: 'pointer',
                  opacity: isActive || isFullyComplete ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px'
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  color: textColor,
                  fontWeight: '700',
                  textAlign: 'center',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.exercise.name}
                </div>
              </button>
            );
          })}
        </div>

      {/* Radial Timer & Controls */}
      {/* Radial Timer & Controls Carousel */}
      <div 
        ref={mainCarouselContainerRef}
        style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          margin: '0 -16px', 
          padding: '0 16px',
          scrollBehavior: 'smooth'
        }}
        className="hide-scrollbar"
      >
          {allExercises.map((carouselItem, idx) => {
            const isThisActive = idx === currentIndex;
            const itemTimeLeft = isThisActive ? timeLeft : (carouselItem.exercise.durationSeconds || 180);
            const itemProgressPercent = isThisActive ? progressPercent : 100;
            const itemIsResting = isThisActive ? isResting : false;

            return (
              <div 
                key={idx} 
                data-index={idx}
                ref={(el) => { mainCarouselItemRefs.current[idx] = el; }}
                style={{ 
                  flex: '0 0 100%', 
                  padding: '0 8px',
                  scrollSnapAlign: 'center',
                  pointerEvents: isThisActive ? 'auto' : 'none',
                  opacity: isThisActive ? 1 : 0.4,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
<div className="glass-panel" style={{
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
          }}>
            {/* Exercise Details (Name, Chips, Description) */}
            <div style={{ textAlign: 'left', width: '100%', marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>
                    {carouselItem.exercise.name}
                  </h2>
                  <button
                    onClick={() => setPreviewIndex(idx)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--accent-cyan)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Info size={18} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                    {carouselItem.exercise.repsOrTime}
                  </span>
                  {carouselItem.exercise.equipment && (
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                      {carouselItem.exercise.equipment}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '8px', lineHeight: 1.5 }}>
                {carouselItem.exercise.description}
              </p>
            </div>

            {/* Timer Row Wrapper */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              
              {/* SVG Circular Ring Timer */}
              <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                
                {/* -15s Button */}
                <button 
                  className="btn-secondary" 
                  onClick={() => handleAdjustRest(-15)} 
                  style={{ 
                    position: 'absolute',
                    top: '0',
                    left: '-40px',
                    zIndex: 10,
                    padding: '0 16px',
                    height: '48px',
                    borderRadius: '24px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  <Minus size={16} /> 15s
                </button>
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
                  stroke={itemIsResting ? '#00F0FF' : carouselItem.blockBadgeColor}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={628.3}
                  strokeDashoffset={628.3 - (628.3 * itemProgressPercent) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>

              {/* Center Time Display */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '3.6rem',
                  fontWeight: '900',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: itemIsResting ? '#00F0FF' : '#FFFFFF',
                  textShadow: itemIsResting ? '0 0 20px rgba(255, 107, 0, 0.5)' : '0 0 20px rgba(0, 240, 255, 0.4)'
                }}>
                  {formatTime(itemTimeLeft)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {itemIsResting ? 'Rest Remaining' : 'Target Interval'}
                </span>
              </div>

              {/* +15s Button */}
              <button 
                className="btn-secondary" 
                onClick={() => handleAdjustRest(15)} 
                style={{ 
                  position: 'absolute',
                  top: '0',
                  right: '-40px',
                  zIndex: 10,
                  padding: '0 16px',
                  height: '48px',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <Plus size={16} /> 15s
              </button>
              </div>
            </div>

          {/* Play / Pause Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', marginTop: '24px', gap: '16px' }}>
            
            {/* Left Column */}
            <div />

            {/* Center Column */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (!isIntervalStarted) {
                      // Start interval; also resume global if paused
                      setIntervalState({ isIntervalStarted: true });
                      if (isWorkoutPaused) onToggleWorkoutPause();
                    } else if (isIntervalPaused) {
                      // Resume local & global
                      setIntervalState({ isIntervalPaused: false });
                      if (isWorkoutPaused) onToggleWorkoutPause();
                    } else {
                      // Pause local & global
                      setIntervalState({ isIntervalPaused: true });
                      if (!isWorkoutPaused) onToggleWorkoutPause();
                    }
                  }}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    padding: 0,
                    justifyContent: 'center',
                    background: !isIntervalStarted
                      ? 'linear-gradient(135deg, #00F0FF 0%, #00F0FF 100%)'
                      : (isIntervalPaused || isWorkoutPaused)
                      ? 'linear-gradient(135deg, #00F0FF 0%, #00F0FF 100%)'
                      : 'linear-gradient(135deg, #00F0FF 0%, #00F0FF 100%)',
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
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              
              {/* Reset Button */}
              <button
                className="btn-secondary"
                onClick={() => {
                  setIntervalState({
                    isIntervalStarted: false,
                    isIntervalPaused: false,
                    timeOffset: 0
                  });
                  setTimeLeft(itemIsResting ? (carouselItem.exercise?.restSeconds || 30) : (carouselItem.exercise?.durationSeconds || 180));
                }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  opacity: !isIntervalStarted ? 0.3 : 1,
                  pointerEvents: !isIntervalStarted ? 'none' : 'auto',
                }}
                disabled={!isIntervalStarted}
                title="Reset Timer"
              >
                <RotateCcw size={20} color="var(--text-main)" />
              </button>

            </div>
          </div>
        </div>
{/* Interactive Set Tracker — own container */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Set Progress ({completedSets[carouselItem.exercise.id] || 0} / {carouselItem.exercise.sets} completed)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
            {Array.from({ length: carouselItem.exercise.sets }).map((_, setIdx) => {
              const setNum = setIdx + 1;
              const isDone = (completedSets[carouselItem.exercise.id] || 0) >= setNum;
              const isFullyComplete = (completedSets[carouselItem.exercise.id] || 0) >= carouselItem.exercise.sets;
              
              const borderColor = isFullyComplete ? '#00FF9D' : (isDone ? '#00F0FF' : 'var(--border-subtle)');
              const bgColor = isFullyComplete ? 'rgba(0, 255, 157, 0.15)' : (isDone ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)');
              const textColor = isFullyComplete ? '#00FF9D' : (isDone ? '#00F0FF' : 'var(--text-muted)');

              return (
                <button
                  key={setNum}
                  onClick={() => handleToggleSet(setNum)}
                  style={{
                    flex: '0 0 64px',
                    height: '52px',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    background: bgColor,
                    color: textColor,
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {setNum}
                </button>
              );
            })}
          </div>
        </div>

              </div>
            );
          })}

      {/* Globally Visible Shared Bottom Controls (Always visible on mobile across tabs) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        
        {/* Next Up Preview Teaser */}
        {nextItem && (
          <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>
                NEXT UP PREVIEW
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#FFFFFF', marginTop: '2px' }}>
                {nextItem.exercise.name}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--accent-cyan)' }}>
                {nextItem.exercise.repsOrTime}
              </span>
              {nextItem.exercise.equipment && (
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                  {nextItem.exercise.equipment}
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      </div>

      <Drawer isOpen={previewIndex !== null} onClose={() => setPreviewIndex(null)}>
        {previewIndex !== null && allExercises[previewIndex] && (
          <div style={{ padding: '24px 16px', paddingBottom: '40px' }}>
            <ExerciseInfoPanel 
              exercise={allExercises[previewIndex].exercise} 
              onPlayVideo={(url) => {
                onPlayVideo(url);
              }} 
            />
          </div>
        )}
      </Drawer>
    </div>
    </div>
  );
};

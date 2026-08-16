import React, { useState, useEffect, useRef } from 'react';
import type { WorkoutBlock, Exercise } from '../types/workout';
import { audio } from '../utils/audio';
import { Play, Pause, Info } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { Drawer } from './Drawer';
import { ExerciseInfoPanel } from './ExerciseInfoPanel';
import { TimerDrawer, type TimerType } from './TimerDrawer';
import { useTimerTicker } from '../hooks/useTimerTicker';

interface LivePlayerProps {
  blocks: WorkoutBlock[];
  onPlayVideo: (url: string) => void;
}

const TIMER_BUTTON_COLORS: Record<TimerType, string> = {
  work: '#00F0FF',
  rest: '#FFB300',
};

const TIMER_BUTTON_LABELS: Record<TimerType, string> = {
  work: 'Work',
  rest: 'Rest',
};

export const LivePlayer: React.FC<LivePlayerProps> = ({
  blocks,
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
    completedSets,
    timers,
    setCurrentIndex,
    updateCompletedSets,
  } = useWorkoutStore();

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [openTimer, setOpenTimer] = useState<{ exerciseId: string; type: TimerType } | null>(null);

  const currentItem = allExercises[currentIndex];
  const currentExercise = currentItem?.exercise;

  useTimerTicker(() => {
    audio.playStart();
  });

  const carouselRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainCarouselContainerRef = useRef<HTMLDivElement | null>(null);
  const mainCarouselItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbnailScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag-based carousel state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartTimeRef = useRef<number>(0);
  const containerWidthRef = useRef<number>(0);

  const handleDragStart = (clientX: number) => {
    setIsSnapping(false);
    setIsDragging(true);
    dragStartXRef.current = clientX;
    dragStartTimeRef.current = Date.now();
    if (mainCarouselContainerRef.current) {
      containerWidthRef.current = mainCarouselContainerRef.current.offsetWidth;
    }
  };

  const handleDragMove = (clientX: number) => {
    if (dragStartXRef.current === null) return;
    let delta = clientX - dragStartXRef.current;
    // Apply rubber-band resistance at edges
    if ((currentIndex === 0 && delta > 0) || (currentIndex === allExercises.length - 1 && delta < 0)) {
      delta = delta * 0.25;
    }
    setDragOffset(delta);
  };

  const handleDragEnd = () => {
    if (dragStartXRef.current === null) return;
    const elapsed = Date.now() - dragStartTimeRef.current;
    const velocity = Math.abs(dragOffset) / Math.max(elapsed, 1);
    const containerW = containerWidthRef.current || 1;
    const threshold = containerW * 0.2; // 20% of width to snap
    const velocityThreshold = 0.4; // px/ms — a fast flick

    dragStartXRef.current = null;
    setIsDragging(false);

    if ((Math.abs(dragOffset) > threshold || velocity > velocityThreshold) && dragOffset < 0 && currentIndex < allExercises.length - 1) {
      setIsSnapping(true);
      setDragOffset(0);
      navigateToExercise(currentIndex + 1);
    } else if ((Math.abs(dragOffset) > threshold || velocity > velocityThreshold) && dragOffset > 0 && currentIndex > 0) {
      setIsSnapping(true);
      setDragOffset(0);
      navigateToExercise(currentIndex - 1);
    } else {
      // Spring back
      setIsSnapping(true);
      setDragOffset(0);
    }
    // Clear snapping flag after transition
    setTimeout(() => setIsSnapping(false), 350);
  };

  // Touch handlers
  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };
  const handleCarouselTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };
  const handleCarouselTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse handlers (for desktop testing)
  const handleCarouselMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };
  const handleCarouselMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleDragMove(e.clientX);
  };
  const handleCarouselMouseUp = () => {
    if (!isDragging) return;
    handleDragEnd();
  };
  const handleCarouselMouseLeave = () => {
    if (!isDragging) return;
    handleDragEnd();
  };

  // On exercise change: scroll both carousels to the active item
  useEffect(() => {
    // Debounce thumbnail carousel scroll so rapid changes coalesce into one scroll
    if (thumbnailScrollTimeoutRef.current) {
      clearTimeout(thumbnailScrollTimeoutRef.current);
    }
    thumbnailScrollTimeoutRef.current = setTimeout(() => {
      const carouselBtn = carouselRefs.current[currentIndex];
      if (carouselBtn) {
        const container = carouselBtn.parentElement;
        if (container) {
          const scrollLeft = carouselBtn.offsetLeft - container.offsetWidth / 2 + carouselBtn.offsetWidth / 2;
          container.scrollTo?.({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }, 150);
  }, [currentIndex]);

  const navigateToExercise = (newIndex: number) => {
    setCurrentIndex(newIndex);
  };

  if (!currentExercise) return null;

  const handleToggleSet = (setNum: number) => {
    const exId = currentExercise.id;
    const currentCount = completedSets[exId] || 0;
    const newCount = setNum === currentCount ? setNum - 1 : setNum;
    updateCompletedSets(exId, newCount);
  };

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

      {/* Exercise Details Carousel */}
      <div
        ref={mainCarouselContainerRef}
        onTouchStart={handleCarouselTouchStart}
        onTouchMove={handleCarouselTouchMove}
        onTouchEnd={handleCarouselTouchEnd}
        onMouseDown={handleCarouselMouseDown}
        onMouseMove={handleCarouselMouseMove}
        onMouseUp={handleCarouselMouseUp}
        onMouseLeave={handleCarouselMouseLeave}
        style={{
          overflow: 'hidden',
          margin: '0 -16px',
          padding: '0 16px',
          touchAction: 'pan-y',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          width: '100%',
          transform: `translateX(calc(${-currentIndex * 100}% + ${dragOffset}px))`,
          transition: (!isDragging && isSnapping) ? 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          willChange: isDragging ? 'transform' : 'auto',
        }}>
          {allExercises.map((carouselItem, idx) => {
            const isThisActive = idx === currentIndex;
            const isNeighbor = Math.abs(idx - currentIndex) === 1;

            // Calculate dynamic opacity based on drag direction
            let itemOpacity = 0.4;
            if (isThisActive) {
              itemOpacity = isDragging ? Math.max(0.4, 1 - Math.abs(dragOffset) / (containerWidthRef.current || 400) * 0.6) : 1;
            } else if (isNeighbor && isDragging) {
              const towards = (dragOffset < 0 && idx === currentIndex + 1) || (dragOffset > 0 && idx === currentIndex - 1);
              if (towards) {
                itemOpacity = Math.min(1, 0.4 + Math.abs(dragOffset) / (containerWidthRef.current || 400) * 0.6);
              }
            }

            const exercise = carouselItem.exercise;
            const workTimer = timers[`${exercise.id}:work`];
            const restTimer = timers[`${exercise.id}:rest`];

            return (
              <div
                key={idx}
                data-index={idx}
                ref={(el) => { mainCarouselItemRefs.current[idx] = el; }}
                style={{
                  flex: '0 0 100%',
                  padding: '0 8px',
                  pointerEvents: isThisActive ? 'auto' : 'none',
                  opacity: itemOpacity,
                  transition: isDragging ? 'none' : 'opacity 0.3s ease',
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
                    {exercise.name}
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
                    {exercise.repsOrTime}
                  </span>
                  {exercise.equipment && (
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                      {exercise.equipment}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '8px', lineHeight: 1.5 }}>
                {exercise.description}
              </p>
            </div>

            {/* Interactive Set Tracker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Set Progress ({completedSets[exercise.id] || 0} / {exercise.sets} completed)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
                {Array.from({ length: exercise.sets }).map((_, setIdx) => {
                  const setNum = setIdx + 1;
                  const isDone = (completedSets[exercise.id] || 0) >= setNum;
                  const isFullyComplete = (completedSets[exercise.id] || 0) >= exercise.sets;

                  const borderColor = isFullyComplete ? '#00FF9D' : (isDone ? '#00F0FF' : 'var(--border-subtle)');
                  const bgColor = isFullyComplete ? 'rgba(0, 255, 157, 0.15)' : (isDone ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)');
                  const textColor = isFullyComplete ? '#00FF9D' : (isDone ? '#00F0FF' : 'var(--text-muted)');

                  return (
                    <button
                      key={setNum}
                      onClick={() => handleToggleSet(setNum)}
                      style={{
                        flex: '0 0 52px',
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

            {/* Work / Rest Timer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', width: '100%' }}>
              {exercise.workSeconds != null && (
                <TimerLaunchButton
                  type="work"
                  isActive={!!workTimer?.isStarted}
                  isPaused={!!workTimer?.isPaused}
                  remainingSeconds={workTimer?.remainingSeconds ?? exercise.workSeconds}
                  onClick={() => setOpenTimer({ exerciseId: exercise.id, type: 'work' })}
                />
              )}
              {exercise.restSeconds != null && (
                <TimerLaunchButton
                  type="rest"
                  isActive={!!restTimer?.isStarted}
                  isPaused={!!restTimer?.isPaused}
                  remainingSeconds={restTimer?.remainingSeconds ?? exercise.restSeconds}
                  onClick={() => setOpenTimer({ exerciseId: exercise.id, type: 'rest' })}
                />
              )}
            </div>
        </div>

              </div>
            );
          })}
        </div>
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

      {openTimer && (() => {
        const exercise = allExercises.find(item => item.exercise.id === openTimer.exerciseId)?.exercise;
        const configuredSeconds = openTimer.type === 'work' ? exercise?.workSeconds : exercise?.restSeconds;
        if (!exercise || configuredSeconds == null) return null;
        return (
          <TimerDrawer
            isOpen={true}
            onClose={() => setOpenTimer(null)}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            type={openTimer.type}
            configuredSeconds={configuredSeconds}
          />
        );
      })()}
    </div>
  );
};

const formatShortTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const TimerLaunchButton: React.FC<{
  type: TimerType;
  isActive: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  onClick: () => void;
}> = ({ type, isActive, isPaused, remainingSeconds, onClick }) => {
  const colorHex = TIMER_BUTTON_COLORS[type];
  const isRunning = isActive && !isPaused;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colorHex} 0%, ${colorHex} 100%)`,
        boxShadow: isRunning ? `0 0 25px ${colorHex}80` : `0 0 12px ${colorHex}40`,
      }}>
        {isRunning
          ? <Pause size={26} fill="#050B14" color="#050B14" />
          : <Play size={26} fill="#050B14" color="#050B14" style={{ marginLeft: '3px' }} />}
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: colorHex, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {TIMER_BUTTON_LABELS[type]}{isActive ? ` · ${formatShortTime(remainingSeconds)}` : ''}
      </span>
    </button>
  );
};

import React from 'react';
import { Settings } from 'lucide-react';
import { RoutineOverview } from './RoutineOverview';
import { DEFAULT_WORKOUT_BLOCKS } from '../data/workoutData';
import { useWorkoutStore } from '../store/workoutStore';

const allExercises = DEFAULT_WORKOUT_BLOCKS.flatMap(block => 
  block.exercises.map(ex => ({ exercise: ex }))
);

interface PreWorkoutDrawerProps {
  isWorkoutStarted: boolean;
  isWorkoutPaused: boolean;
  totalSecondsElapsed: number;
  onStart: () => void;
  onMenuClick: () => void;
  onPlayVideo: (url: string) => void;
}

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const PreWorkoutDrawer: React.FC<PreWorkoutDrawerProps> = ({
  isWorkoutStarted,
  isWorkoutPaused,
  totalSecondsElapsed,
  onStart,
  onMenuClick,
  onPlayVideo,
}) => {
  const currentIndex = useWorkoutStore((state) => state.currentIndex);
  const completedSets = useWorkoutStore((state) => state.completedSets);

  const activeExerciseId = isWorkoutStarted
    ? allExercises[currentIndex]?.exercise.id || null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Action Bar */}
      <div style={{ 
        padding: '16px', 
        display: 'flex', 
        gap: '12px',
      }}>
        <button
          onClick={onStart}
          className="btn-primary glow-cyan"
          style={{ 
            flex: 1, 
            padding: '16px', 
            fontSize: '1.1rem', 
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '8px',
            ...(isWorkoutStarted && isWorkoutPaused ? {
              background: '#FFB300',
              color: '#050B14',
              boxShadow: '0 0 20px rgba(255, 179, 0, 0.4)'
            } : {})
          }}
        >
          {!isWorkoutStarted && 'Start Workout'}
          {isWorkoutStarted && !isWorkoutPaused && (
            <>
              In Progress ({formatTime(totalSecondsElapsed)})
            </>
          )}
          {isWorkoutStarted && isWorkoutPaused && (
            <>
              Paused ({formatTime(totalSecondsElapsed)})
            </>
          )}
        </button>
        
        <button
          title="Menu"
          onClick={onMenuClick}
          disabled={!isWorkoutStarted}
          style={{
            width: '54px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !isWorkoutStarted ? 'not-allowed' : 'pointer',
            opacity: !isWorkoutStarted ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Condensed Blueprint */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
        <RoutineOverview 
          blocks={DEFAULT_WORKOUT_BLOCKS} 
          onPlayVideo={onPlayVideo} 
          isCondensed={true} 
          activeExerciseId={activeExerciseId}
          completedSetsMap={completedSets}
        />
      </div>
    </div>
  );
};

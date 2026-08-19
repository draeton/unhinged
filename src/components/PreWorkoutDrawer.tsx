import React, { useMemo } from 'react';
import { Settings, Play, Pause } from 'lucide-react';
import { RoutineOverview } from './RoutineOverview';
import type { ResolvedBlock } from '../types/program';
import { useWorkoutStore } from '../store/workoutStore';

interface PreWorkoutDrawerProps {
  blocks: ResolvedBlock[];
  programName?: string;
  activeProgramError?: string | null;
  onRetryActiveProgram?: () => void;
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
  blocks,
  programName,
  activeProgramError,
  onRetryActiveProgram,
  isWorkoutStarted,
  isWorkoutPaused,
  totalSecondsElapsed,
  onStart,
  onMenuClick,
  onPlayVideo,
}) => {
  const currentIndex = useWorkoutStore((state) => state.currentIndex);
  const completedSets = useWorkoutStore((state) => state.completedSets);

  const allExercises = useMemo(
    () => blocks.flatMap(block => block.exercises.map(ex => ({ exercise: ex }))),
    [blocks]
  );

  const hasProgram = blocks.length > 0;
  // Distinguish "still loading" from "failed to load" -- both look like "no program
  // yet" from the blocks array alone, but only one of them is worth retrying.
  const hasError = !hasProgram && !!activeProgramError;

  const activeExerciseId = isWorkoutStarted
    ? allExercises[currentIndex]?.exercise.id || null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title + Settings */}
      <div style={{
        padding: '16px 16px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}>
        {programName ? (
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>
            {programName}
          </h2>
        ) : <div />}

        <button
          title="Menu"
          onClick={onMenuClick}
          disabled={!isWorkoutStarted}
          style={{
            width: '44px',
            height: '44px',
            flexShrink: 0,
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
          <Settings size={22} />
        </button>
      </div>

      {/* Top Action Bar */}
      <div style={{ padding: '16px' }}>
        <button
          onClick={hasError && onRetryActiveProgram ? onRetryActiveProgram : onStart}
          disabled={!hasProgram && !isWorkoutStarted && !hasError}
          className="btn-primary glow-cyan"
          style={{
            padding: '16px 24px',
            fontSize: '1.1rem',
            fontWeight: '800',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '8px',
            ...(!hasProgram && !isWorkoutStarted && !hasError ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            ...(hasError ? { background: '#FF3366', boxShadow: '0 0 20px rgba(255, 51, 102, 0.4)' } : {}),
            ...(isWorkoutStarted && isWorkoutPaused ? {
              background: '#FFB300',
              color: '#050B14',
              boxShadow: '0 0 20px rgba(255, 179, 0, 0.4)'
            } : {})
          }}
        >
          {!isWorkoutStarted && !hasError && (hasProgram ? 'Start Workout' : 'Loading program...')}
          {!isWorkoutStarted && hasError && 'Couldn’t load your program — tap to retry'}
          {isWorkoutStarted && (
            <>
              {isWorkoutPaused ? <Pause size={18} fill="#050B14" /> : <Play size={18} fill="#050B14" style={{ marginLeft: '-2px' }} />}
              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {isWorkoutPaused ? 'Paused' : 'In Progress'} · {formatTime(totalSecondsElapsed)}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Condensed Blueprint */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
        <RoutineOverview
          blocks={blocks}
          programName={programName}
          onPlayVideo={onPlayVideo}
          isCondensed={true}
          activeExerciseId={activeExerciseId}
          completedSetsMap={completedSets}
        />
      </div>
    </div>
  );
};

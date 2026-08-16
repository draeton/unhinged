import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useWorkoutStore, type TimerRuntimeState } from '../store/workoutStore';
import { Drawer } from './Drawer';
import { RingTimer } from './RingTimer';

export type TimerType = 'work' | 'rest';

interface TimerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  type: TimerType;
  configuredSeconds: number;
}

// Hex literals (matching --accent-cyan / --accent-amber in index.css) so we can
// derive translucent glow colors below — CSS var() references can't be alpha-suffixed.
const TIMER_COLORS: Record<TimerType, string> = {
  work: '#00F0FF',
  rest: '#FFB300',
};

const TIMER_LABELS: Record<TimerType, string> = {
  work: 'Work Timer',
  rest: 'Rest Timer',
};

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const timerKeyFor = (exerciseId: string, type: TimerType) => `${exerciseId}:${type}`;

export function timerKey(exerciseId: string, type: TimerType) {
  return timerKeyFor(exerciseId, type);
}

export const TimerDrawer: React.FC<TimerDrawerProps> = ({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  type,
  configuredSeconds,
}) => {
  const key = timerKeyFor(exerciseId, type);
  const timer = useWorkoutStore((s) => s.timers[key]);
  const { startTimer, pauseTimer, resumeTimer, resetTimer } = useWorkoutStore();

  const effective: TimerRuntimeState = timer ?? {
    remainingSeconds: configuredSeconds,
    totalSeconds: configuredSeconds,
    isStarted: false,
    isPaused: false,
  };

  const colorHex = TIMER_COLORS[type];
  const progressPercent = effective.totalSeconds > 0
    ? ((effective.totalSeconds - effective.remainingSeconds) / effective.totalSeconds) * 100
    : 0;

  const handleTogglePlay = () => {
    if (!effective.isStarted) {
      startTimer(key, effective.totalSeconds);
    } else if (effective.isPaused) {
      resumeTimer(key);
    } else {
      pauseTimer(key);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FFFFFF' }}>{exerciseName}</div>
          <div style={{ fontSize: '0.85rem', color: colorHex, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginTop: '4px' }}>
            {TIMER_LABELS[type]}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RingTimer
            progressPercent={progressPercent}
            colorHex={colorHex}
            centerLabel={formatTime(effective.remainingSeconds)}
            centerSubLabel={effective.isStarted && !effective.isPaused ? 'Counting Down' : 'Ready'}
            animate={effective.isStarted && !effective.isPaused}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', gap: '16px' }}>
          <div />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              aria-label={!effective.isStarted ? 'Start Timer' : effective.isPaused ? 'Resume Timer' : 'Pause Timer'}
              onClick={handleTogglePlay}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                padding: 0,
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${colorHex} 0%, ${colorHex} 100%)`,
                boxShadow: `0 0 25px ${colorHex}80`,
              }}
            >
              {(!effective.isStarted || effective.isPaused)
                ? <Play size={28} fill="#050B14" style={{ marginLeft: '4px' }} />
                : <Pause size={28} fill="#050B14" />}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              className="btn-secondary"
              onClick={() => resetTimer(key)}
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
                opacity: !effective.isStarted ? 0.3 : 1,
                pointerEvents: !effective.isStarted ? 'none' : 'auto',
              }}
              disabled={!effective.isStarted}
              title="Reset Timer"
            >
              <RotateCcw size={20} color="var(--text-main)" />
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

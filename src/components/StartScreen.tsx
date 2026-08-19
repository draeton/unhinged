import React from 'react';
import { Play, ChevronRight, Pause, ListTree, Dumbbell } from 'lucide-react';
import type { CompletedWorkout } from '../types/workout';
import type { Program } from '../types/program';
import { CalendarWidget } from './CalendarWidget';

export type ScreenType = 'start' | 'player' | 'blueprint' | 'history';

interface StartScreenProps {
  programs: Program[];
  // The program the running/last-run workout belongs to -- null before a program has
  // ever loaded. Only meaningful while isWorkoutActive.
  activeProgramId: string | null;
  onSelectProgram: (programId: string) => void;
  onResumeActiveWorkout: () => void;
  onOpenPrograms: () => void;
  onOpenExerciseLibrary: () => void;
  onOpenCalendar: (dateStr?: string) => void;
  isWorkoutActive: boolean;
  isWorkoutPaused: boolean;
  totalSecondsElapsed: number;

  completedWorkouts: CompletedWorkout[];
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const StartScreen: React.FC<StartScreenProps> = ({
  programs,
  activeProgramId,
  onSelectProgram,
  onResumeActiveWorkout,
  onOpenPrograms,
  onOpenExerciseLibrary,
  onOpenCalendar,
  isWorkoutActive,
  isWorkoutPaused,
  totalSecondsElapsed,

  completedWorkouts,
}) => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

      <CalendarWidget
        completedWorkouts={completedWorkouts}
        onClick={onOpenCalendar}
      />

      {/* Main Navigation Hub Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

        {programs.length === 0 && (
          <div className="glass-panel" style={{ padding: '28px', gridColumn: '1 / -1', textAlign: 'center' }}>
            <p style={{ color: '#FFFFFF', fontWeight: '700' }}>No programs yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Create one from the menu to get started.
            </p>
          </div>
        )}

        {/* One card per program the user has created */}
        {programs.map(program => {
          const isThisActive = isWorkoutActive && program.id === activeProgramId;
          const isDisabled = isWorkoutActive && !isThisActive;

          return (
            <div
              key={program.id}
              onClick={isDisabled ? undefined : (isThisActive ? onResumeActiveWorkout : () => onSelectProgram(program.id))}
              className="glass-panel"
              style={{
                padding: '18px 20px',
                background: isThisActive
                  ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 255, 157, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(18, 24, 38, 0.9) 100%)',
                border: isThisActive ? '2px solid #00F0FF' : '1px solid rgba(0, 240, 255, 0.3)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.45 : 1,
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: isThisActive ? '0 0 30px rgba(0, 240, 255, 0.3)' : 'none',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                flexShrink: 0,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00F0FF 0%, #00F0FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#050B14',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
              }}>
                <Play size={16} fill="#050B14" style={{ marginLeft: '2px' }} />
              </div>

              <h3 style={{ flex: 1, fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF' }}>
                {program.name}
              </h3>

              <ChevronRight size={20} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            </div>
          );
        })}

      </div>

      {/* Manage programs / exercise library -- secondary/muted styling to read as
          management actions, distinct from the cyan workout-start cards above. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={onOpenPrograms}
          className="glass-panel"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'var(--font-main)',
          }}
        >
          <ListTree size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: '700', color: '#FFFFFF' }}>Programs</span>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        <button
          onClick={onOpenExerciseLibrary}
          className="glass-panel"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'var(--font-main)',
          }}
        >
          <Dumbbell size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: '700', color: '#FFFFFF' }}>Exercise Library</span>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>
      </div>

      {/* Floating "back to active workout" button -- always reachable regardless of
          scroll position, since the program-card grid above can scroll out of view. */}
      {isWorkoutActive && (
        <button
          onClick={onResumeActiveWorkout}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            width: 'max-content',
            whiteSpace: 'nowrap',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            background: isWorkoutPaused ? '#FFB300' : 'linear-gradient(135deg, #00F0FF 0%, #00F0FF 100%)',
            color: '#050B14',
            fontWeight: '800',
            fontSize: '1.1rem',
            boxShadow: isWorkoutPaused ? '0 4px 24px rgba(255, 179, 0, 0.5)' : '0 4px 24px rgba(0, 240, 255, 0.5)',
          }}
        >
          {isWorkoutPaused ? <Pause size={18} fill="#050B14" style={{ flexShrink: 0 }} /> : <Play size={18} fill="#050B14" style={{ marginLeft: '-2px', flexShrink: 0 }} />}
          <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {isWorkoutPaused ? 'Paused' : 'In Progress'} · {formatTime(totalSecondsElapsed)}
          </span>
        </button>
      )}

    </div>
  );
};

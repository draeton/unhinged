import React from 'react';
import { Play, ShieldAlert, ChevronRight, Pause } from 'lucide-react';
import type { CompletedWorkout } from '../types/workout';
import type { Program } from '../types/program';
import { CalendarWidget } from './CalendarWidget';

export type ScreenType = 'start' | 'player' | 'blueprint' | 'history' | 'guide';

interface StartScreenProps {
  onNavigate: (screen: ScreenType) => void;
  programs: Program[];
  // The program the running/last-run workout belongs to -- null before a program has
  // ever loaded. Only meaningful while isWorkoutActive.
  activeProgramId: string | null;
  onSelectProgram: (programId: string) => void;
  onResumeActiveWorkout: () => void;
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
  onNavigate,
  programs,
  activeProgramId,
  onSelectProgram,
  onResumeActiveWorkout,
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
                padding: '28px',
                background: isThisActive
                  ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 255, 157, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(18, 24, 38, 0.9) 100%)',
                border: isThisActive ? '2px solid #00F0FF' : '1px solid rgba(0, 240, 255, 0.3)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.45 : 1,
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: isThisActive ? '0 0 30px rgba(0, 240, 255, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #00F0FF 0%, #00F0FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#050B14',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
                }}>
                  <Play size={28} fill="#050B14" style={{ marginLeft: '3px' }} />
                </div>
                {isThisActive && (
                  <span className="badge" style={{
                    background: isWorkoutPaused ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                    border: isWorkoutPaused ? '1px solid #FFB300' : '1px solid #00F0FF',
                    color: isWorkoutPaused ? '#FFB300' : '#00F0FF',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isWorkoutPaused ? '#FFB300' : '#00F0FF',
                      boxShadow: isWorkoutPaused ? '0 0 8px rgba(255, 179, 0, 0.6)' : '0 0 8px rgba(0, 240, 255, 0.6)',
                    }} />
                    {isWorkoutPaused ? 'PAUSED' : 'IN PROGRESS'} <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>({formatTime(totalSecondsElapsed)})</span>
                  </span>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {program.name}
                  <ChevronRight size={20} color="var(--accent-cyan)" />
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                  {isThisActive
                    ? 'Resume your active session with live counting timer & auto set progression.'
                    : isDisabled
                      ? 'Finish or reset your current workout to switch programs.'
                      : (program.description || 'Start a guided workout with countdown timers, audio cues, and set tracking.')}
                </p>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                color: isDisabled ? 'var(--text-dim)' : '#00F0FF',
                marginTop: '8px',
              }}>
                {isThisActive ? 'Resume Active Session' : isDisabled ? 'Unavailable' : 'Start New Session'} →
              </div>
            </div>
          );
        })}

        {/* Form & Scapula Guide */}
        <div
          onClick={() => onNavigate('guide')}
          className="glass-panel"
          style={{
            padding: '28px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}>
            <ShieldAlert size={26} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Form & Scapula Guide
              <ChevronRight size={20} color="var(--text-muted)" />
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              Master left shoulder blade wrapping, handstand parallettes wrist relief, and Jefferson curl rules.
            </p>
          </div>

          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)' }}>
            Read Biomechanics →
          </div>
        </div>

      </div>

      {/* Floating "back to active workout" button -- always reachable regardless of
          scroll position, since the program-card grid above can scroll out of view. */}
      {isWorkoutActive && (
        <button
          onClick={onResumeActiveWorkout}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '20px',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            background: isWorkoutPaused ? '#FFB300' : 'linear-gradient(135deg, #00F0FF 0%, #00F0FF 100%)',
            color: '#050B14',
            fontWeight: '800',
            fontSize: '0.92rem',
            boxShadow: isWorkoutPaused ? '0 4px 24px rgba(255, 179, 0, 0.5)' : '0 4px 24px rgba(0, 240, 255, 0.5)',
          }}
        >
          {isWorkoutPaused ? <Pause size={18} fill="#050B14" /> : <Play size={18} fill="#050B14" style={{ marginLeft: '-2px' }} />}
          <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
            {isWorkoutPaused ? 'Paused' : 'In Progress'} · {formatTime(totalSecondsElapsed)}
          </span>
        </button>
      )}

    </div>
  );
};

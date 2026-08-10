import React from 'react';
import { Play, ClipboardList, History, ShieldAlert, ChevronRight } from 'lucide-react';

export type ScreenType = 'start' | 'player' | 'blueprint' | 'history' | 'guide';

interface StartScreenProps {
  onNavigate: (screen: ScreenType) => void;
  isWorkoutActive: boolean;
  isWorkoutPaused: boolean;
  totalSecondsElapsed: number;
  completedWorkoutsCount: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onNavigate,
  isWorkoutActive,
  isWorkoutPaused,
  totalSecondsElapsed,
  completedWorkoutsCount,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Main Navigation Hub Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: LIVE WORKOUT (Primary Action) */}
        <div
          onClick={() => onNavigate('player')}
          className="glass-panel"
          style={{
            padding: '28px',
            background: isWorkoutActive
              ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 255, 157, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(18, 24, 38, 0.9) 100%)',
            border: isWorkoutActive ? '2px solid #00F0FF' : '1px solid rgba(0, 240, 255, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: isWorkoutActive ? '0 0 30px rgba(0, 240, 255, 0.3)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00F0FF 0%, #00FF9D 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#050B14',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
            }}>
              <Play size={28} fill="#050B14" style={{ marginLeft: '3px' }} />
            </div>
            {isWorkoutActive && (
              <span className="badge" style={{ 
                background: isWorkoutPaused ? 'rgba(255, 107, 0, 0.2)' : 'rgba(0, 255, 157, 0.2)', 
                border: isWorkoutPaused ? '1px solid #FF6B00' : '1px solid #00FF9D',
                color: isWorkoutPaused ? '#FF6B00' : '#00FF9D',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isWorkoutPaused ? '#FF6B00' : '#00FF9D',
                  boxShadow: isWorkoutPaused ? '0 0 8px #FF6B00' : '0 0 8px #00FF9D',
                }} />
                {isWorkoutPaused ? 'PAUSED' : 'IN PROGRESS'} ({formatTime(totalSecondsElapsed)})
              </span>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Live Workout
              <ChevronRight size={20} color="var(--accent-cyan)" />
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              {isWorkoutActive
                ? 'Resume your active 60-minute session with live counting timer & auto set progression.'
                : 'Start a new guided 60-minute workout with countdown timers, audio cues, and set tracking.'}
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: '#00F0FF',
            marginTop: '8px',
          }}>
            {isWorkoutActive ? 'Resume Active Session' : 'Start New Session'} →
          </div>
        </div>

        {/* Card 2: PROGRAM BLUEPRINT */}
        <div
          onClick={() => onNavigate('blueprint')}
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
            <ClipboardList size={26} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Program Blueprint
              <ChevronRight size={20} color="var(--text-muted)" />
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              Review the full 4-block schedule, exercise descriptions, form cues, and rest times.
            </p>
          </div>

          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)' }}>
            Explore Blueprint →
          </div>
        </div>

        {/* Card 3: FORM & SCAPULA GUIDE */}
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
            border: '1px solid rgba(176, 38, 255, 0.3)',
          }}
        >
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(176, 38, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D8B4FE',
          }}>
            <ShieldAlert size={26} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Form & Scapula Guide
              <ChevronRight size={20} color="#D8B4FE" />
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              Master left shoulder blade wrapping, handstand parallettes wrist relief, and Jefferson curl rules.
            </p>
          </div>

          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#D8B4FE' }}>
            Read Biomechanics →
          </div>
        </div>

        {/* Card 4: LOGS & STATS */}
        <div
          onClick={() => onNavigate('history')}
          className="glass-panel"
          style={{
            padding: '28px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
          }}
        >
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(255, 215, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFD700',
          }}>
            <History size={26} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Logs & Stats
              <ChevronRight size={20} color="#FFD700" />
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              Track completed sessions, total minutes logged, set volumes, and personal exertion ratings.
            </p>
          </div>

          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#FFD700' }}>
            View Workout Logs ({completedWorkoutsCount}) →
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import type { ScreenType } from './StartScreen';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, CheckCircle } from 'lucide-react';

interface HeaderProps {
  onNavigate: (screen: ScreenType) => void;
  isWorkoutStarted: boolean;
  isWorkoutPaused: boolean;
  soundMuted: boolean;
  onToggleWorkoutPause: () => void;
  onCompleteWorkoutClick: () => void;
  onResetWorkoutClick: () => void;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  isWorkoutStarted,
  isWorkoutPaused,
  soundMuted,
  onToggleWorkoutPause,
  onCompleteWorkoutClick,
  onResetWorkoutClick,
  onToggleSound,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10, 13, 20, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 20px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        
        {/* Brand / Logo (Clicking returns home) */}
        <div
          onClick={() => onNavigate('start')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
            fontSize: '1.3rem',
            fontWeight: '900',
            color: '#00F0FF',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontSize: '1.4rem',
                fontWeight: '900',
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: '#FFFFFF'
              }}>
                UNHINGED
              </h1>
            </div>
          </div>
        </div>

        {/* Right Action Menu Group */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            title="Menu"
            onClick={() => setIsMenuOpen(p => !p)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              background: isMenuOpen ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: isMenuOpen ? '#00F0FF' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Settings size={22} />
          </button>

          {isMenuOpen && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '50px',
              right: 0,
              width: '220px',
              padding: '8px',
              background: 'rgba(14, 18, 28, 0.96)',
              border: '1px solid var(--border-glow)',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {isWorkoutStarted && (
                <>
                  <button
                    onClick={() => {
                      onToggleWorkoutPause();
                      setIsMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#FFFFFF',
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isWorkoutPaused ? <Play size={16} fill="#FFFFFF" color="#FFFFFF" /> : <Pause size={16} fill="#FFFFFF" color="#FFFFFF" />}
                    <span>{isWorkoutPaused ? 'Resume Workout' : 'Pause Workout'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onCompleteWorkoutClick();
                      setIsMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#FFFFFF',
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <CheckCircle size={16} fill="#FFFFFF" stroke="#050B14" />
                    <span>Complete Workout</span>
                  </button>

                  <button
                    onClick={() => {
                      onResetWorkoutClick();
                      setIsMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#FFFFFF',
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <RotateCcw size={16} color="#FFFFFF" />
                    <span>Reset Workout</span>
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                </>
              )}

              <button
                onClick={() => {
                  onToggleSound();
                  setIsMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: soundMuted ? 'var(--text-dim)' : 'var(--text-main)',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>{soundMuted ? 'Sound Off' : 'Sound On'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

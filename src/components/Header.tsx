import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, Menu, Home, ClipboardList, ShieldAlert, History, Activity, XIcon, Square } from 'lucide-react';
import type { ScreenType } from './StartScreen';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isWorkoutActive: boolean;
  isWorkoutPaused: boolean;
  onToggleWorkoutPause: () => void;
  onStopWorkout: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  isWorkoutActive,
  isWorkoutPaused,
  onToggleWorkoutPause,
  onStopWorkout,
  soundMuted,
  onToggleSound,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectNav = (screen: ScreenType) => {
    setIsMenuOpen(false);
    onNavigate(screen);
  };

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
            background: 'linear-gradient(135deg, #00F0FF 0%, #B026FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
            fontSize: '1.3rem',
            fontWeight: '900',
            color: '#050B14',
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
                background: 'linear-gradient(90deg, #FFFFFF 0%, #00F0FF 50%, #FF007A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                UNHINGED
              </h1>
            </div>
          </div>
        </div>

        {/* Right Action Menu Group */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          
          {/* Main Action Menu Trigger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="App Actions Menu"
            style={{
              background: isMenuOpen ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: isMenuOpen ? '1px solid #00F0FF' : '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '8px 16px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isMenuOpen ? '#00F0FF' : '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isMenuOpen ? '0 0 15px rgba(0, 240, 255, 0.3)' : 'none',
            }}
          >
            {isMenuOpen ? <XIcon size={18} /> : <Menu size={18} />}
            <span>Menu</span>
            {isWorkoutActive && (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isWorkoutPaused ? '#FF6B00' : '#00FF9D',
                boxShadow: isWorkoutPaused ? '0 0 8px #FF6B00' : '0 0 8px #00FF9D',
              }} />
            )}
          </button>

          {/* Action Menu Dropdown Popover */}
          {isMenuOpen && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '240px',
              padding: '8px',
              background: 'rgba(14, 18, 28, 0.96)',
              border: '1px solid var(--border-glow)',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 100,
            }}>
              
              {/* Live Workout actions */}
              {currentScreen === 'player' && (
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
                      background: isWorkoutPaused ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 107, 0, 0.15)',
                      color: isWorkoutPaused ? '#00F0FF' : '#FF6B00',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isWorkoutPaused ? <Play size={16} fill="#00F0FF" /> : <Pause size={16} fill="#FF6B00" />}
                    <span>{isWorkoutPaused ? 'Resume Workout' : 'Pause Workout'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onStopWorkout();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 0, 122, 0.3)',
                      background: 'rgba(255, 0, 122, 0.1)',
                      color: '#FF007A',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Square size={16} fill="#FF007A" />
                    <span>Stop Workout</span>
                  </button>
                </>
              )}

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

              {/* Navigation Links */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700', padding: '4px 10px' }}>
                Navigation
              </div>

              <button
                onClick={() => handleSelectNav('start')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentScreen === 'start' ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                  color: currentScreen === 'start' ? '#00F0FF' : 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Home size={15} />
                <span>Start Hub</span>
              </button>

              <button
                onClick={() => handleSelectNav('player')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentScreen === 'player' ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                  color: currentScreen === 'player' ? '#00F0FF' : 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Activity size={15} />
                <span>Live Workout</span>
              </button>

              <button
                onClick={() => handleSelectNav('blueprint')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentScreen === 'blueprint' ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                  color: currentScreen === 'blueprint' ? '#00F0FF' : 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ClipboardList size={15} />
                <span>Program Blueprint</span>
              </button>

              <button
                onClick={() => handleSelectNav('guide')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentScreen === 'guide' ? 'rgba(176, 38, 255, 0.15)' : 'transparent',
                  color: currentScreen === 'guide' ? '#D8B4FE' : 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ShieldAlert size={15} />
                <span>Form & Scapula Guide</span>
              </button>

              <button
                onClick={() => handleSelectNav('history')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentScreen === 'history' ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                  color: currentScreen === 'history' ? '#FFD700' : 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <History size={15} />
                <span>Logs & Stats</span>
              </button>

              {/* Audio Beeps Toggle — only on Live Workout */}
              {currentScreen === 'player' && (
                <>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
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
                    {soundMuted ? <VolumeX size={16} color="var(--text-dim)" /> : <Volume2 size={16} color="var(--accent-cyan)" />}
                    <span>{soundMuted ? 'Unmute Audio Beeps' : 'Mute Audio Beeps'}</span>
                  </button>
                </>
              )}


            </div>
          )}

        </div>

      </div>
    </header>
  );
};

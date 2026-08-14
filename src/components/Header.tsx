import React from 'react';
import type { ScreenType } from './StartScreen';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onNavigate: (screen: ScreenType) => void;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onMenuClick,
}) => {
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

        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            transition: 'background 0.2s ease',
          }}
        >
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
};

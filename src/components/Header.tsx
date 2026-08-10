import React from 'react';
import type { ScreenType } from './StartScreen';

interface HeaderProps {
  onNavigate: (screen: ScreenType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
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

      </div>
    </header>
  );
};

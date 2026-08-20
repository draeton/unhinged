import React from 'react';

// Placeholder shown in place of StartScreen while auth resolves and/or the program
// list is loading -- mirrors StartScreen's layout (calendar widget, program card grid,
// management buttons) so real content swaps in without a layout shift.
export const StartScreenSkeleton: React.FC = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Calendar widget placeholder */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ width: '160px', height: '18px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className="skeleton" style={{ width: '14px', height: '12px' }} />
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Program card placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel"
            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
            <div className="skeleton" style={{ flex: 1, height: '20px' }} />
          </div>
        ))}
      </div>

      {/* Manage programs / exercise library placeholders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="skeleton" style={{ width: '20px', height: '20px' }} />
          <div className="skeleton" style={{ width: '120px', height: '16px' }} />
        </div>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="skeleton" style={{ width: '20px', height: '20px' }} />
          <div className="skeleton" style={{ width: '160px', height: '16px' }} />
        </div>
      </div>

    </div>
  );
};

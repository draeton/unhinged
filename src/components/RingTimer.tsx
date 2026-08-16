import React from 'react';

interface RingTimerProps {
  progressPercent: number;
  colorHex: string;
  centerLabel: string;
  centerSubLabel: string;
  animate: boolean;
  sizePx?: number;
  strokeWidth?: number;
}

export const RingTimer: React.FC<RingTimerProps> = ({
  progressPercent,
  colorHex,
  centerLabel,
  centerSubLabel,
  animate,
  sizePx = 240,
  strokeWidth = 12,
}) => {
  const radius = (sizePx - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = sizePx / 2;
  const clampedPercent = Math.max(0, Math.min(100, progressPercent));

  return (
    <div style={{ position: 'relative', width: `${sizePx}px`, height: `${sizePx}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={sizePx} height={sizePx} viewBox={`0 0 ${sizePx} ${sizePx}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colorHex}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * clampedPercent) / 100}
          strokeLinecap="round"
          style={{ transition: animate ? 'stroke-dashoffset 0.5s ease' : 'none' }}
        />
      </svg>

      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '3.6rem',
          fontWeight: '900',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: '#FFFFFF',
          textShadow: `0 0 20px ${colorHex}66`,
        }}>
          {centerLabel}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {centerSubLabel}
        </span>
      </div>
    </div>
  );
};

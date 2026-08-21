import React, { useRef, useState } from 'react';

interface NumberReelProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  compact?: boolean;
  step?: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/**
 * Drag-to-change numeric picker: dragging up increases the value, dragging down decreases it,
 * like scrolling a slot-machine reel. Arrow keys (up/right = increase, down/left = decrease)
 * and Home/End are also supported.
 */
export const NumberReel: React.FC<NumberReelProps> = ({ value, min, max, onChange, label, compact = false, step = 1 }) => {
  const itemHeight = compact ? 32 : 40;
  const [dragging, setDragging] = useState(false);
  const [offsetPx, setOffsetPx] = useState(0);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);
  const lastValueRef = useRef(value);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    lastValueRef.current = value;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    // deltaY is the raw physical drag distance (positive = finger moved down). Since dragging up
    // increases the value, the value change is the negation of the physical step count, in units
    // of `step`.
    const deltaY = e.clientY - startYRef.current;
    const rawSteps = deltaY / itemHeight;
    const boundedSteps = clamp(rawSteps, (startValueRef.current - max) / step, (startValueRef.current - min) / step);
    const steppedDelta = Math.trunc(boundedSteps);
    const fractional = boundedSteps - steppedDelta;
    const nextValue = clamp(startValueRef.current - steppedDelta * step, min, max);
    if (nextValue !== lastValueRef.current) {
      lastValueRef.current = nextValue;
      onChange(nextValue);
    }
    // The visual offset tracks the physical drag direction, so content still follows the finger.
    setOffsetPx(fractional * itemHeight);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
    setOffsetPx(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(clamp(value + step, min, max));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(clamp(value - step, min, max));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  // Revealed by dragging down (decrease) vs. up (increase) — content follows the finger, so the
  // row physically above the center is the *lower* neighbor and vice versa.
  const above = value - step >= min ? value - step : null;
  const below = value + step <= max ? value + step : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <span style={{ fontSize: compact ? '0.72rem' : '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
      <div
        role="spinbutton"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          height: `${itemHeight}px`,
          overflow: 'hidden',
          borderRadius: compact ? '8px' : '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            transform: `translateY(${-itemHeight + offsetPx}px)`,
            transition: dragging ? 'none' : 'transform 180ms ease-out',
          }}
        >
          <div
            style={{
              height: `${itemHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: compact ? '0.8rem' : '0.95rem',
              color: 'var(--text-dim)',
              opacity: above === null ? 0 : 0.5,
            }}
          >
            {above ?? ''}
          </div>
          <div
            style={{
              height: `${itemHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: compact ? '0.95rem' : '1.15rem',
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            {value}
          </div>
          <div
            style={{
              height: `${itemHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: compact ? '0.8rem' : '0.95rem',
              color: 'var(--text-dim)',
              opacity: below === null ? 0 : 0.5,
            }}
          >
            {below ?? ''}
          </div>
        </div>
      </div>
    </div>
  );
};

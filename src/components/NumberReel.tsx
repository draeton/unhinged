import React, { useRef, useState } from 'react';

interface NumberReelProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  compact?: boolean;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/**
 * Drag-to-change numeric picker: dragging down increases the value, dragging up decreases it,
 * like scrolling a slot-machine reel. Arrow keys are also supported (up/right = increase,
 * down/left = decrease) since that direction is the accessible/keyboard convention regardless
 * of the drag orientation.
 */
export const NumberReel: React.FC<NumberReelProps> = ({ value, min, max, onChange, label, compact = false }) => {
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
    const deltaY = e.clientY - startYRef.current;
    const rawSteps = deltaY / itemHeight;
    const boundedSteps = clamp(rawSteps, min - startValueRef.current, max - startValueRef.current);
    const steppedDelta = Math.trunc(boundedSteps);
    const fractional = boundedSteps - steppedDelta;
    const nextValue = clamp(startValueRef.current + steppedDelta, min, max);
    if (nextValue !== lastValueRef.current) {
      lastValueRef.current = nextValue;
      onChange(nextValue);
    }
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
      onChange(clamp(value + 1, min, max));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(clamp(value - 1, min, max));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  const above = value + 1 <= max ? value + 1 : null;
  const below = value - 1 >= min ? value - 1 : null;

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

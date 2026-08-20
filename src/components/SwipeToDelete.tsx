import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}

const ACTION_WIDTH = 84;
const DRAG_THRESHOLD = 10;
// However rounded a row's own corner gets (glass-panel uses 16px, HistoryStats' rows use 12px),
// this covers it -- the backdrop needs to extend at least that far past the row's flat edge or
// the row's corner curve exposes bare page background instead of red in the notch it carves out.
const CORNER_BACKDROP_MARGIN = 24;

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({ onDelete, children, ariaLabel, disabled }) => {
  const [translateX, setTranslateX] = useState(0);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef<{ startX: number; startY: number; baseX: number; recognized: boolean } | null>(null);
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = () => {
    setOpen(false);
    setTranslateX(0);
  };

  React.useEffect(() => {
    if (!open) return;
    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    window.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [open]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: open ? -ACTION_WIDTH : 0, recognized: false };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.recognized) {
      if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
      drag.recognized = true;
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    const next = Math.min(0, Math.max(-ACTION_WIDTH, drag.baseX + dx));
    didDragRef.current = true;
    setTranslateX(next);
  };

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    if (drag.recognized) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      const shouldOpen = translateX < -ACTION_WIDTH / 2;
      setOpen(shouldOpen);
      setTranslateX(shouldOpen ? -ACTION_WIDTH : 0);
    }
    setIsDragging(false);
    dragState.current = null;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didDragRef.current = false;
    }
  };

  const revealWidth = Math.min(ACTION_WIDTH, -translateX);
  // Extend past the visible reveal so the backdrop still sits behind the row's own rounded
  // corner as it slides away, instead of stopping at a hard edge the curve exposes bare
  // background through. Zero unless actually revealed, so nothing renders (and nothing can
  // bleed through a translucent row) at rest.
  const backdropWidth = revealWidth > 0 ? revealWidth + CORNER_BACKDROP_MARGIN : 0;

  return (
    <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${backdropWidth}px`,
          // The fill lives here, not just on the button below -- the backdrop is wider than
          // the button (by CORNER_BACKDROP_MARGIN) so it still backs the row's rounded corner.
          background: '#FF3366',
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'width 0.2s ease',
        }}
      >
        <button
          onClick={onDelete}
          aria-label={ariaLabel}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${ACTION_WIDTH}px`,
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Trash2 size={18} />
          <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Delete</span>
        </button>
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
};

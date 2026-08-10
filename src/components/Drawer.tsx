import React, { useState, useEffect } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children }) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent iOS Safari background scrolling
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only track if touching the drag handle area to allow scrolling inside
    const target = e.target as HTMLElement;
    if (target.closest('.drawer-drag-handle')) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY !== null) {
      const y = e.touches[0].clientY;
      if (y > startY) {
        setCurrentY(y - startY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentY !== null && currentY > 100) {
      onClose();
    }
    setStartY(null);
    setCurrentY(null);
  };

  const transformY = isOpen ? (currentY !== null ? `${currentY}px` : '0') : '100%';

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          zIndex: 998
        }} 
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '95vh',
          background: 'var(--bg-dark)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -4px 24px rgba(0,240,255,0.1)',
          transform: `translateY(${transformY})`,
          transition: currentY !== null ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div 
          className="drawer-drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 0', cursor: 'grab' }}
        >
          <div style={{ width: '48px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
          {children}
        </div>
      </div>
    </>
  );
};

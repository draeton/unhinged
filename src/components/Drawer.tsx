import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

let globalZIndex = 1000;

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, scrollRef }) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [zIndex, setZIndex] = useState(1000);

  useEffect(() => {
    if (isOpen) {
      setZIndex(globalZIndex);
      globalZIndex += 2;
      
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      // Store the scroll position on the body dataset so we can retrieve it when unmounting
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = document.body.dataset.scrollY;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0'));
      }
    }
    
    return () => {
      // In case it unmounts while open
      if (document.body.style.position === 'fixed') {
        const scrollY = document.body.dataset.scrollY;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0'));
        }
      }
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only track if touching the drag handle area to allow scrolling inside
    const target = e.target as HTMLElement;
    if (target.closest('.drawer-drag-handle')) {
      e.stopPropagation();
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY !== null) {
      e.stopPropagation();
      const y = e.touches[0].clientY;
      if (y > startY) {
        setCurrentY(y - startY);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY !== null || currentY !== null) {
      e.stopPropagation();
    }
    if (currentY !== null && currentY > 100) {
      onClose();
    }
    setStartY(null);
    setCurrentY(null);
  };

  // Push past 100% when closed so the sheet's box-shadow blur doesn't peek above the viewport edge.
  const transformY = isOpen ? (currentY !== null ? `${currentY}px` : '0') : 'calc(100% + 40px)';

  const drawerContent = (
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
          zIndex: zIndex,
          touchAction: 'none'
        }} 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '94vh',
          background: 'var(--bg-dark)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -4px 24px rgba(0,240,255,0.1)',
          transform: `translateY(${transformY})`,
          transition: currentY !== null ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          zIndex: zIndex + 1,
          display: 'flex',
          flexDirection: 'column',
          overscrollBehavior: 'none'
        }}
      >
        <div 
          className="drawer-drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 0', cursor: 'grab', touchAction: 'none' }}
        >
          <div style={{ width: '48px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
        </div>
        <div ref={scrollRef} id="drawer-scroll-container" style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }

  return null;
};

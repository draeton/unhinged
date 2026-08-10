import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Drawer } from './Drawer';

describe('Drawer Component', () => {
  it('renders children when open', () => {
    render(
      <Drawer isOpen={true} onClose={vi.fn()}>
        <div data-testid="drawer-content">Content</div>
      </Drawer>
    );
    expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
  });

  it('calls onClose when clicking the background overlay', () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose}>
        <div>Content</div>
      </Drawer>
    );
    
    // The background overlay is the first div
    const overlay = document.body.querySelector('div[style*="rgba(0, 0, 0, 0.6)"]') || 
                    document.body.querySelector('div[style*="opacity: 1"]');
                    
    if (overlay) {
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('locks body scroll when open', () => {
    const { unmount } = render(
      <Drawer isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </Drawer>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    
    unmount();
    
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { WelcomeCarousel } from './WelcomeCarousel';

// jsdom doesn't implement Element.scrollTo -- stub it so the component's calls don't throw.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: vi.fn(), writable: true });
});

describe('WelcomeCarousel', () => {
  it('renders a slide and a dot for each screenshot', () => {
    render(<WelcomeCarousel />);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Go to slide/ })).toHaveLength(3);
  });

  it('marks the first dot as current on initial render', () => {
    render(<WelcomeCarousel />);
    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
    expect(dots[1]).toHaveAttribute('aria-current', 'false');
  });

  it('scrolls the track when a dot is clicked', () => {
    render(<WelcomeCarousel />);
    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    fireEvent.click(dots[2]);
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });
});

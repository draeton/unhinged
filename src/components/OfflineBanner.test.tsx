import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { OfflineBanner } from './OfflineBanner';

const setNavigatorOnLine = (value: boolean) => {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true, writable: true });
};

describe('OfflineBanner', () => {
  afterEach(() => {
    setNavigatorOnLine(true);
  });

  it('renders nothing while online', () => {
    setNavigatorOnLine(true);
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the offline notice while offline', () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i);
  });

  it('disappears again once connectivity returns', () => {
    setNavigatorOnLine(false);
    const { container } = render(<OfflineBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(container).toBeEmptyDOMElement();
  });
});

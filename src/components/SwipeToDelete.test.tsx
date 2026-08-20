import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { SwipeToDelete } from './SwipeToDelete';

// jsdom doesn't implement pointer capture -- stub it so the component's calls don't throw.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: vi.fn(), writable: true });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { value: vi.fn(), writable: true });
});

const swipeLeft = (content: HTMLElement, dx: number, dy = 0) => {
  fireEvent.pointerDown(content, { clientX: 200, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(content, { clientX: 200 + dx, clientY: 100 + dy, pointerId: 1 });
  fireEvent.pointerUp(content, { clientX: 200 + dx, clientY: 100 + dy, pointerId: 1 });
};

describe('SwipeToDelete', () => {
  it('renders children', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()} ariaLabel="Delete row">
        <div data-testid="row-content">Row</div>
      </SwipeToDelete>
    );
    expect(screen.getByTestId('row-content')).toBeInTheDocument();
  });

  it('reveals the delete button after a leftward swipe past the threshold, and clicking it calls onDelete', () => {
    const onDelete = vi.fn();
    render(
      <SwipeToDelete onDelete={onDelete} ariaLabel="Delete row">
        <div data-testid="row-content">Row</div>
      </SwipeToDelete>
    );

    swipeLeft(screen.getByTestId('row-content'), -60);

    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not reveal the delete button for a mostly-vertical drag', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()} ariaLabel="Delete row">
        <div data-testid="row-content">Row</div>
      </SwipeToDelete>
    );

    swipeLeft(screen.getByTestId('row-content'), -15, -60);

    const content = screen.getByTestId('row-content').parentElement as HTMLElement;
    expect(content.style.transform).toBe('translateX(0px)');
  });

  it('swallows the click on children after a real drag so the row does not also trigger its own onClick', () => {
    const rowClick = vi.fn();
    render(
      <SwipeToDelete onDelete={vi.fn()} ariaLabel="Delete row">
        <div data-testid="row-content" onClick={rowClick}>Row</div>
      </SwipeToDelete>
    );

    const content = screen.getByTestId('row-content');
    fireEvent.pointerDown(content, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(content, { clientX: 160, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(content, { clientX: 160, clientY: 100, pointerId: 1 });
    fireEvent.click(content);

    expect(rowClick).not.toHaveBeenCalled();
  });
});

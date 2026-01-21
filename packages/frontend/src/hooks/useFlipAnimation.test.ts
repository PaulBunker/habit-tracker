import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFlipAnimation } from './useFlipAnimation';
import type { RefObject } from 'react';

describe('useFlipAnimation', () => {
  let mockElement: HTMLDivElement;
  let mockRef: RefObject<HTMLDivElement>;
  let rafCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    // Create mock element with getBoundingClientRect
    mockElement = document.createElement('div');
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 100,
      width: 500,
      height: 400,
      right: 600,
      bottom: 500,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    mockRef = { current: mockElement };

    // Mock requestAnimationFrame
    rafCallback = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    // Mock matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns isAnimating false when sourceRect is null', () => {
    const { result } = renderHook(() =>
      useFlipAnimation(mockRef, { sourceRect: null })
    );

    expect(result.current.isAnimating).toBe(false);
  });

  it('returns isAnimating true when animation starts', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    const { result } = renderHook(() =>
      useFlipAnimation(mockRef, { sourceRect })
    );

    expect(result.current.isAnimating).toBe(true);
  });

  it('calculates correct translate transform', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    // deltaX = 50 - 100 = -50, deltaY = 50 - 100 = -50
    expect(mockElement.style.transform).toContain('translate(-50px, -50px)');
  });

  it('applies clip-path to clip modal to source size', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    // Modal is 500x400, source is 200x100
    // clipRight = 500 - 200 = 300, clipBottom = 400 - 100 = 300
    expect(mockElement.style.clipPath).toContain('inset(0px 300px 300px 0px');
  });

  it('applies will-change during animation', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    expect(mockElement.style.willChange).toBe('transform, clip-path');
  });

  it('respects custom duration', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() =>
      useFlipAnimation(mockRef, { sourceRect, duration: 500 })
    );

    // Trigger the double RAF callback
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }

    expect(mockElement.style.transition).toContain('500ms');
  });

  it('respects custom easing', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);
    const customEasing = 'ease-in-out';

    renderHook(() =>
      useFlipAnimation(mockRef, { sourceRect, easing: customEasing })
    );

    // Trigger the double RAF callback
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }

    expect(mockElement.style.transition).toContain(customEasing);
  });

  it('skips animation when prefers-reduced-motion is set', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const sourceRect = new DOMRect(50, 50, 200, 100);

    const { result } = renderHook(() =>
      useFlipAnimation(mockRef, { sourceRect })
    );

    // Should not animate when reduced motion is preferred
    expect(result.current.isAnimating).toBe(false);
  });

  it('cleans up styles after animation completes', async () => {
    vi.useFakeTimers();
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    // Trigger the double RAF callback
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }

    // Fast-forward past the default animation duration (450ms) + buffer (50ms)
    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(mockElement.style.willChange).toBe('');
    expect(mockElement.style.clipPath).toBe('');

    vi.useRealTimers();
  });

  it('handles null ref gracefully', () => {
    const nullRef: RefObject<HTMLDivElement> = { current: null };
    const sourceRect = new DOMRect(50, 50, 200, 100);

    const { result } = renderHook(() =>
      useFlipAnimation(nullRef, { sourceRect })
    );

    // Should not crash, isAnimating should be false
    expect(result.current.isAnimating).toBe(false);
  });

  it('animates to final state with transform none and clip-path inset 0', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    // Trigger the double RAF callback
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }

    expect(mockElement.style.transform).toBe('none');
    expect(mockElement.style.clipPath).toContain('inset(0');
  });
});

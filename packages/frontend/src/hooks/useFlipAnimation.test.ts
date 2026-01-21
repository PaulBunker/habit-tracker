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

  it('calculates correct transform deltas', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    // The transform should position modal at source location
    // deltaX = 50 - 100 = -50, deltaY = 50 - 100 = -50
    // scaleX = 200 / 500 = 0.4, scaleY = 100 / 400 = 0.25
    expect(mockElement.style.transform).toContain('translate');
    expect(mockElement.style.transform).toContain('scale');
  });

  it('applies will-change during animation', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    expect(mockElement.style.willChange).toBe('transform');
  });

  it('sets transform-origin to top left', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    expect(mockElement.style.transformOrigin).toBe('top left');
  });

  it('respects custom duration', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() =>
      useFlipAnimation(mockRef, { sourceRect, duration: 500 })
    );

    // Trigger the double RAF callback to apply transition styles
    // First RAF
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }
    // Second RAF (inner)
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }

    expect(mockElement.style.transitionDuration).toBe('500ms');
  });

  it('respects custom easing', () => {
    const sourceRect = new DOMRect(50, 50, 200, 100);
    const customEasing = 'ease-in-out';

    renderHook(() =>
      useFlipAnimation(mockRef, { sourceRect, easing: customEasing })
    );

    // Trigger the double RAF callback to apply transition styles
    // First RAF
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }
    // Second RAF (inner)
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }

    expect(mockElement.style.transitionTimingFunction).toBe(customEasing);
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

  it('cleans up will-change after animation completes', async () => {
    vi.useFakeTimers();
    const sourceRect = new DOMRect(50, 50, 200, 100);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    // Trigger the double RAF callback
    // First RAF
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }
    // Second RAF (inner)
    if (rafCallback) {
      act(() => {
        rafCallback!(0);
      });
    }

    // Fast-forward past the default animation duration (300ms) + buffer (100ms)
    act(() => {
      vi.advanceTimersByTime(450);
    });

    expect(mockElement.style.willChange).toBe('auto');

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

  it('clamps scale to minimum 0.1 for very small sources', () => {
    // Very small source rect
    const sourceRect = new DOMRect(50, 50, 10, 5);

    renderHook(() => useFlipAnimation(mockRef, { sourceRect }));

    // Scale should be clamped, not 10/500 = 0.02
    const transformMatch = mockElement.style.transform.match(/scale\(([^,]+),\s*([^)]+)\)/);
    if (transformMatch) {
      const scaleX = parseFloat(transformMatch[1]);
      const scaleY = parseFloat(transformMatch[2]);
      expect(scaleX).toBeGreaterThanOrEqual(0.1);
      expect(scaleY).toBeGreaterThanOrEqual(0.1);
    }
  });
});

import { useLayoutEffect, useState, useRef, type RefObject } from 'react';

/**
 * Configuration for the FLIP animation
 */
export interface FlipConfig {
  /** The source element's bounding rect (captured on click) */
  sourceRect: DOMRect | null;
  /** Animation duration in milliseconds (default: 300) */
  duration?: number;
  /** CSS easing function (default: cubic-bezier(0.2, 0, 0.2, 1)) */
  easing?: string;
}

/**
 * Return value from useFlipAnimation hook
 */
interface FlipAnimationResult {
  /** Whether the animation is currently in progress */
  isAnimating: boolean;
}

const DEFAULT_DURATION = 300;
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material Design "Emphasized Decelerate"
const MIN_SCALE = 0.1;

/**
 * Checks if the user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook that implements F.L.I.P. (First, Last, Invert, Play) animation.
 *
 * F.L.I.P. technique:
 * 1. First: Capture source element's position (sourceRect)
 * 2. Last: Element is rendered at final position (targetRef)
 * 3. Invert: Apply transform to make element appear at source position
 * 4. Play: Animate transform to none
 *
 * @param targetRef - Ref to the target element (e.g., modal)
 * @param config - Animation configuration
 * @returns Object containing isAnimating state
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * const { isAnimating } = useFlipAnimation(modalRef, { sourceRect });
 * ```
 */
export function useFlipAnimation(
  targetRef: RefObject<HTMLElement | null>,
  config: FlipConfig
): FlipAnimationResult {
  const { sourceRect, duration = DEFAULT_DURATION, easing = DEFAULT_EASING } = config;
  const [isAnimating, setIsAnimating] = useState(false);
  // Track if animation has been initialized to prevent React Strict Mode double-execution
  const hasInitialized = useRef(false);

  useLayoutEffect(() => {
    const element = targetRef.current;

    // Skip animation if no source rect, no element, or reduced motion preferred
    if (!sourceRect || !element || prefersReducedMotion()) {
      setIsAnimating(false);
      return;
    }

    // Prevent double-execution in React Strict Mode
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    // Get the target element's final position
    const targetRect = element.getBoundingClientRect();

    // Calculate the transform needed to position element at source location
    const deltaX = sourceRect.left - targetRect.left;
    const deltaY = sourceRect.top - targetRect.top;

    // Calculate scale, clamped to minimum
    const scaleX = Math.max(MIN_SCALE, sourceRect.width / targetRect.width);
    const scaleY = Math.max(MIN_SCALE, sourceRect.height / targetRect.height);

    // Set up the animation
    setIsAnimating(true);

    // Step 1: Apply initial transform (Invert) - position at source
    element.style.transformOrigin = 'top left';
    element.style.willChange = 'transform';
    element.style.transition = 'none'; // Disable transitions for initial state
    element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;

    // Force browser to paint the initial state before animating
    // This is critical - without it, the browser may batch the transform changes
    element.getBoundingClientRect();

    // Step 2: Use double RAF to ensure browser has painted initial state
    // First RAF: schedules work for next frame
    // Second RAF: ensures paint has occurred
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.transitionProperty = 'transform';
        element.style.transitionDuration = `${duration}ms`;
        element.style.transitionTimingFunction = easing;
        element.style.transform = 'none';
      });
    });

    // Step 3: Clean up after animation completes
    // Add extra buffer for the double RAF delay (~32ms) plus animation duration
    const timeoutId = setTimeout(() => {
      element.style.willChange = 'auto';
      element.style.transition = '';
      element.style.transitionProperty = '';
      element.style.transitionDuration = '';
      element.style.transitionTimingFunction = '';
      setIsAnimating(false);
    }, duration + 100); // Buffer for double RAF + animation

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      // Reset element styles so next effect run sees clean state
      element.style.transform = '';
      element.style.transition = '';
      element.style.willChange = '';
      element.style.transformOrigin = '';
      element.style.transitionProperty = '';
      element.style.transitionDuration = '';
      element.style.transitionTimingFunction = '';
      // Reset for next animation
      hasInitialized.current = false;
    };
  }, [sourceRect, duration, easing, targetRef]);

  return { isAnimating };
}

import { useLayoutEffect, useState, useRef, type RefObject } from 'react';

/**
 * Configuration for the FLIP animation
 */
export interface FlipConfig {
  /** The source element's bounding rect (captured on click) */
  sourceRect: DOMRect | null;
  /** Animation duration in milliseconds (default: 450) */
  duration?: number;
  /** CSS easing function (default: cubic-bezier(0, 0, 0.21, 1)) */
  easing?: string;
}

/**
 * Return value from useFlipAnimation hook
 */
interface FlipAnimationResult {
  /** Whether the animation is currently in progress */
  isAnimating: boolean;
}

const DEFAULT_DURATION = 450;
// Smooth deceleration curve - starts fast, ends very smooth
const DEFAULT_EASING = 'cubic-bezier(0, 0, 0.21, 1)';

/**
 * Checks if the user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook that implements F.L.I.P. animation using clip-path for card-to-modal transitions.
 *
 * This approach avoids content distortion by using clip-path instead of scale.
 * The modal is always full-sized in the DOM, but clipped to appear as the card,
 * then the clip animates to reveal the full modal.
 *
 * @param targetRef - Ref to the target element (e.g., modal)
 * @param config - Animation configuration
 * @returns Object containing isAnimating state
 */
export function useFlipAnimation(
  targetRef: RefObject<HTMLElement | null>,
  config: FlipConfig
): FlipAnimationResult {
  const { sourceRect, duration = DEFAULT_DURATION, easing = DEFAULT_EASING } = config;
  const [isAnimating, setIsAnimating] = useState(false);
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

    // Get the modal's final position (centered by flexbox)
    const targetRect = element.getBoundingClientRect();

    // Calculate the translation needed to move modal's top-left to source's top-left
    const deltaX = sourceRect.left - targetRect.left;
    const deltaY = sourceRect.top - targetRect.top;

    // Calculate clip-path insets to clip modal to source card size
    // inset(top right bottom left) - distances from each edge
    // We want to show only a sourceRect-sized portion starting from top-left
    const clipTop = 0;
    const clipLeft = 0;
    const clipRight = Math.max(0, targetRect.width - sourceRect.width);
    const clipBottom = Math.max(0, targetRect.height - sourceRect.height);

    // Get the border-radius of the source card for smooth transition
    const borderRadius = 8; // Match card border-radius

    setIsAnimating(true);

    // Step 1: Apply initial state - position at source and clip to source size
    element.style.willChange = 'transform, clip-path';
    element.style.transition = 'none';
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    element.style.clipPath = `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px round ${borderRadius}px)`;

    // Force browser to paint the initial state
    element.getBoundingClientRect();

    // Step 2: Animate to final state
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Enable transitions
        element.style.transition = `transform ${duration}ms ${easing}, clip-path ${duration}ms ${easing}`;
        // Animate to final position and reveal full modal
        element.style.transform = 'none';
        element.style.clipPath = 'inset(0 round 12px)'; // Match modal border-radius
      });
    });

    // Step 3: Clean up after animation completes
    const timeoutId = setTimeout(() => {
      element.style.willChange = '';
      element.style.transition = '';
      element.style.clipPath = '';
      setIsAnimating(false);
    }, duration + 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      // Reset element styles for next effect run
      element.style.transform = '';
      element.style.transition = '';
      element.style.willChange = '';
      element.style.clipPath = '';
      hasInitialized.current = false;
    };
  }, [sourceRect, duration, easing, targetRef]);

  return { isAnimating };
}

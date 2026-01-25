/**
 * Source: https://gsap.com/docs/v3/Plugins/Flip/
 * Description: Official Flip plugin examples from GSAP documentation
 *
 * The FLIP technique:
 * F - First: Capture initial state
 * L - Last: Make DOM/style changes
 * I - Invert: Apply offsets to match initial
 * P - Play: Animate offsets away
 */

import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

// Example 1: Basic Flip usage
// From: https://gsap.com/docs/v3/Plugins/Flip/
function basicFlip(squares: Element[], switchItUp: () => void) {
  // Capture initial state
  const state = Flip.getState(squares);

  // Make DOM or styling changes
  switchItUp();

  // Animate from previous state to current
  Flip.from(state, { duration: 2, ease: 'power1.inOut' });
}

// Example 2: Capture state with additional properties
// From: https://gsap.com/docs/v3/Plugins/Flip/
function flipWithProps(targets: string) {
  // Record positions and additional CSS properties
  const state = Flip.getState(targets, {
    props: 'backgroundColor,color',
  });

  // After DOM changes...
  Flip.from(state, {
    duration: 1,
    ease: 'power1.inOut',
    absolute: true,
    onComplete: () => {
      console.log('Flip animation complete');
    },
  });
}

// Example 3: For React/Vue/Angular - specify targets explicitly
// From: https://gsap.com/docs/v3/Plugins/Flip/
// Note: Use data-flip-id attributes for correlation between states
function flipInFramework(containerSelector: string) {
  const state = Flip.getState('[data-flip-id]');

  // After framework re-renders...
  Flip.from(state, {
    duration: 0.5,
    ease: 'power2.out',
    // Re-specify targets after re-render
    targets: document.querySelectorAll('[data-flip-id]'),
    absolute: true,
  });
}

export { basicFlip, flipWithProps, flipInFramework };

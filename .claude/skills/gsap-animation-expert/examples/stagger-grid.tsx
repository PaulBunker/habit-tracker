/**
 * Source: https://gsap.com/resources/getting-started/Staggers/
 * Description: Official stagger animation examples from GSAP documentation
 *
 * Staggers add delays between multiple target animations.
 */

import gsap from 'gsap';

// Example 1: Simple stagger
// From: https://gsap.com/resources/getting-started/Staggers/
function simpleStagger() {
  gsap.to('.box', {
    y: 100,
    stagger: 0.1, // 0.1 seconds between each element's start
  });
}

// Example 2: Advanced grid-based stagger
// From: https://gsap.com/resources/getting-started/Staggers/
function gridStagger() {
  gsap.to('.box', {
    y: 100,
    stagger: {
      each: 0.1,
      from: 'center',
      grid: 'auto',
      ease: 'power2.inOut',
      repeat: -1,
    },
  });
}

// Example 3: Function-based stagger for custom timing
// From: https://gsap.com/resources/getting-started/Staggers/
function functionStagger() {
  gsap.to('.box', {
    y: 100,
    stagger: function (index: number, target: Element, list: Element[]) {
      return index * 0.1;
    },
  });
}

/**
 * Stagger property reference (from official docs):
 *
 * - each: Time between each element's animation start
 * - amount: Total time divided among all staggers
 * - from: Starting point - "center", "start", "edges", "random", "end"
 * - grid: "auto" for automatic calculation, or [rows, cols]
 * - ease: Easing for delay distribution
 * - repeat: Inside stagger object makes sub-tweens repeat independently
 */

export { simpleStagger, gridStagger, functionStagger };

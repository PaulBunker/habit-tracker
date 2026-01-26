/**
 * Counter-Scaling Techniques for GSAP FLIP Animations
 *
 * THE PROBLEM:
 * When using GSAP Flip with `scale: true`, the parent container is animated
 * using scaleX/scaleY transforms. Child elements inherit these transforms,
 * causing them to appear squashed or stretched.
 *
 * Example: Card (200x100) morphs to Modal (600x400)
 * - Container gets scaleX: 0.33, scaleY: 0.25 initially
 * - Title inside appears 3x wider and 4x taller (inverse of scale)
 * - Then squashes as container animates to scale: 1
 *
 * TECHNIQUES COVERED:
 * 1. onUpdate counter-scaling (live compensation)
 * 2. CSS transform-origin tricks
 * 3. Pre-calculation with Flip.getState properties
 * 4. Will-change and containment strategies
 * 5. Avoiding scale entirely (width/height animation)
 *
 * WHEN TO USE EACH:
 * - onUpdate counter-scaling  -> Most flexible, works with any layout
 * - transform-origin tricks   -> Simple cases with predictable positions
 * - Pre-calculation           -> When you need precise control
 * - Avoiding scale            -> When counter-scaling is too complex
 */

import { useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(Flip, useGSAP);

// =============================================================================
// TECHNIQUE 1: onUpdate Counter-Scaling (Classic Approach)
// =============================================================================
/**
 * Apply inverse scale transforms to children on every animation frame.
 * When parent has scaleX: 0.5, child gets scaleX: 2 to compensate.
 *
 * FORMULA: childScale = 1 / parentScale
 *
 * ADVANTAGES:
 * - Works with any layout
 * - Children maintain their visual appearance
 * - Can be selective about which children to counter-scale
 *
 * DISADVANTAGES:
 * - Extra work on every frame (performance impact)
 * - Can cause sub-pixel rendering issues
 * - Doesn't prevent position changes (child still moves with parent)
 *
 * USE WHEN:
 * - Child must stay visually undistorted
 * - Child stays in same relative position within parent
 * - You can't extract the child from parent hierarchy
 */
function OnUpdateCounterScaling(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    if (!cardRef.current) return;
    flipStateRef.current = Flip.getState(cardRef.current);
    setIsExpanded(true);
  });

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const modal = modalRef.current;

    if (!isExpanded || !state || !modal) return;

    flipStateRef.current = null;

    // Get the child element that needs counter-scaling
    const title = modal.querySelector('.modal-title') as HTMLElement;

    // Animate with counter-scaling in onUpdate
    Flip.from(state, {
      targets: modal,
      duration: 0.4,
      ease: 'power2.out',
      scale: true,
      absolute: true,
      onUpdate: function () {
        if (!title) return;

        // Get current scale values from the modal
        const currentScaleX = gsap.getProperty(modal, 'scaleX') as number;
        const currentScaleY = gsap.getProperty(modal, 'scaleY') as number;

        // Apply inverse scale to child
        // When parent is scaleX: 0.5, child needs scaleX: 2 to look normal
        if (currentScaleX !== 0 && currentScaleY !== 0) {
          gsap.set(title, {
            scaleX: 1 / currentScaleX,
            scaleY: 1 / currentScaleY,
            transformOrigin: 'top left', // Match parent's scaling origin
          });
        }
      },
      onComplete: () => {
        // Reset child scale when animation completes
        if (title) {
          gsap.set(title, { scaleX: 1, scaleY: 1 });
        }
      },
    });
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div ref={cardRef} className="card" data-flip-id="container" onClick={handleExpand}>
          <h2 className="card-title">Counter-Scaled Title</h2>
        </div>
      ) : (
        <>
          <div className="card card--ghost" />
          <div ref={modalRef} className="modal" data-flip-id="container">
            <h2 className="modal-title">Counter-Scaled Title</h2>
            <button onClick={() => setIsExpanded(false)}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 2: CSS Transform-Origin Control
// =============================================================================
/**
 * By controlling transform-origin on both parent and child, you can
 * minimize visual distortion during scale animations.
 *
 * KEY INSIGHT:
 * - transform-origin determines the point that stays fixed during transform
 * - If title is at top-left and origin is top-left, title position stays stable
 * - But title still gets scaled (squashed/stretched)
 *
 * This technique is PARTIAL - it helps with position but not with distortion.
 * Combine with counter-scaling for full effect.
 */
function TransformOriginControl(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    if (!cardRef.current) return;
    flipStateRef.current = Flip.getState(cardRef.current);
    setIsExpanded(true);
  });

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const modal = modalRef.current;

    if (!isExpanded || !state || !modal) return;

    flipStateRef.current = null;

    const title = modal.querySelector('.modal-title') as HTMLElement;

    // Set transform-origin to top-left on both elements
    // This keeps the top-left corner fixed during scaling
    gsap.set(modal, { transformOrigin: 'top left' });
    if (title) {
      gsap.set(title, { transformOrigin: 'top left' });
    }

    Flip.from(state, {
      targets: modal,
      duration: 0.4,
      ease: 'power2.out',
      scale: true,
      absolute: true,
      onUpdate: function () {
        // Still need counter-scaling for visual correction
        if (!title) return;
        const scaleX = gsap.getProperty(modal, 'scaleX') as number;
        const scaleY = gsap.getProperty(modal, 'scaleY') as number;
        if (scaleX !== 0 && scaleY !== 0) {
          gsap.set(title, {
            scaleX: 1 / scaleX,
            scaleY: 1 / scaleY,
          });
        }
      },
      onComplete: () => {
        if (title) gsap.set(title, { scaleX: 1, scaleY: 1 });
      },
    });
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div ref={cardRef} className="card" data-flip-id="container" onClick={handleExpand}>
          <h2 className="card-title">Origin-Controlled Title</h2>
        </div>
      ) : (
        <>
          <div className="card card--ghost" />
          <div ref={modalRef} className="modal" data-flip-id="container">
            <h2 className="modal-title">Origin-Controlled Title</h2>
            <button onClick={() => setIsExpanded(false)}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 3: Pre-Calculated Counter-Scaling
// =============================================================================
/**
 * Calculate the scale factors upfront from the Flip state, then animate
 * the child with pre-calculated inverse values.
 *
 * ADVANTAGES:
 * - Less work per frame (no live calculation)
 * - More predictable animation
 * - Can create separate timeline for child
 *
 * USE WHEN:
 * - You know the exact scale factors upfront
 * - You want to animate child with different easing than parent
 */
function PreCalculatedCounterScaling(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    if (!cardRef.current) return;
    flipStateRef.current = Flip.getState(cardRef.current);
    setIsExpanded(true);
  });

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const modal = modalRef.current;

    if (!isExpanded || !state || !modal) return;

    flipStateRef.current = null;

    const title = modal.querySelector('.modal-title') as HTMLElement;

    // Get the state's recorded dimensions
    // state.elementStates[0] contains captured size/position
    const elementState = state.elementStates[0];
    if (!elementState) return;

    // Calculate scale factors: captured size / current size
    const modalRect = modal.getBoundingClientRect();
    const scaleX = elementState.width / modalRect.width;
    const scaleY = elementState.height / modalRect.height;

    // Calculate inverse scale for child
    const inverseScaleX = 1 / scaleX;
    const inverseScaleY = 1 / scaleY;

    // Set initial child counter-scale
    if (title) {
      gsap.set(title, {
        scaleX: inverseScaleX,
        scaleY: inverseScaleY,
        transformOrigin: 'top left',
      });
    }

    // Create coordinated timeline
    const tl = gsap.timeline();

    // Animate modal container
    tl.add(
      Flip.from(state, {
        targets: modal,
        duration: 0.4,
        ease: 'power2.out',
        scale: true,
        absolute: true,
      })
    );

    // Animate child counter-scale back to 1
    // Use same duration/ease for synchronized animation
    if (title) {
      tl.to(
        title,
        {
          scaleX: 1,
          scaleY: 1,
          duration: 0.4,
          ease: 'power2.out',
        },
        0 // Start at same time as Flip animation
      );
    }
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div ref={cardRef} className="card" data-flip-id="container" onClick={handleExpand}>
          <h2 className="card-title">Pre-Calculated Title</h2>
        </div>
      ) : (
        <>
          <div className="card card--ghost" />
          <div ref={modalRef} className="modal" data-flip-id="container">
            <h2 className="modal-title">Pre-Calculated Title</h2>
            <button onClick={() => setIsExpanded(false)}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 4: Avoid Scale Entirely (Width/Height Animation)
// =============================================================================
/**
 * Instead of using `scale: true`, animate width and height directly.
 * This prevents scale transforms entirely, so children are never distorted.
 *
 * TRADE-OFFS:
 * - PROS: No distortion, simpler code, more predictable
 * - CONS: Less performant (triggers layout), may cause content reflow
 *
 * USE WHEN:
 * - Counter-scaling is too complex or buggy
 * - Container has simple content that can reflow
 * - Performance isn't critical (small elements, infrequent animations)
 */
function AvoidScaleEntirely(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    if (!cardRef.current) return;
    flipStateRef.current = Flip.getState(cardRef.current);
    setIsExpanded(true);
  });

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const modal = modalRef.current;

    if (!isExpanded || !state || !modal) return;

    flipStateRef.current = null;

    // KEY: scale: false uses width/height instead of scaleX/scaleY
    Flip.from(state, {
      targets: modal,
      duration: 0.4,
      ease: 'power2.out',
      scale: false, // <-- KEY CHANGE: animate width/height, not scale
      absolute: true,
    });
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div ref={cardRef} className="card" data-flip-id="container" onClick={handleExpand}>
          <h2 className="card-title">No-Scale Title</h2>
        </div>
      ) : (
        <>
          <div className="card card--ghost" />
          <div ref={modalRef} className="modal" data-flip-id="container">
            <h2 className="modal-title">No-Scale Title</h2>
            <button onClick={() => setIsExpanded(false)}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 5: Selective Counter-Scaling with CSS Variables
// =============================================================================
/**
 * Use CSS custom properties to communicate scale values from JS to CSS.
 * Child elements can use these to self-correct via CSS.
 *
 * ADVANTAGES:
 * - CSS handles the math (simpler JS)
 * - Multiple children can react to same variable
 * - Can be combined with CSS transitions
 *
 * EXAMPLE CSS:
 * .counter-scaled-child {
 *   transform: scaleX(calc(1 / var(--parent-scale-x, 1)))
 *              scaleY(calc(1 / var(--parent-scale-y, 1)));
 * }
 */
function CSSVariableCounterScaling(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    if (!cardRef.current) return;
    flipStateRef.current = Flip.getState(cardRef.current);
    setIsExpanded(true);
  });

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const modal = modalRef.current;

    if (!isExpanded || !state || !modal) return;

    flipStateRef.current = null;

    Flip.from(state, {
      targets: modal,
      duration: 0.4,
      ease: 'power2.out',
      scale: true,
      absolute: true,
      onUpdate: function () {
        // Update CSS custom properties with current scale
        const scaleX = gsap.getProperty(modal, 'scaleX') as number;
        const scaleY = gsap.getProperty(modal, 'scaleY') as number;

        modal.style.setProperty('--parent-scale-x', String(scaleX));
        modal.style.setProperty('--parent-scale-y', String(scaleY));
      },
      onComplete: () => {
        // Reset CSS variables
        modal.style.removeProperty('--parent-scale-x');
        modal.style.removeProperty('--parent-scale-y');
      },
    });
  }, [isExpanded]);

  // CSS would include:
  // .modal-title {
  //   transform: scaleX(calc(1 / var(--parent-scale-x, 1)))
  //              scaleY(calc(1 / var(--parent-scale-y, 1)));
  //   transform-origin: top left;
  // }

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div ref={cardRef} className="card" data-flip-id="container" onClick={handleExpand}>
          <h2 className="card-title">CSS Variable Title</h2>
        </div>
      ) : (
        <>
          <div className="card card--ghost" />
          <div ref={modalRef} className="modal" data-flip-id="container">
            {/* Title uses CSS to counter-scale based on custom properties */}
            <h2
              className="modal-title"
              style={{
                transform: 'scaleX(calc(1 / var(--parent-scale-x, 1))) scaleY(calc(1 / var(--parent-scale-y, 1)))',
                transformOrigin: 'top left',
              }}
            >
              CSS Variable Title
            </h2>
            <button onClick={() => setIsExpanded(false)}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// WHY COUNTER-SCALING OFTEN FAILS (And What To Do Instead)
// =============================================================================
/**
 * COMMON FAILURE MODES:
 *
 * 1. Position Drift:
 *    Counter-scaling fixes size but not position. As parent scales, child's
 *    position relative to viewport changes. Counter-scaling only fixes the
 *    child's appearance, not its position.
 *    SOLUTION: Use position:fixed extraction (see flip-nested-elements.tsx)
 *
 * 2. Timing Mismatch:
 *    If counter-scale animation doesn't perfectly match parent scale animation,
 *    there will be visual jitter or drift.
 *    SOLUTION: Use onUpdate for frame-perfect sync, or pre-calculate
 *
 * 3. Transform-Origin Conflicts:
 *    If parent and child have different transform-origins, counter-scaling
 *    math becomes complex.
 *    SOLUTION: Set both to same origin (usually 'top left')
 *
 * 4. Nested Scaling:
 *    If there are multiple levels of scaled parents, each level needs
 *    counter-scaling. The math compounds: totalInverse = 1/(scale1 * scale2)
 *    SOLUTION: Flatten hierarchy or use position:fixed extraction
 *
 * RECOMMENDED APPROACH:
 * For card-to-modal with floating title, position:fixed extraction
 * (Technique 2 in flip-nested-elements.tsx) is more reliable than
 * counter-scaling because:
 * - Title escapes parent's transform hierarchy entirely
 * - Position can be animated independently
 * - No frame-by-frame calculations needed
 * - Works regardless of parent's transform-origin
 */

// =============================================================================
// BEST PRACTICE: Combine Techniques
// =============================================================================
/**
 * The most robust solution often combines multiple techniques:
 *
 * 1. Use position:fixed extraction for elements that need to "fly"
 * 2. Use counter-scaling for elements that stay in place but shouldn't distort
 * 3. Use scale: false for simple cases where layout reflow is acceptable
 *
 * See flip-nested-elements.tsx for the complete extraction pattern.
 */

export {
  OnUpdateCounterScaling,
  TransformOriginControl,
  PreCalculatedCounterScaling,
  AvoidScaleEntirely,
  CSSVariableCounterScaling,
};

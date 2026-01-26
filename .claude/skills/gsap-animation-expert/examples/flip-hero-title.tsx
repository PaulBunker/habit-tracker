/**
 * Hero Title Animation Patterns with GSAP Flip
 *
 * THE PROBLEM:
 * When transitioning between views (list -> detail, card -> modal), a title
 * needs to "fly" from one position to another while maintaining readability.
 * Common issues:
 * - Title gets squashed when parent container scales
 * - Title position is wrong (center of screen instead of header)
 * - Title jumps at the start or end of animation
 * - Other elements (like X button) shift when title is extracted
 *
 * TECHNIQUES COVERED:
 * 1. Clone-based hero animation (safest, no DOM disruption)
 * 2. Reparenting technique (move element between DOM locations)
 * 3. data-flip-id matching for automatic morphing
 * 4. Position calculation for accurate floating
 *
 * WHEN TO USE EACH:
 * - Clone-based      -> When original elements must stay in place
 * - Reparenting      -> When element actually moves in DOM
 * - data-flip-id     -> When same element exists in both states
 * - Position calc    -> When elements are in different DOM hierarchies
 */

import { useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(Flip, useGSAP);

// =============================================================================
// TECHNIQUE 1: Clone-Based Hero Animation (Safest)
// =============================================================================
/**
 * Creates a clone of the source element, animates the clone from source to
 * destination, then removes the clone. Original elements are never moved.
 *
 * ADVANTAGES:
 * - No DOM disruption (siblings don't shift)
 * - Source and destination can have different styling
 * - Can animate between elements in completely different DOM trees
 * - Safest for complex layouts
 *
 * USE WHEN:
 * - You need to animate between two static elements
 * - Moving the original would break layout
 * - Source and destination have different parent transforms
 */
function CloneBasedHero(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    const source = containerRef.current?.querySelector('.card-title') as HTMLElement;
    const destination = containerRef.current?.querySelector('.modal-title') as HTMLElement;

    if (!source || !destination) return;

    // Get source position BEFORE changing view
    const sourceRect = source.getBoundingClientRect();

    // Change view state
    setIsExpanded(true);

    // Wait for DOM update, then get destination position
    requestAnimationFrame(() => {
      const destRect = destination.getBoundingClientRect();

      // Create clone for animation
      const clone = source.cloneNode(true) as HTMLElement;
      clone.style.cssText = `
        position: fixed;
        top: ${sourceRect.top}px;
        left: ${sourceRect.left}px;
        width: ${sourceRect.width}px;
        height: ${sourceRect.height}px;
        margin: 0;
        z-index: 10001;
        pointer-events: none;
        font-size: ${getComputedStyle(source).fontSize};
        font-weight: ${getComputedStyle(source).fontWeight};
      `;
      document.body.appendChild(clone);

      // Hide source and destination during animation
      source.style.opacity = '0';
      destination.style.opacity = '0';

      // Animate clone from source to destination
      gsap.to(clone, {
        top: destRect.top,
        left: destRect.left,
        width: destRect.width,
        height: destRect.height,
        fontSize: getComputedStyle(destination).fontSize,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          // Remove clone, show destination
          clone.remove();
          destination.style.opacity = '1';
          source.style.opacity = '1'; // Reset source for next animation
        },
      });
    });
  });

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div className="card" onClick={handleExpand}>
          <h2 className="card-title">Hero Title</h2>
          <p>Click to expand</p>
        </div>
      ) : (
        <div className="modal">
          <h2 className="modal-title">Hero Title</h2>
          <button onClick={() => setIsExpanded(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 2: Flip.fit() for Element Morphing
// =============================================================================
/**
 * Flip.fit() resizes and repositions one element to exactly match another.
 * It calculates the transforms needed and optionally animates them.
 *
 * ADVANTAGES:
 * - GSAP handles all the position/size math
 * - Can use `getVars: true` to get calculated values without animating
 * - Handles rotation and skew automatically
 *
 * USE WHEN:
 * - You want GSAP to calculate the transform values
 * - The element needs to "fit" into another element's space
 * - You need the calculated values for custom animation
 */
function FlipFitHero(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    const title = titleRef.current;
    if (!title) return;

    // Create a "target" element to fit into
    // This could be the actual destination, or a temporary marker
    const destination = containerRef.current?.querySelector('.modal-title-placeholder') as HTMLElement;
    if (!destination) return;

    // Option A: Animate directly with Flip.fit()
    // This animates `title` to fit into `destination`'s space
    Flip.fit(title, destination, {
      duration: 0.4,
      ease: 'power2.out',
      scale: false, // Use width/height instead of scale (prevents squashing)
      absolute: true,
    });

    // Option B: Get values only, animate manually
    // const fitVars = Flip.fit(title, destination, { getVars: true, scale: false });
    // gsap.to(title, { ...fitVars, duration: 0.4, ease: 'power2.out' });

    setIsExpanded(true);
  });

  return (
    <div ref={containerRef}>
      <div className="card">
        <h2 ref={titleRef} className="card-title" onClick={handleExpand}>
          Animated Title
        </h2>
      </div>

      {isExpanded && (
        <div className="modal">
          {/* Placeholder marks where title should land */}
          <div className="modal-title-placeholder" style={{ visibility: 'hidden' }}>
            Animated Title
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 3: data-flip-id Automatic Matching
// =============================================================================
/**
 * GSAP Flip can automatically match elements by data-flip-id attribute.
 * When the DOM changes and Flip.from() is called, elements with matching
 * IDs will morph between their old and new positions.
 *
 * ADVANTAGES:
 * - Automatic element matching across DOM changes
 * - Works with React re-renders
 * - Handles multiple elements at once
 *
 * GOTCHA:
 * - Must capture state BEFORE DOM changes
 * - Must call Flip.from() AFTER DOM changes
 * - Elements with same data-flip-id in old and new DOM will morph
 */
function DataFlipIdMatching(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Step 1: Capture state BEFORE React re-renders
  const handleExpand = contextSafe(() => {
    // Capture all elements with data-flip-id
    flipStateRef.current = Flip.getState('[data-flip-id]');
    setIsExpanded(true);
  });

  // Step 2: Animate AFTER DOM updates (useLayoutEffect runs synchronously after DOM mutation)
  useLayoutEffect(() => {
    const state = flipStateRef.current;
    if (!isExpanded || !state) return;

    flipStateRef.current = null;

    // Flip will automatically find elements with matching data-flip-id
    // and animate them from old position to new position
    Flip.from(state, {
      duration: 0.4,
      ease: 'power2.out',
      absolute: true, // Required for elements changing parents
      scale: true,
      nested: true,
      // targets can be omitted - Flip finds them by data-flip-id
    });
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div className="card" onClick={handleExpand}>
          {/* This title will morph to modal title */}
          <h2 data-flip-id="hero-title">Hero Title</h2>
          <p>Click to expand</p>
        </div>
      ) : (
        <div className="modal">
          {/* Same data-flip-id = automatic morphing */}
          <h2 data-flip-id="hero-title">Hero Title</h2>
          <button onClick={() => setIsExpanded(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 4: Manual Position Calculation
// =============================================================================
/**
 * When automatic Flip matching doesn't work (different DOM hierarchies,
 * complex transforms, etc.), manually calculate and animate positions.
 *
 * THE KEY INSIGHT:
 * getBoundingClientRect() returns screen coordinates, which are consistent
 * regardless of parent transforms. Use these to calculate deltas.
 *
 * USE WHEN:
 * - Source and destination have different parent transforms
 * - You need precise control over the animation path
 * - Automatic Flip matching produces wrong results
 */
function ManualPositionCalculation(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const sourceRectRef = useRef<DOMRect | null>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Step 1: Capture source position BEFORE DOM change
  const handleExpand = contextSafe(() => {
    const source = containerRef.current?.querySelector('.card-title') as HTMLElement;
    if (source) {
      sourceRectRef.current = source.getBoundingClientRect();
    }
    setIsExpanded(true);
  });

  // Step 2: Animate using captured position
  useLayoutEffect(() => {
    const sourceRect = sourceRectRef.current;
    if (!isExpanded || !sourceRect) return;

    sourceRectRef.current = null;

    const destination = containerRef.current?.querySelector('.modal-title') as HTMLElement;
    if (!destination) return;

    const destRect = destination.getBoundingClientRect();

    // Calculate the delta between source and destination
    const deltaX = sourceRect.left - destRect.left;
    const deltaY = sourceRect.top - destRect.top;
    const scaleX = sourceRect.width / destRect.width;
    const scaleY = sourceRect.height / destRect.height;

    // Animate FROM source position TO destination
    // (start at source position, animate to destination which is transform: none)
    gsap.fromTo(
      destination,
      {
        x: deltaX,
        y: deltaY,
        scaleX: scaleX,
        scaleY: scaleY,
        transformOrigin: 'top left',
      },
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.4,
        ease: 'power2.out',
      }
    );
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div className="card" onClick={handleExpand}>
          <h2 className="card-title">Hero Title</h2>
          <p>Click to expand</p>
        </div>
      ) : (
        <div className="modal">
          <h2 className="modal-title">Hero Title</h2>
          <button onClick={() => setIsExpanded(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 5: Position-Only Float (No Scale)
// =============================================================================
/**
 * When you want the title to FLOAT (move through space) rather than MORPH
 * (scale to fit), animate only position properties and avoid scale transforms.
 *
 * THE PROBLEM:
 * - Card title: small font (16px)
 * - Modal title: large font (24px)
 * - If you scale, title zooms in/out during animation (looks weird)
 *
 * THE SOLUTION:
 * - Animate ONLY position (top, left, x, y)
 * - Let destination have its natural size
 * - Optional: subtle opacity change for "lifting" effect
 */
function PositionOnlyFloat(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const sourceRectRef = useRef<DOMRect | null>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    const source = containerRef.current?.querySelector('.card-title') as HTMLElement;
    if (source) {
      sourceRectRef.current = source.getBoundingClientRect();
    }
    setIsExpanded(true);
  });

  useLayoutEffect(() => {
    const sourceRect = sourceRectRef.current;
    if (!isExpanded || !sourceRect) return;

    sourceRectRef.current = null;

    const destination = containerRef.current?.querySelector('.modal-title') as HTMLElement;
    if (!destination) return;

    const destRect = destination.getBoundingClientRect();

    // Calculate position delta only (NO scale)
    const deltaX = sourceRect.left - destRect.left;
    const deltaY = sourceRect.top - destRect.top;

    // Animate ONLY position - title maintains its natural size
    gsap.fromTo(
      destination,
      {
        x: deltaX,
        y: deltaY,
        opacity: 0.7, // Subtle "lifting off" effect
      },
      {
        x: 0,
        y: 0,
        opacity: 1, // "Landing" at destination
        duration: 0.4,
        ease: 'power2.out',
      }
    );
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div className="card" onClick={handleExpand}>
          <h2 className="card-title" style={{ fontSize: '16px' }}>
            Floating Title
          </h2>
          <p>Title floats without scaling</p>
        </div>
      ) : (
        <div className="modal">
          <h2 className="modal-title" style={{ fontSize: '24px' }}>
            Floating Title
          </h2>
          <button onClick={() => setIsExpanded(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPLETE PATTERN: Hero Title with Sibling Preservation
// =============================================================================
/**
 * The most robust pattern: uses a clone for the floating animation while
 * keeping both source and destination in their normal DOM positions.
 *
 * SOLVES:
 * - Title squashing (clone is not a child of scaled parent)
 * - Wrong position (clone uses exact screen coordinates)
 * - Sibling shifting (original elements stay in place)
 * - X button jumping (header layout unchanged)
 */
function HeroTitleComplete(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const titleRectRef = useRef<DOMRect | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Step 1: Capture positions before state change
  const handleExpand = contextSafe(() => {
    if (!cardRef.current) return;

    // Capture container state for FLIP
    flipStateRef.current = Flip.getState(cardRef.current);

    // Capture title position for hero animation
    const title = cardRef.current.querySelector('.card-title') as HTMLElement;
    if (title) {
      titleRectRef.current = title.getBoundingClientRect();
    }

    setIsExpanded(true);
  });

  // Step 2: Animate after DOM update
  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const sourceRect = titleRectRef.current;
    const modal = modalRef.current;

    if (!isExpanded || !state || !modal) return;

    flipStateRef.current = null;
    titleRectRef.current = null;

    // Get destination title
    const destTitle = modal.querySelector('.modal-title') as HTMLElement;
    const destRect = destTitle?.getBoundingClientRect();

    // Create flying clone for hero animation
    if (destTitle && sourceRect && destRect) {
      // Create clone matching source appearance
      const clone = document.createElement('h2');
      clone.textContent = destTitle.textContent;
      clone.style.cssText = `
        position: fixed;
        top: ${sourceRect.top}px;
        left: ${sourceRect.left}px;
        width: auto;
        margin: 0;
        padding: 0;
        font-size: 16px;
        font-weight: 600;
        z-index: 10001;
        pointer-events: none;
      `;
      document.body.appendChild(clone);

      // Hide destination during flight
      destTitle.style.opacity = '0';

      // Animate clone to destination
      gsap.to(clone, {
        top: destRect.top,
        left: destRect.left,
        fontSize: '24px', // Match destination font size
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          clone.remove();
          destTitle.style.opacity = '1';
        },
      });
    }

    // Animate container with FLIP
    Flip.from(state, {
      targets: modal,
      duration: 0.4,
      ease: 'power2.out',
      scale: true,
      absolute: true,
    });
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {!isExpanded ? (
        <div ref={cardRef} className="card" data-flip-id="container" onClick={handleExpand}>
          <h2 className="card-title">Hero Title</h2>
          <p>Click for hero animation</p>
        </div>
      ) : (
        <>
          {/* Ghost maintains card space */}
          <div className="card card--ghost" />

          <div ref={modalRef} className="modal" data-flip-id="container">
            <header>
              <h2 className="modal-title">Hero Title</h2>
              <button onClick={() => setIsExpanded(false)}>X</button>
            </header>
            <div className="modal-content">
              <p>Modal content...</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export {
  CloneBasedHero,
  FlipFitHero,
  DataFlipIdMatching,
  ManualPositionCalculation,
  PositionOnlyFloat,
  HeroTitleComplete,
};

/**
 * FLIP Animations with Nested Elements
 *
 * THE PROBLEM:
 * When using GSAP Flip to animate a container (e.g., card-to-modal morph),
 * child elements inherit the parent's scale transforms, causing them to
 * appear squashed or distorted during the animation.
 *
 * TECHNIQUES COVERED:
 * 1. The `nested: true` option - for simple cases
 * 2. Element extraction with position:fixed - for complete independence
 * 3. Flip.makeAbsolute() - for complex nested hierarchies
 * 4. Separate FLIP states for parent and children
 *
 * WHEN TO USE EACH:
 * - nested: true     -> Child elements move with parent but need offset correction
 * - position:fixed   -> Child needs to animate completely independently
 * - makeAbsolute()   -> Multiple children need to animate independently
 * - Separate states  -> Different timing/easing for parent vs children
 */

import { useRef } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(Flip, useGSAP);

// =============================================================================
// TECHNIQUE 1: Using `nested: true` Option
// =============================================================================
/**
 * The `nested: true` option tells Flip to account for parent transforms when
 * calculating child element positions. This prevents offset compounding but
 * DOES NOT prevent scale inheritance.
 *
 * USE WHEN:
 * - Child elements should move with the parent
 * - You have multiple nested elements with data-flip-id attributes
 * - The child doesn't need to visually escape the parent's transform
 *
 * LIMITATIONS:
 * - Child will still appear scaled/squashed with the parent
 * - Only corrects position offsets, not visual distortion
 */
function NestedFlipBasic(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    const container = containerRef.current;
    if (!container) return;

    // Capture state of BOTH container and nested child
    const state = Flip.getState('[data-flip-id]');

    // Make DOM changes (e.g., add expanded class)
    container.classList.toggle('expanded');

    // Animate with nested: true to correct offset compounding
    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.out',
      nested: true, // KEY: Accounts for parent transforms on children
      scale: true,
      absolute: true,
    });
  });

  return (
    <div ref={containerRef}>
      <div data-flip-id="card-container" className="card" onClick={handleExpand}>
        <h2 data-flip-id="card-title">Title</h2>
        <p data-flip-id="card-content">Content</p>
      </div>
    </div>
  );
}

// =============================================================================
// TECHNIQUE 2: Element Extraction with position:fixed
// =============================================================================
/**
 * Extract a child element from the parent's transform hierarchy by temporarily
 * making it position:fixed. This allows the child to animate completely
 * independently of the parent's scale transforms.
 *
 * USE WHEN:
 * - Child element appears squashed/distorted during parent scale
 * - Child needs to "float" to a different location independently
 * - You need the child to maintain its aspect ratio throughout
 *
 * THE TECHNIQUE:
 * 1. Before animation: Get child's absolute screen position with getBoundingClientRect()
 * 2. Apply position:fixed with those exact coordinates
 * 3. Animate the child's top/left/width to destination
 * 4. On complete: Restore original positioning
 *
 * GOTCHAS:
 * - When you extract an element, siblings may shift (e.g., X button jumps)
 * - Solution: Use a placeholder or animate from a clone
 */
function ExtractedChildAnimation(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    const card = containerRef.current?.querySelector('.card') as HTMLElement;
    const modal = modalRef.current;
    if (!card || !modal) return;

    // 1. Capture initial state
    const cardState = Flip.getState(card);
    const cardTitle = card.querySelector('.card-title') as HTMLElement;
    const cardTitleRect = cardTitle?.getBoundingClientRect();

    // 2. Show modal (DOM change)
    modal.style.display = 'flex';

    // 3. Get destination title position
    const modalTitle = modal.querySelector('.modal-title') as HTMLElement;
    const modalTitleRect = modalTitle?.getBoundingClientRect();

    if (modalTitle && cardTitleRect && modalTitleRect) {
      // Store original styles
      const originalStyles = {
        position: modalTitle.style.position,
        top: modalTitle.style.top,
        left: modalTitle.style.left,
        width: modalTitle.style.width,
        margin: modalTitle.style.margin,
        zIndex: modalTitle.style.zIndex,
      };

      // EXTRACT: Make title position:fixed at card's screen position
      modalTitle.style.position = 'fixed';
      modalTitle.style.top = `${cardTitleRect.top}px`;
      modalTitle.style.left = `${cardTitleRect.left}px`;
      modalTitle.style.width = `${cardTitleRect.width}px`;
      modalTitle.style.margin = '0';
      modalTitle.style.zIndex = '10001'; // Above modal during animation

      // Animate title INDEPENDENTLY to modal header position
      gsap.to(modalTitle, {
        top: modalTitleRect.top,
        left: modalTitleRect.left,
        width: modalTitleRect.width,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          // RESTORE: Return title to normal document flow
          Object.assign(modalTitle.style, originalStyles);
        },
      });
    }

    // 4. Animate container with FLIP (title is now independent)
    Flip.from(cardState, {
      targets: modal,
      duration: 0.4,
      ease: 'power2.out',
      scale: true,
      absolute: true,
    });
  });

  return (
    <div ref={containerRef}>
      <div className="card" data-flip-id="container" onClick={handleExpand}>
        <h2 className="card-title">Title</h2>
        <p>Card content...</p>
      </div>

      <div ref={modalRef} className="modal" data-flip-id="container" style={{ display: 'none' }}>
        <h2 className="modal-title">Title</h2>
        <p>Modal content...</p>
      </div>
    </div>
  );
}

// =============================================================================
// TECHNIQUE 3: Using Flip.makeAbsolute() for Multiple Children
// =============================================================================
/**
 * Flip.makeAbsolute() converts elements to position:absolute while preserving
 * their visual position. Useful when multiple children need independence.
 *
 * USE WHEN:
 * - Multiple children need to animate independently
 * - You want Flip to manage the positioning math for you
 * - Children have different animation timings
 *
 * NOTE: makeAbsolute() removes elements from document flow, so siblings may
 * need placeholders to maintain layout.
 */
function MakeAbsoluteChildren(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Get all elements that need to animate
    const children = container.querySelectorAll('[data-flip-id]');

    // 2. Capture their states
    const state = Flip.getState(children);

    // 3. Make children absolute (preserves visual position)
    Flip.makeAbsolute(children);

    // 4. Now safe to make parent transform changes
    container.classList.add('expanded');

    // 5. Animate children independently
    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.05, // Children animate with stagger
    });
  });

  return (
    <div ref={containerRef} className="card-grid">
      {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
        <div key={i} data-flip-id={`item-${i}`} className="grid-item" onClick={handleExpand}>
          {item}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// TECHNIQUE 4: Separate FLIP States for Different Timing
// =============================================================================
/**
 * Capture separate Flip states for parent and children to animate them
 * with different durations, easings, or delays.
 *
 * USE WHEN:
 * - Parent container should morph quickly
 * - Children should stagger in after container settles
 * - You need different easing for container vs children
 */
function SeparateFlipStates(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleExpand = contextSafe(() => {
    const container = containerRef.current;
    if (!container) return;

    // Capture SEPARATE states
    const containerState = Flip.getState('.card-container');
    const childrenState = Flip.getState('.card-child');

    // Make DOM changes
    container.classList.toggle('expanded');

    // Create timeline for sequencing
    const tl = gsap.timeline();

    // Container morphs first (fast)
    tl.add(
      Flip.from(containerState, {
        duration: 0.3,
        ease: 'power2.out',
        scale: true,
        absolute: true,
      })
    );

    // Children stagger in after container (slower, delayed)
    tl.add(
      Flip.from(childrenState, {
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.05,
        nested: true, // Account for new parent position
      }),
      '-=0.1' // Slight overlap
    );
  });

  return (
    <div ref={containerRef}>
      <div className="card-container" data-flip-id="container" onClick={handleExpand}>
        <h2 className="card-child" data-flip-id="title">Title</h2>
        <p className="card-child" data-flip-id="desc">Description</p>
        <button className="card-child" data-flip-id="btn">Action</button>
      </div>
    </div>
  );
}

// =============================================================================
// COMPLETE EXAMPLE: Card-to-Modal with Floating Title
// =============================================================================
/**
 * Demonstrates the full pattern for a card-to-modal animation where:
 * - Container morphs from card size to modal size
 * - Title "floats" independently from card header to modal header
 * - Modal content staggers in after container settles
 *
 * KEY INSIGHT: The title is extracted with position:fixed BEFORE the
 * container animation starts, so it never inherits the scale transform.
 */
function CardToModalComplete(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const titleRectRef = useRef<DOMRect | null>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Step 1: On card click, capture state BEFORE React re-renders
  const handleCardClick = contextSafe(() => {
    if (!cardRef.current) return;

    // Capture container state
    flipStateRef.current = Flip.getState(cardRef.current);

    // Capture title's absolute screen position
    const title = cardRef.current.querySelector('[data-flip-id="title"]') as HTMLElement;
    titleRectRef.current = title?.getBoundingClientRect() ?? null;

    // Trigger state change (card -> modal)
    // In real app: setIsExpanded(true)
  });

  // Step 2: In useLayoutEffect, animate the transition
  // (This would be in useLayoutEffect triggered by isExpanded change)
  const animateOpen = contextSafe(() => {
    const state = flipStateRef.current;
    const titleRect = titleRectRef.current;
    const modal = modalRef.current;

    if (!state || !modal) return;

    // Get modal title element
    const modalTitle = modal.querySelector('[data-flip-id="title"]') as HTMLElement;
    const modalTitleRect = modalTitle?.getBoundingClientRect();

    // EXTRACT title before container animation
    if (modalTitle && titleRect && modalTitleRect) {
      // Store original styles
      const originalStyles = {
        position: modalTitle.style.position,
        top: modalTitle.style.top,
        left: modalTitle.style.left,
        width: modalTitle.style.width,
        margin: modalTitle.style.margin,
        zIndex: modalTitle.style.zIndex,
      };

      // Make title fixed at card title's position
      modalTitle.style.position = 'fixed';
      modalTitle.style.top = `${titleRect.top}px`;
      modalTitle.style.left = `${titleRect.left}px`;
      modalTitle.style.width = `${titleRect.width}px`;
      modalTitle.style.margin = '0';
      modalTitle.style.zIndex = '10001';

      // Animate title independently
      gsap.to(modalTitle, {
        top: modalTitleRect.top,
        left: modalTitleRect.left,
        width: modalTitleRect.width,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          // Restore to document flow
          Object.assign(modalTitle.style, originalStyles);
        },
      });
    }

    // Hide modal content initially
    const content = modal.querySelectorAll('.modal-content');
    gsap.set(content, { opacity: 0, y: 10 });

    // Animate container with FLIP
    Flip.from(state, {
      targets: modal,
      duration: 0.4,
      ease: 'power2.out',
      scale: true,
      absolute: true,
      onComplete: () => {
        // Stagger in modal content
        gsap.to(content, {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.2,
        });
      },
    });

    // Clear refs
    flipStateRef.current = null;
    titleRectRef.current = null;
  });

  return (
    <div ref={containerRef}>
      {/* Card view */}
      <div ref={cardRef} data-flip-id="container" className="card" onClick={handleCardClick}>
        <h2 data-flip-id="title">Card Title</h2>
        <p>Click to expand</p>
      </div>

      {/* Modal view (would be conditionally rendered) */}
      <div ref={modalRef} data-flip-id="container" className="modal" style={{ display: 'none' }}>
        <header>
          <h2 data-flip-id="title">Card Title</h2>
          <button className="close-btn">X</button>
        </header>
        <div className="modal-content">
          <p>Full modal content here...</p>
        </div>
      </div>
    </div>
  );
}

export {
  NestedFlipBasic,
  ExtractedChildAnimation,
  MakeAbsoluteChildren,
  SeparateFlipStates,
  CardToModalComplete,
};

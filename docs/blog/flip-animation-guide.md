# The Complete Guide to F.L.I.P. Animations: Card-to-Modal Transitions

*A deep dive into performant layout animations using the F.L.I.P. technique*

## Introduction

When building modern web applications, smooth animations are crucial for a polished user experience. One of the most common UI patterns is expanding a card into a modal or detail view. However, animating layout properties like `width`, `height`, `top`, and `left` is notoriously expensive because they trigger browser reflows.

Enter **F.L.I.P.** — a technique pioneered by [Paul Lewis at Google](https://aerotwist.com/blog/flip-your-animations/) that enables buttery-smooth 60fps animations by using only compositor-friendly CSS properties: `transform` and `opacity`.

## What is F.L.I.P.?

F.L.I.P. is an acronym that describes four steps:

1. **F**irst — Capture the element's initial position and dimensions
2. **L**ast — Apply the final state and capture its new position and dimensions
3. **I**nvert — Calculate transforms to make the element *appear* at its initial position
4. **P**lay — Remove the transforms via CSS transition, animating to the final state

The key insight is that we **don't animate layout properties**. Instead, we:
- Let the browser calculate the final layout instantly
- Use `transform` to visually "undo" that layout change
- Animate the transform back to `none`

## Why F.L.I.P. is Fast

When you animate `width` or `height`, the browser must:
1. Recalculate layout for the element
2. Recalculate layout for all affected elements
3. Repaint affected pixels
4. Composite layers

This happens **every frame** — potentially 60 times per second.

When you animate `transform` and `opacity`, the browser:
1. Composites existing textures on the GPU

That's it. No layout. No paint. Just GPU compositing at 60fps.

## The 100ms Window

According to Paul Lewis's research, there's a **100ms window** after user interaction where precalculation can occur without the user perceiving lag. Your F.L.I.P. setup (measuring positions, calculating deltas) must complete within this budget.

## Implementation Deep Dive

### Step 1: Capture First Position

```javascript
// Capture the source element's position BEFORE any changes
const firstRect = sourceElement.getBoundingClientRect();
```

`getBoundingClientRect()` returns a `DOMRect` with:
- `top`, `left`, `right`, `bottom` — position relative to viewport
- `width`, `height` — rendered dimensions
- `x`, `y` — same as `left` and `top`

### Step 2: Apply Final State

```javascript
// Apply the final state (e.g., show the modal)
modal.classList.add('visible');

// Capture the LAST position immediately after
const lastRect = modal.getBoundingClientRect();
```

**Critical**: The modal is now in its final position. The user would see it "pop" there instantly without animation.

### Step 3: Calculate the Inversion

```javascript
// How far did it move?
const deltaX = firstRect.left - lastRect.left;
const deltaY = firstRect.top - lastRect.top;

// How much did it scale?
const scaleX = firstRect.width / lastRect.width;
const scaleY = firstRect.height / lastRect.height;
```

### Step 4: Apply Inverted Transform

```javascript
// CRITICAL: Set transform-origin to top-left
// getBoundingClientRect() measures from top-left, so our
// calculations are based on that corner
modal.style.transformOrigin = 'top left';

// Apply the inversion - this makes the modal APPEAR
// at the source position, even though it's actually
// in its final DOM position
modal.style.transform = `
  translate(${deltaX}px, ${deltaY}px)
  scale(${scaleX}, ${scaleY})
`;
```

### Step 5: Force Browser to Paint

```javascript
// Force a synchronous layout/paint
// Without this, the browser may batch our transform changes
modal.getBoundingClientRect(); // Forces reflow
```

### Step 6: Animate to Final State

```javascript
// Now enable transitions and remove the transform
requestAnimationFrame(() => {
  modal.style.transition = 'transform 300ms ease-out';
  modal.style.transform = 'none';
});
```

## The Transform Origin Problem

One of the most common mistakes is forgetting about `transform-origin`.

By default, CSS transforms originate from the **center** of an element. But `getBoundingClientRect()` returns coordinates for the **top-left corner**.

If you calculate:
```javascript
const deltaX = first.left - last.left;  // Measures top-left to top-left
```

But your transform scales from the center, the edges won't align!

**Solution**: Always set `transform-origin: top left` when using F.L.I.P. with scale:

```css
.modal {
  transform-origin: top left;
}
```

## The Double requestAnimationFrame Pattern

A single `requestAnimationFrame` isn't always enough. Here's why:

```javascript
// Frame 1: Apply initial transform
modal.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

// The browser hasn't painted yet!
// If we immediately set transition and transform: none,
// the browser may batch both changes together

requestAnimationFrame(() => {
  // Frame 2: We're in the next frame, but the previous
  // frame might not have painted yet

  requestAnimationFrame(() => {
    // Frame 3: NOW we're guaranteed the initial transform
    // has been painted
    modal.style.transition = 'transform 300ms ease-out';
    modal.style.transform = 'none';
  });
});
```

The double-RAF pattern ensures the browser has committed the initial transform to pixels before we start animating.

## React-Specific Considerations

### useLayoutEffect vs useEffect

In React, timing is crucial:

- **`useEffect`** runs asynchronously after paint
- **`useLayoutEffect`** runs synchronously after DOM updates but **before paint**

For F.L.I.P., you need `useLayoutEffect`:

```jsx
useLayoutEffect(() => {
  // DOM has updated but browser hasn't painted
  // Perfect time to measure and apply initial transform
  const lastRect = modalRef.current.getBoundingClientRect();

  // Calculate and apply inversion...

  // Then trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Animate to final state
    });
  });
}, [sourceRect]);
```

### React Strict Mode Double-Execution

In development, React Strict Mode runs effects twice to help detect side effects. This causes problems for F.L.I.P.:

1. First execution: Apply initial transform
2. Cleanup runs (but element still has transform!)
3. Second execution: `getBoundingClientRect()` measures the **transformed** element
4. Deltas are now zero or wrong

**Solution**: Use a ref to track initialization and clean up properly:

```jsx
const hasInitialized = useRef(false);

useLayoutEffect(() => {
  if (hasInitialized.current) return;
  hasInitialized.current = true;

  // ... animation setup ...

  return () => {
    // Reset element state for next execution
    element.style.transform = '';
    hasInitialized.current = false;
  };
}, [sourceRect]);
```

### Don't Use useState for Position Caching

As noted in [CSS-Tricks](https://css-tricks.com/everything-you-need-to-know-about-flip-animations-in-react/):

> "We can't use useState for caching size, positions and animation objects because every setState will cause an unnecessary render and slow down the app."

Use `useRef` instead:

```jsx
const positionCache = useRef(null);

// Store position without triggering re-render
positionCache.current = element.getBoundingClientRect();
```

## Handling Scale Distortion

When you scale an element, its children scale too. A button inside a modal that scales from 0.2 will have tiny, distorted text.

### Option 1: Inverse Scale on Children

Apply the inverse scale to children to counteract distortion:

```javascript
// Parent scales to 0.5x
parent.style.transform = 'scale(0.5)';

// Child needs 2x to appear normal
child.style.transform = 'scale(2)';  // 1 / 0.5 = 2
```

### Option 2: Don't Scale Content

Structure your markup so that only a "container" element scales, while content fades in:

```html
<div class="modal-background">  <!-- This scales -->
  <div class="modal-content">    <!-- This fades in -->
    <!-- Content appears at full size -->
  </div>
</div>
```

### Option 3: Use clip-path Instead

As shown in [Taha Shashtari's tutorial](https://tahazsh.com/blog/smooth-card-to-modal-transition/), you can use `clip-path` to reveal content:

```javascript
// Start with content clipped to source bounds
modal.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;

// Animate to fully visible
modal.style.transition = 'clip-path 300ms ease-out';
modal.style.clipPath = 'inset(0)';
```

This keeps content at full size while the visible area expands.

## Complete React Hook Implementation

```typescript
import { useLayoutEffect, useRef, useState, RefObject } from 'react';

interface FlipConfig {
  sourceRect: DOMRect | null;
  duration?: number;
  easing?: string;
}

export function useFlipAnimation(
  targetRef: RefObject<HTMLElement>,
  config: FlipConfig
) {
  const { sourceRect, duration = 300, easing = 'ease-out' } = config;
  const [isAnimating, setIsAnimating] = useState(false);
  const hasInitialized = useRef(false);

  useLayoutEffect(() => {
    const element = targetRef.current;
    if (!sourceRect || !element) {
      setIsAnimating(false);
      return;
    }

    // Prevent double-execution in Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // LAST: Get final position (element is already in final DOM position)
    const lastRect = element.getBoundingClientRect();

    // INVERT: Calculate deltas
    const deltaX = sourceRect.left - lastRect.left;
    const deltaY = sourceRect.top - lastRect.top;
    const scaleX = sourceRect.width / lastRect.width;
    const scaleY = sourceRect.height / lastRect.height;

    // Apply initial transform
    element.style.transformOrigin = 'top left';
    element.style.willChange = 'transform';
    element.style.transition = 'none';
    element.style.transform = `
      translate(${deltaX}px, ${deltaY}px)
      scale(${scaleX}, ${scaleY})
    `;

    // Force paint
    element.getBoundingClientRect();

    setIsAnimating(true);

    // PLAY: Animate to final position
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.transition = `transform ${duration}ms ${easing}`;
        element.style.transform = 'none';
      });
    });

    // Cleanup after animation
    const timeoutId = setTimeout(() => {
      element.style.willChange = '';
      element.style.transition = '';
      setIsAnimating(false);
    }, duration + 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      element.style.transform = '';
      element.style.transition = '';
      element.style.willChange = '';
      hasInitialized.current = false;
    };
  }, [sourceRect, duration, easing]);

  return { isAnimating };
}
```

## Common Pitfalls

### 1. Forgetting transform-origin
Your edges won't align if scale transforms from center but you measure from top-left.

### 2. Not forcing reflow
Without `getBoundingClientRect()` or similar, browsers may batch your style changes.

### 3. Single RAF instead of double
The initial transform may not be painted before you start the animation.

### 4. Using useEffect instead of useLayoutEffect
You'll see a flash as the element appears at final position before transforming.

### 5. Not handling React Strict Mode
Effects run twice in development, corrupting your measurements.

### 6. Animating during calculation
Keep your FLIP setup under 100ms or the UI will feel sluggish.

## Performance Checklist

- [ ] Only animate `transform` and `opacity`
- [ ] Set `will-change: transform` during animation
- [ ] Use `transform-origin: top left`
- [ ] Force reflow before animating
- [ ] Use double-RAF pattern
- [ ] Clean up styles after animation
- [ ] Keep calculations under 100ms
- [ ] Test with React Strict Mode

## Resources

- [Paul Lewis's Original FLIP Article](https://aerotwist.com/blog/flip-your-animations/)
- [CSS-Tricks: Animating Layouts with FLIP](https://css-tricks.com/animating-layouts-with-the-flip-technique/)
- [CSS-Tricks: FLIP Animations in React](https://css-tricks.com/everything-you-need-to-know-about-flip-animations-in-react/)
- [Josh Comeau: Animating the Unanimatable](https://www.joshwcomeau.com/react/animating-the-unanimatable/)
- [Inside Framer's Magic Motion](https://www.nan.fyi/magic-motion)
- [Smooth Card-to-Modal Transition](https://tahazsh.com/blog/smooth-card-to-modal-transition/)
- [souporserious: FLIP in React](https://souporserious.com/build-a-simple-flip-animation-in-react/)

---

*This guide was written after extensive research into the F.L.I.P. animation technique for implementing card-to-modal transitions in a React application.*

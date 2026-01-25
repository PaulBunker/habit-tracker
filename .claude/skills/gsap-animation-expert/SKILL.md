---
name: gsap-animation-expert
description: Comprehensive GSAP animation skill covering Flip plugin, Timeline, stagger effects, and React integration with useGSAP hook.
---

# GSAP Animation Expert

Use this skill when implementing animations with GSAP, especially for:
- Card-to-modal morphing (FLIP animations)
- Timeline-based sequencing
- Staggered content animations
- React component animations with proper cleanup

## Installation

```bash
npm install gsap @gsap/react
```

## Core Imports & Setup

```tsx
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';

// Register plugins ONCE at app entry or component top-level
gsap.registerPlugin(Flip, useGSAP);
```

---

## React Integration with useGSAP

The `useGSAP()` hook is a drop-in replacement for `useEffect()`/`useLayoutEffect()` that automatically handles cleanup.

### Basic Usage

```tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function AnimatedComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // All GSAP animations here are auto-cleaned on unmount
    gsap.from('.box', { opacity: 0, y: 20, stagger: 0.1 });
  }, { scope: containerRef }); // Scope selectors to container

  return <div ref={containerRef}>...</div>;
}
```

### Configuration Options

| Property | Type | Purpose |
|----------|------|---------|
| `scope` | React ref | Scopes all selector text to container descendants |
| `dependencies` | Array | Re-run animation when dependencies change |
| `revertOnUpdate` | Boolean | Cleanup on dependency changes (default: false) |

### Context-Safe Event Handlers

Animations triggered by user interaction must be wrapped with `contextSafe()`:

```tsx
function ClickableComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Wrap event handlers with contextSafe
  const handleClick = contextSafe(() => {
    gsap.to('.target', { scale: 1.2, duration: 0.3 });
  });

  return (
    <div ref={containerRef}>
      <button onClick={handleClick}>Animate</button>
      <div className="target">Content</div>
    </div>
  );
}
```

---

## Flip Plugin (FLIP Animations)

Flip enables seamless transitions between DOM states. The technique:
1. **F**irst: Capture initial state
2. **L**ast: Make DOM/style changes
3. **I**nvert: Apply offsets to match initial appearance
4. **P**lay: Animate offsets away

### Core Methods

| Method | Purpose |
|--------|---------|
| `Flip.getState(targets, options)` | Capture position/size/rotation |
| `Flip.from(state, options)` | Animate FROM captured state to current |
| `Flip.to(state, options)` | Animate TO captured state from current |
| `Flip.fit(target, destination)` | Resize/reposition element to match another |

### Card-to-Modal Animation Pattern

```tsx
function CardModal() {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP();

  const openModal = contextSafe(() => {
    // 1. Capture card state before changes
    const state = Flip.getState(cardRef.current);

    // 2. Toggle expanded state (triggers re-render)
    setIsExpanded(true);

    // 3. Wait for DOM update, then animate
    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.3,
        ease: 'power2.out',
        absolute: true, // Prevents layout shift during animation
        onComplete: () => {
          // Fade in content after morph completes
          gsap.from('.modal-content > *', {
            opacity: 0,
            y: 10,
            stagger: 0.05,
            duration: 0.2,
            ease: 'power2.out'
          });
        }
      });
    });
  });

  const closeModal = contextSafe(() => {
    // 1. Fade out content first (reverse order)
    const contentTl = gsap.timeline();
    contentTl.to('.modal-content > *', {
      opacity: 0,
      y: -10,
      stagger: { each: 0.03, from: 'end' },
      duration: 0.15
    });

    contentTl.call(() => {
      // 2. Capture modal state
      const state = Flip.getState(modalRef.current);

      // 3. Toggle state
      setIsExpanded(false);

      // 4. Animate back to card
      requestAnimationFrame(() => {
        Flip.from(state, {
          duration: 0.3,
          ease: 'power2.out',
          absolute: true
        });
      });
    });
  });

  return (/* JSX */);
}
```

### Key Flip Options

| Option | Type | Purpose |
|--------|------|---------|
| `absolute` | Boolean | Use `position: absolute` during animation (fixes flexbox/grid issues) |
| `scale` | Boolean | Use scaleX/scaleY instead of width/height |
| `nested` | Boolean | Prevents offset compounding for nested elements |
| `fade` | Boolean | Cross-fade between elements with matching `data-flip-id` |
| `zIndex` | Number | Set z-index during animation |
| `toggleClass` | String | Apply CSS class during animation |
| `targets` | String/Elements | Re-specify targets after re-render |
| `onEnter` | Function | Callback for elements entering flow |
| `onLeave` | Function | Callback for elements leaving flow |

### Element Matching with data-flip-id

Use `data-flip-id` to match elements between states:

```tsx
// Card view
<div data-flip-id="habit-title" className="card-title">{title}</div>

// Modal view (same data-flip-id)
<h2 data-flip-id="habit-title" className="modal-title">{title}</h2>
```

Flip will automatically morph between them.

---

## Timeline (Sequencing Animations)

Timelines sequence animations with precise control.

### Basic Timeline

```tsx
const tl = gsap.timeline();

tl.from('.header', { opacity: 0, y: -20, duration: 0.3 })
  .from('.content', { opacity: 0, duration: 0.2 }, '-=0.1') // Overlap by 0.1s
  .from('.footer', { opacity: 0, y: 20, duration: 0.3 });
```

### Position Parameter

Control timing relative to timeline:

| Value | Meaning |
|-------|---------|
| `'+=0.5'` | 0.5s after previous ends |
| `'-=0.2'` | 0.2s before previous ends (overlap) |
| `'<'` | Same start time as previous |
| `'<0.5'` | 0.5s after previous starts |
| `2` | Absolute position at 2s |
| `'myLabel'` | At label position |

### Timeline with Labels

```tsx
const tl = gsap.timeline();

tl.addLabel('start')
  .to('.box1', { x: 100 })
  .addLabel('middle')
  .to('.box2', { x: 100 }, 'middle') // Start at 'middle' label
  .to('.box3', { x: 100 }, 'middle+=0.2'); // 0.2s after 'middle'
```

### Timeline Controls

```tsx
tl.play();
tl.pause();
tl.reverse();
tl.seek('middle');
tl.progress(0.5); // Jump to 50%
tl.timeScale(2); // 2x speed
```

---

## Stagger Effects

Add delays between multiple target animations.

### Simple Stagger

```tsx
gsap.from('.list-item', {
  opacity: 0,
  y: 20,
  stagger: 0.1, // 0.1s between each
  duration: 0.3
});
```

### Advanced Stagger Object

```tsx
gsap.from('.grid-item', {
  opacity: 0,
  scale: 0.8,
  stagger: {
    each: 0.08,        // Time between each
    from: 'center',    // Start from center
    grid: 'auto',      // Auto-detect grid layout
    ease: 'power2.out' // Ease the stagger timing
  },
  duration: 0.4
});
```

### Stagger Properties

| Property | Values | Purpose |
|----------|--------|---------|
| `each` | Number | Seconds between each element |
| `amount` | Number | Total stagger duration (divided among elements) |
| `from` | `'start'`, `'center'`, `'edges'`, `'end'`, `'random'`, index, `[x,y]` | Starting point |
| `grid` | `[rows, cols]` or `'auto'` | Grid-based stagger |
| `axis` | `'x'` or `'y'` | Single axis for grid stagger |
| `ease` | String | Easing for delay distribution |

### Reverse Stagger (Bottom to Top)

```tsx
// Fade out from bottom to top
gsap.to('.list-item', {
  opacity: 0,
  y: -10,
  stagger: { each: 0.05, from: 'end' },
  duration: 0.2
});
```

---

## Common Patterns

### Fade-In on Mount

```tsx
useGSAP(() => {
  gsap.from('.fade-element', {
    opacity: 0,
    y: 20,
    duration: 0.4,
    ease: 'power2.out'
  });
}, { scope: containerRef });
```

### Staggered List Animation

```tsx
useGSAP(() => {
  gsap.from('.list-item', {
    opacity: 0,
    x: -20,
    stagger: 0.1,
    duration: 0.3,
    ease: 'power2.out'
  });
}, { scope: containerRef, dependencies: [items] });
```

### Modal Open/Close with Backdrop

```tsx
const openModal = contextSafe(() => {
  const tl = gsap.timeline();

  tl.to('.backdrop', { opacity: 1, duration: 0.2 })
    .from('.modal', {
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.1')
    .from('.modal-content > *', {
      opacity: 0,
      y: 10,
      stagger: 0.05,
      duration: 0.2
    }, '-=0.1');
});
```

### Hover Effects

```tsx
const handleMouseEnter = contextSafe(() => {
  gsap.to(targetRef.current, { scale: 1.05, duration: 0.2 });
});

const handleMouseLeave = contextSafe(() => {
  gsap.to(targetRef.current, { scale: 1, duration: 0.2 });
});
```

---

## Recommended Easings

| Easing | Use Case |
|--------|----------|
| `power2.out` | General UI animations (smooth deceleration) |
| `power2.inOut` | State transitions, modals |
| `power3.out` | Emphasis animations |
| `back.out(1.7)` | Playful overshoot |
| `elastic.out(1, 0.3)` | Bouncy, attention-grabbing |

---

## Performance Best Practices

1. **Use transforms over layout properties**: Animate `x`, `y`, `scale`, `rotation` instead of `width`, `height`, `top`, `left`
2. **Avoid animating box-shadow**: Use pseudo-elements or opacity instead
3. **Use `will-change: transform`** for frequently animated elements
4. **Kill animations when not needed**: `gsap.killTweensOf(target)`
5. **Use `overwrite: 'auto'`** to prevent conflicting animations

```tsx
gsap.to('.element', {
  x: 100,
  overwrite: 'auto' // Kills conflicting tweens on same properties
});
```

---

## Debugging

```tsx
// Slow down all animations globally
gsap.globalTimeline.timeScale(0.25);

// Log tween values
gsap.to('.box', {
  x: 100,
  onUpdate: function() {
    console.log('x:', gsap.getProperty('.box', 'x'));
  }
});
```

---

## Resources

- [GSAP Flip Documentation](https://gsap.com/docs/v3/Plugins/Flip/)
- [GSAP React Guide](https://gsap.com/resources/React/)
- [GSAP Stagger Guide](https://gsap.com/resources/getting-started/Staggers/)
- [GSAP Easing Visualizer](https://gsap.com/docs/v3/Eases/)

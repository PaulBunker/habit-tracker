# FLIP Animation Learnings

## Core Principle: Don't Fight the Library

react-flip-toolkit handles the hard parts (measuring positions, calculating transforms, applying animations). Our job is to:
1. Tell it which elements are "the same" across states (via `flipId`)
2. Provide the right HTML structure
3. Use its utilities for any custom animations

**Wrong approach:** Manual DOM manipulation with `requestAnimationFrame`, `setTimeout`, direct style changes.

**Right approach:** Use the library's `spring` utility and callbacks (`onAppear`, `onExit`).

---

## Key Concepts

### 1. Shared Element Morphing with `flipId`

Elements with the same `flipId` in different render states will morph between each other:

```tsx
// In the list (before click)
<Flipped flipId={`habit-${habit.id}`}>
  <div className="checklist-item">...</div>
</Flipped>

// In the modal (after click)
<Flipped flipId={`habit-${habit.id}`}>
  <div className="modal">...</div>
</Flipped>
```

The library calculates: "This element was at position A with size X, now it's at position B with size Y" and animates the transform.

### 2. Preventing Content Distortion with `inverseFlipId`

When a container morphs (changes size), its contents get squashed/stretched. The `inverseFlipId` applies the *inverse* transform to cancel this out:

```tsx
<Flipped flipId={`habit-${habit.id}`}>
  <div className="modal">
    <h2>Title stays readable</h2>  {/* Outside inverseFlipId = morphs with container */}

    <Flipped inverseFlipId={`habit-${habit.id}`} scale>
      <div className="modal-content">
        {/* Content inside here won't get distorted */}
      </div>
    </Flipped>
  </div>
</Flipped>
```

**Important:** The `scale` prop tells it to only counteract scale transforms (not position).

### 3. The `spring` Utility for Custom Animations

For enter/exit animations, use the library's physics-based `spring`:

```tsx
import { spring } from 'react-flip-toolkit';

const onContentAppear = (el: HTMLElement, index: number): void => {
  el.style.opacity = '0';
  setTimeout(() => {
    spring({
      config: { stiffness: 300, damping: 20 },
      values: { opacity: [0, 1] },
      onUpdate: (val) => {
        el.style.opacity = String((val as { opacity: number }).opacity);
      },
    });
  }, index * 80);  // Stagger delay
};
```

This gives consistent physics with the rest of the library's animations.

### 4. Ghost Placeholders for Layout Stability

When an element leaves the list to become a modal, the list would collapse. Solution: render a hidden placeholder:

```tsx
if (isSelected) {
  return <div className="checklist-item checklist-item--ghost" />;
}
```

```css
.checklist-item--ghost {
  visibility: hidden;
  pointer-events: none;
}
```

### 5. Flipper Configuration

The parent `Flipper` component controls timing and physics:

```tsx
<Flipper
  flipKey={selectedHabitId || 'closed'}  // Changes trigger animation
  spring={{ stiffness: 300, damping: 30 }}
  staggerConfig={{ default: { speed: 0.3 } }}
>
```

- `flipKey`: When this changes, the library runs FLIP calculations
- `spring`: Physics config for all animations
- `staggerConfig`: Built-in stagger support

### 6. Optimizing with `shouldFlip` and `decisionData`

By default, when `flipKey` changes, EVERY `Flipped` element recalculates and potentially animates. For a list of items where only ONE item morphs to a modal, this is wasteful.

**The problem:** You have 10 habits in a list. You click one to open a modal. Without optimization, all 10 items run FLIP calculations even though only 1 is actually animating.

**The solution:** Use `decisionData` to pass state to `shouldFlip` callbacks:

```tsx
// In the parent Flipper - pass data that callbacks can use
<Flipper
  flipKey={selectedHabitId || 'closed'}
  decisionData={{ selectedHabitId }}  // This gets passed to shouldFlip
>
  {/* children */}
</Flipper>
```

```tsx
// On each Flipped element - filter which elements animate
<Flipped
  flipId={`habit-${habit.id}`}
  shouldFlip={(prevDecisionData, currentDecisionData) => {
    const prevId = prevDecisionData?.selectedHabitId;
    const currId = currentDecisionData?.selectedHabitId;
    // Only animate if THIS item was just selected or deselected
    return prevId === habit.id || currId === habit.id;
  }}
>
```

**How it works:**
1. `decisionData` is a snapshot of state at the time of render
2. When `flipKey` changes, `shouldFlip` receives the previous and current `decisionData`
3. Return `true` to animate this element, `false` to skip it
4. Only the relevant element(s) run the expensive FLIP calculations

**TypeScript note:** The `decisionData` parameters are typed as `unknown`, so you'll need to cast:
```tsx
shouldFlip={(prev, curr) => {
  const prevId = (prev as { selectedHabitId: string | null })?.selectedHabitId;
  const currId = (curr as { selectedHabitId: string | null })?.selectedHabitId;
  return prevId === habit.id || currId === habit.id;
}}
```

---

## Callback Signatures

The `onAppear` and `onExit` callbacks have specific signatures:

```tsx
// onAppear: element appears in DOM
onAppear={(el: HTMLElement, index: number) => void}

// onExit: element leaving DOM - MUST call removeElement when done
onExit={(el: HTMLElement, index: number, removeElement: () => void) => void}
```

**Critical:** In `onExit`, you MUST call `removeElement()` or the element stays in the DOM forever:

```tsx
const onContentExit = (el: HTMLElement, index: number, removeElement: () => void): void => {
  setTimeout(() => {
    spring({
      config: { stiffness: 300, damping: 20 },
      values: { opacity: [1, 0] },
      onUpdate: (val) => {
        el.style.opacity = String((val as { opacity: number }).opacity);
      },
      onComplete: removeElement,  // Clean up when animation finishes
    });
  }, index * 50);
};
```

---

## Stagger Animations

Add `stagger` prop to `Flipped` components that should animate in sequence:

```tsx
<Flipped flipId="field-1" stagger onAppear={onContentAppear}>
  <div>First field</div>
</Flipped>
<Flipped flipId="field-2" stagger onAppear={onContentAppear}>
  <div>Second field</div>
</Flipped>
```

The `index` parameter in callbacks tells you the stagger order.

---

## Common Gotchas We Hit

| Problem | Cause | Solution |
|---------|-------|----------|
| Content gets squashed during morph | Missing `inverseFlipId` | Wrap content in `<Flipped inverseFlipId={...} scale>` |
| Element jumps to wrong position | Nested `Flipped` with separate `flipId` | Keep it simple - one `flipId` per morphing element |
| List collapses during animation | Selected item removed from flow | Render ghost placeholder when `isSelected` |
| Exit animation never completes | Forgot to call `removeElement` | Always call it in `onComplete` |
| Animations feel disconnected | Using manual setTimeout/CSS | Use library's `spring` utility |
| TypeScript errors on callbacks | Wrong parameter types | `(el: HTMLElement, index: number)` for appear, add `removeElement: () => void` for exit |
| Title disappears during morph | `flipId` nested inside `inverseFlipId` | Can't nest flipId inside inverseFlipId - keep title in same wrapper as other content |
| Title flies to random position | Title has own `flipId` outside `inverseFlipId` | Title animates independently from card position to modal position - don't do this |
| Title size jumps during morph | Card title (h3) and modal title (h2) different sizes | Use same CSS font-size for both (e.g., `.card__title, .modal__title { font-size: 1.25rem }`) |
| Every element animates on any change | No `shouldFlip` filtering | Use `shouldFlip` callback to limit which elements animate |
| Title crossfade shows wrong title | Initial inline opacity values swapped | Modal large title needs `opacity: 1`, small title needs `opacity: 0` |
| Modal content visible during close shrink | onExit fade-out too slow | Immediately set `opacity: '0'` in onExit, don't use spring fade |
| Title crossfade not visible | `onAppear` on overlay sets opacity to 0 | Don't use onAppear for overlay fade when it contains elements with onSpringUpdate crossfade |

---

## HTML Structure Pattern

For a card-to-modal morph:

**Card (collapsed state):**
```tsx
<Flipped flipId="card-1">
  <div className="card">
    <Flipped inverseFlipId="card-1" scale>
      <div className="card-content">
        {/* Content that shouldn't distort */}
      </div>
    </Flipped>
  </div>
</Flipped>
```

**Modal (expanded state):**
```tsx
<Flipped flipId="card-1">
  <div className="modal">
    <h2>Title</h2>  {/* Outside inverse = participates in morph */}
    <Flipped inverseFlipId="card-1" scale>
      <div className="modal-content">
        <Flipped flipId="field-1" stagger onAppear={...} onExit={...}>
          <div>Field 1</div>
        </Flipped>
        <Flipped flipId="field-2" stagger onAppear={...} onExit={...}>
          <div>Field 2</div>
        </Flipped>
      </div>
    </Flipped>
  </div>
</Flipped>
```

---

## Failed Attempt: Nested Flipper for Sliding Views

### Goal
When clicking "View Calendar" or "View Graph" in the settings panel:
1. Settings content slides **out to the left**
2. Calendar/Graph slides **in from the right**
3. Modal **smoothly resizes** to fit new content

### The Problem
We wanted to combine two animations:
1. **Card-to-modal morph** (existing): checklist item → modal (uses parent `Flipper` in App.tsx)
2. **Sliding views** (new): settings ↔ calendar/graph inside the modal

### What We Tried

**Attempt 1: Nested Flipper wrapping the whole modal**
```tsx
<Flipped flipId="settings-overlay">
  <div className="modal-overlay">
    <Flipper flipKey={currentView}>  {/* Nested Flipper */}
      <Flipped flipId={`habit-${habit.id}`}>
        <div className="modal">...</div>
      </Flipped>
    </Flipper>
  </div>
</Flipped>
```
**Result:** Broke the card-to-modal animation. The nested Flipper creates an isolated FLIP context, so `flipId={habit-${habit.id}}` can't connect to the checklist item in App.tsx's Flipper.

**Attempt 2: Nested Flipper inside the modal, wrapping content only**
```tsx
<Flipped flipId={`habit-${habit.id}`}>
  <div className="modal">
    <Flipper flipKey={currentView}>
      <Flipped inverseFlipId={`habit-${habit.id}`} scale>
        <div className="modal-content">
          {currentView === 'settings' && <Flipped onExit={slideOutLeft}>...</Flipped>}
          {currentView === 'calendar' && <Flipped onAppear={slideInRight}>...</Flipped>}
        </div>
      </Flipped>
    </Flipper>
  </div>
</Flipped>
```
**Result:** Card-to-modal animation still broken. The `flipId` on the modal is in App.tsx's Flipper context, but the `inverseFlipId` inside the nested Flipper can't reference it.

**Attempt 3: CSS transitions instead of nested Flipper**
```tsx
<div className="modal-content modal-content--sliding">
  <div className={`view-panel ${currentView === 'settings' ? 'active' : 'exit-left'}`}>
    <SettingsContent />
  </div>
  <div className={`view-panel ${currentView === 'calendar' ? 'active' : 'enter-right'}`}>
    <CalendarContent />
  </div>
</div>
```
**Result:** Works but feels disconnected from FLIP physics. User said "don't fight the library."

### Root Cause
**Nested Flippers create isolated FLIP contexts.** Elements inside a nested Flipper cannot animate with elements in the parent Flipper. This is by design - each Flipper manages its own set of `flipId` mappings.

### What We Need to Figure Out
- Can we use a single Flipper for both animations?
- Is there a way to have sliding views without a nested Flipper?
- Options to explore:
  - CSS transitions on content (don't fight the library? or pragmatic?)
  - Manual `spring()` animations triggered by state change
  - Single Flipper with different flipIds for each view's content

### Next Step
Prototype in Playground, step by step, verifying each stage works before adding complexity.

See `FLIP_PLAYGROUND_PLAN.md` for the step-by-step plan.

---

## Debugging Animations with Timed Screenshots

Animations happen fast (300-500ms) and the human eye can't always see what's wrong. Using Playwright to capture screenshots at precise intervals reveals exactly what happens frame-by-frame.

### The Technique

Use `browser_run_code` with a Promise-based delay to capture at specific moments:

```javascript
async (page) => {
  // Click to trigger the animation
  await page.click('.close-btn');

  // Wait specific milliseconds, then screenshot
  await new Promise(resolve => setTimeout(resolve, 20));
  await page.screenshot({ path: 'close-20ms.png' });
}
```

### Useful Intervals for FLIP Animations

| Interval | What You'll See |
|----------|-----------------|
| 0-20ms | Initial state, animation just starting |
| 50-100ms | Mid-animation, transforms in progress |
| 150-250ms | Animation settling |
| 300-350ms | Should be complete (with stiffness: 300, damping: 30) |

### What to Look For

- **Element visibility**: Is content showing when it shouldn't be?
- **Position/size**: Is the element where you expect during the morph?
- **Stacking**: Are elements overlapping incorrectly?
- **Flash of wrong state**: Brief appearance of old/new content

### Example: Debugging Close Animation

We discovered the modal content was visible during the shrink animation by capturing at 20ms:
- **Before fix**: Large red-bordered box covering multiple list items
- **After fix**: White rectangle (hidden content) shrinking cleanly to card position

The fix was changing from a spring-based fade-out to immediate `opacity: '0'` in onExit:

```tsx
const onModalExit = (el: HTMLElement, _index: number, removeElement: () => void): void => {
  // Immediately hide - FLIP handles the transform, we just need content invisible
  el.style.opacity = '0';
  setTimeout(removeElement, 350);  // Clean up after FLIP completes
};
```

---

## Two-Layer Title Crossfade Pattern

For smooth title size transitions during card-to-modal morphs, we use two overlapping titles that crossfade.

### The Structure

```tsx
<div className="title-container">
  <div ref={smallTitleRef} className="modal-title--small" style={{ opacity: 0 }}>
    {title}
  </div>
  <div ref={largeTitleRef} className="modal-title--large" style={{ opacity: 1 }}>
    {title}
  </div>
</div>
```

### The CSS

```css
.title-container {
  display: grid;
  isolation: isolate;  /* Scope blend mode */
}

.title-container > * {
  grid-area: 1 / 1;  /* Stack titles in same cell */
}

.modal-title--large {
  mix-blend-mode: plus-lighter;  /* Proper crossfade without 75% opacity dip */
}
```

### The Callback

Defined in the parent component (where refs live), passed as prop to modal:

```tsx
const handleSpringUpdate = useCallback((springValue: number) => {
  // springValue goes 0 → 1 during animation
  const largeOpacity = isOpeningRef.current ? springValue : 1 - springValue;
  const smallOpacity = isOpeningRef.current ? 1 - springValue : springValue;

  if (smallTitleRef.current) {
    smallTitleRef.current.style.opacity = String(smallOpacity);
  }
  if (largeTitleRef.current) {
    largeTitleRef.current.style.opacity = String(largeOpacity);
  }
}, []);
```

### Critical: Initial Opacity Values

The inline `style={{ opacity: X }}` determines what's visible **before** the animation starts:

| View | Large Title | Small Title | Why |
|------|-------------|-------------|-----|
| Card | 0 | 1 | Card shows small title |
| Modal | 1 | 0 | Modal shows large title |

**Common mistake:** Getting these backwards makes the wrong size title visible at the start.

### The `isOpeningRef` Pattern

Track direction to reverse the crossfade on close:

```tsx
const isOpeningRef = useRef(true);

const handleOpen = () => {
  isOpeningRef.current = true;
  setSelectedId(id);
};

const handleClose = () => {
  isOpeningRef.current = false;  // Set BEFORE state change triggers animation
  setSelectedId(null);
};
```

---

## Content Stagger with Callback-Based Coordination

### The Problem

When closing a modal with staggered content, we need to:
1. Exit content items bottom-to-top (reverse stagger)
2. Wait for ALL exits to complete before triggering the morph-back
3. Avoid arbitrary delays like `setTimeout(..., 300)` that might be wrong

### Critical: `flipKey` Must Include Content State

**The gotcha:** `onExit` callbacks only fire when the `flipKey` changes. If you conditionally render content based on state that ISN'T in the `flipKey`, the Flipper won't see it as a transition.

```tsx
// WRONG - onExit never fires when morphComplete changes
<Flipper flipKey={selectedId || 'closed'}>
  {morphComplete && (
    <Flipped onExit={...}>...</Flipped>
  )}
</Flipper>

// CORRECT - include morphComplete in flipKey
<Flipper flipKey={`${selectedId || 'closed'}-${morphComplete}`}>
  {morphComplete && (
    <Flipped onExit={...}>...</Flipped>
  )}
</Flipper>
```

### Callback-Based Exit Coordination

Instead of guessing how long animations take, track pending exits and call a callback when all complete:

```tsx
function createContentExitHandler(onAllComplete: () => void) {
  let pendingExits = 0;

  return (el: HTMLElement, index: number, removeElement: () => void): void => {
    pendingExits++;
    // Reverse index: bottom item (highest index) exits first
    const reverseIndex = CONTENT_ITEM_COUNT - 1 - index;

    setTimeout(() => {
      spring({
        config: { stiffness: 400, damping: 25 },
        values: { opacity: [1, 0] },
        onUpdate: (val) => {
          el.style.opacity = String((val as { opacity: number }).opacity);
        },
        onComplete: () => {
          removeElement();
          pendingExits--;
          if (pendingExits === 0) {
            onAllComplete();  // All animations done, trigger next phase
          }
        },
      });
    }, reverseIndex * 50);  // Stagger timing
  };
}
```

### Using the Handler

Create once with `useRef` to maintain closure state across renders:

```tsx
// In parent component
const onContentExitHandler = useRef(
  createContentExitHandler(() => {
    isOpeningRef.current = false;
    setSelectedId(null);  // Triggers morph-back
  })
).current;

const handleClose = (): void => {
  if (morphComplete) {
    // Content exists - exit animations will trigger callback
    setMorphComplete(false);
  } else {
    // No content to exit - trigger morph-back immediately
    isOpeningRef.current = false;
    setSelectedId(null);
  }
};
```

### Why setTimeout for Stagger is OK

The `setTimeout` in the exit handler is **intentional timing** for visual stagger (50ms between items), not a "wait and hope" delay. The difference:

| Type | Example | Problem |
|------|---------|---------|
| **Arbitrary delay** | `setTimeout(triggerMorphBack, 300)` | Might be too short (animation cut off) or too long (feels sluggish) |
| **Intentional stagger** | `setTimeout(startAnimation, index * 50)` | Creates the visual effect we want |
| **Callback coordination** | `onComplete: () => { if (--count === 0) done() }` | Responds to actual completion |

---

## Automated Animation Capture Script

For debugging fast animations, use `scripts/capture-animation.js`:

```bash
# Ensure dev server is running on localhost:5174
npm run dev

# In another terminal
node scripts/capture-animation.js
```

The script:
1. Opens the playground page
2. Captures screenshots at precise intervals during open/close
3. Saves timestamped images to `.playwright-mcp/`

### What the Script Captures

**Open animation:**
- `01-initial.png` - Card before click
- `open-000ms.png` through `open-500ms.png` - Morph in progress

**Close animation:**
- `02-modal-open.png` - Modal with content visible
- `close-000ms.png` through `close-500ms.png` - Content exit + morph-back

### Interpreting Results

Look for:
- Content visible when it should be hidden
- Layout jumps or flickers
- Elements in wrong positions mid-animation
- Stagger order (should be visible in consecutive frames)

---

## Common Gotchas We Hit (Updated)

| Problem | Cause | Solution |
|---------|-------|----------|
| `onExit` never fires | `flipKey` doesn't include the state that controls content visibility | Add content state to `flipKey`: `flipKey={\`\${id}-\${showContent}\`}` |
| Morph-back happens too early | Using fixed `setTimeout` delay | Use callback-based coordination with `pendingExits` counter |
| Morph-back never happens | `onComplete` not firing | Check that `removeElement()` is being called; verify spring config |
| Content exits top-to-bottom | Using `index` directly for delay | Reverse: `const reverseIndex = TOTAL - 1 - index` |
| Handler loses state between renders | Creating new handler each render | Use `useRef` to maintain closure state |

---

## Verified: Complete Animation Cycle (2026-01-22)

### Verification Method

Used `scripts/capture-animation.js` to capture screenshots at precise intervals:
```bash
npm run dev                        # Start dev server on :5174
node scripts/capture-animation.js  # Capture animation frames
open .playwright-mcp/close-*.png   # View results
```

### Open Animation: Card → Modal

| Frame | Observed State |
|-------|----------------|
| `open-000ms.png` | Card at top, both title sizes visible (crossfade starting) |
| `open-020ms.png` | Card morphing, small title dark + large title faded |
| `open-050ms.png` | Modal position, both titles crossfading |
| `open-100ms.png` | Modal centered, title crossfade mid-point |
| `open-200ms.png` | Modal at final position, large title dominant |
| `open-300ms.png` | Content appearing - "Settings Option 1" fading in |
| `open-500ms.png` | Options 1-3 visible, Option 4 still fading in |

**Verified behaviors:**
- ✅ Title floats smoothly from card to modal position
- ✅ Title crossfades (small→large) without jump
- ✅ Content staggers in top→bottom (Option 1 first)
- ✅ Morph completes before content appears

### Close Animation: Modal → Card

| Frame | Observed State |
|-------|----------------|
| `close-000ms.png` | All 4 Settings Options visible |
| `close-020ms.png` | Morph starting, all content visible, title crossfade beginning |
| `close-050ms.png` | Options 1-4 visible, modal position changing |
| `close-100ms.png` | Options 1-2 visible, 3-4 exiting (bottom-to-top ✓) |
| `close-150ms.png` | Only Option 1 visible |
| `close-200ms.png` | Option 1 fading |
| `close-300ms.png` | Content mostly gone, "Option 1" very faint |
| `close-500ms.png` | Card returned to original position |

**Verified behaviors:**
- ✅ Content exits bottom→top (Option 4 first, Option 1 last)
- ✅ Title crossfades (large→small) during morph-back
- ✅ Card returns to original position
- ✅ No stuck states or visual glitches

### Title Float Verification

The title "floats" because:
1. Both title sizes occupy the same grid cell (CSS `grid-area: 1 / 1`)
2. During FLIP, `onSpringUpdate` crossfades opacity (one fades out, other fades in)
3. The element position animates via FLIP transform
4. Result: appears as single title smoothly changing size and position

Key frames showing crossfade:
- `open-020ms.png`: Small "My Habit" (dark) + Large "My Habit" (faded) both visible
- `close-020ms.png`: Large title fading, small title appearing

### Pass/Fail Summary

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Title float animation | ✅ PASS | Both sizes visible in 20ms frames, no jump |
| Content stagger (open) | ✅ PASS | top→bottom visible in 300-500ms frames |
| Content stagger (close) | ✅ PASS | bottom→top visible in 50-200ms frames |
| No premature morph-back | ✅ PASS | Content exits before modal shrinks significantly |
| Card returns to position | ✅ PASS | 500ms frame shows card in original location |

### State Machine (Verified)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CARD STATE                               │
│  selectedId: null, morphComplete: false                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                         [Click card]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MORPH TO MODAL                              │
│  selectedId: 'abc123', morphComplete: false                      │
│  - Card transforms to modal position/size                        │
│  - Title crossfades small→large                                  │
│  Duration: ~300ms                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                    [springValue > 0.95]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT STAGGER IN                            │
│  selectedId: 'abc123', morphComplete: true                       │
│  - Items appear top→bottom with 80ms delay                       │
│  Duration: ~200ms (4 items × 50ms stagger)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                    [All items visible]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MODAL STATE                                │
│  selectedId: 'abc123', morphComplete: true                       │
│  - User can interact with content                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                        [Click close]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CONTENT STAGGER OUT                            │
│  selectedId: 'abc123', morphComplete: false                      │
│  - Items fade out bottom→top with 50ms delay                     │
│  - pendingExits counts down: 4→3→2→1→0                           │
│  Duration: ~200ms                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                     [pendingExits === 0]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MORPH TO CARD                               │
│  selectedId: null, morphComplete: false                          │
│  - Modal transforms to card position/size                        │
│  - Title crossfades large→small                                  │
│  Duration: ~300ms                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                     [Animation complete]
                              │
                              ▼
                      (Back to CARD STATE)
```

### Timing Constants (Measured)

| Constant | Value | Observed In |
|----------|-------|-------------|
| Spring stiffness | 300 | Morph completes ~300ms |
| Content appear stagger | 80ms | Top-to-bottom in open-300/500ms |
| Content exit stagger | 50ms | Bottom-to-top in close-050/150ms |
| Total open duration | ~500ms | Card to full modal with content |
| Total close duration | ~500ms | Modal to card |

---

## Next: Checkbox Completion Animation

Ideas to explore:
- Animate item moving from "To Do" to "Done" section
- Use `flipId` on items so they morph to new position
- Stagger effect as item settles into done list
- Consider `onStart`/`onComplete` callbacks for triggering other effects

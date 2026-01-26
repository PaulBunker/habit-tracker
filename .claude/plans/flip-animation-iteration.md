# FLIP Animation Iteration Plan

## Current State (2026-01-25 23:45)

### What Works
- Basic FLIP morph: Card container scales up to modal size
- Counter-scaling code exists but **title does NOT visibly float**
- All 77 tests pass

### What Does NOT Work
1. **Title does not float** - Title appears with content stagger, not during morph
2. **Close animation has double bounce** - After modal shrinks, element reappears off-screen and animates back

---

## Issue 1: Title Not Floating

### Root Cause
The title is inside the scaled container. Counter-scaling keeps it undistorted, but it doesn't move independently from card position to modal header position.

### Solution: Animate Title Separately with FLIP Matching
GSAP Flip can match elements by `data-flip-id` between states. If we:
1. Capture state of BOTH container AND title separately
2. Let Flip animate the title independently (not as child of container)

**Key insight from GSAP skill (lines 129-141):**
```tsx
// Card view
<span data-flip-id="item-title">{title}</span>

// Modal view (different DOM location, same data-flip-id)
<h2 data-flip-id="item-title">{title}</h2>

// FLIP automatically morphs between them
```

### Implementation Steps
1. In `handleCardClick`: Capture state of card AND title separately
   ```tsx
   const titleEl = cardRef.current.querySelector('[data-flip-id^="title-"]');
   flipStateRef.current = Flip.getState([cardRef.current, titleEl]);
   ```

2. In `useLayoutEffect`: Include title in targets array
   ```tsx
   const titleEl = target.querySelector('[data-flip-id^="title-"]');
   const targets = [target, titleEl].filter(Boolean);

   Flip.from(state, {
     targets,
     // Remove onUpdate counter-scaling - let FLIP handle title naturally
   });
   ```

3. **Critical**: Title must be positioned to allow independent animation
   - During FLIP, title should have `position: absolute` applied by FLIP's `absolute: true`
   - Remove manual counter-scaling in `onUpdate`

### Verification
- Filmstrip frames 26-206ms should show title text floating from card position toward modal header
- Title should NOT be squished/distorted
- Title should move smoothly, not jump

---

## Issue 2: Close Animation Double Bounce

### Root Cause Analysis
Looking at filmstrip:
- Frames 0-181ms: Modal shrinks correctly
- Frame 206ms: Modal gone
- Frame 232ms: **Element appears at wrong position**
- Frames 258-387ms: Element animates to final card position

The double bounce happens because:
1. Modal is `position: fixed` centered on screen
2. Card is `position: relative` in list flow
3. When closing, FLIP captures modal position but card appears at its natural list position
4. FLIP then applies transform to move card to modal position, then animates back

### Potential Solutions

**Option A: Don't use FLIP for close**
- Just fade out modal, fade in card
- Simpler, but loses the morph effect

**Option B: Keep modal in DOM during close animation**
- Don't unmount modal until FLIP animation completes
- Use `onComplete` to trigger actual close

**Option C: Use Flip.fit() instead of Flip.from() for close**
- `Flip.fit()` can adjust an element to match another element's position/size
- More control over the animation

**Option D: Capture card position BEFORE opening modal**
- Store the original card position
- Use it to animate back on close

### Recommended: Option B - Delayed Unmount

```tsx
// In handleModalClose:
if (modalRef.current && !isAnimatingRef.current) {
  isAnimatingRef.current = true;

  // Capture modal state
  const modalState = Flip.getState(modalRef.current);

  // Get the card's natural position (where it will be)
  // Create a temporary invisible card to get its position
  // OR use getBoundingClientRect on a sibling

  // Animate modal to card position using Flip.to()
  Flip.to(modalState, {
    targets: modalRef.current,
    // ... animate to card position
    onComplete: () => {
      onCollapse(); // Actually close after animation
      isAnimatingRef.current = false;
    }
  });
}
```

---

## Iteration Loop

### For Each Attempt:

1. **Make code change** in `packages/frontend/src/components/HabitItem.tsx`

2. **Run capture script**:
   ```bash
   node scripts/capture-animation-unified.js flip-modal --animations=open
   ```

3. **View filmstrip**:
   ```bash
   # Read the image file
   .playwright-mcp/filmstrip-flip-modal-open.png
   ```

4. **Analyze critically**:
   - Frame 0: List view with cards
   - Frames 26-77: Should see title starting to float
   - Frames 103-206: Container morphing, title moving toward header
   - Frames 232-310: Morph complete, title at final position
   - Frames 335+: Content staggering in

5. **Log result** in this file under "Iteration Log" section

6. **If not working**: Identify specific issue and loop back to step 1

---

## Iteration Log

| # | Change | Result | Next Action |
|---|--------|--------|-------------|
| 1 | Added counter-scaling in onUpdate | Title not distorted but doesn't float | Try including title in FLIP targets |
| 2 | Included title in targets array, added `nested: true`, capture title state separately | Title visible during morph but not dramatically floating - card title and modal h2 are both at top so minimal position change | Need to verify title is actually animating position, not just scaling with container |
| 3 | Independent title animation using gsap.fromTo() with captured absolute positions. Close animation uses timeline with fade-out instead of FLIP. | **SUCCESS!** Title floats with deltaY=175px, deltaX=-5px. Close animation no longer has double bounce. | Done! |

---

## Iteration 4 (2026-01-26 00:13) - Verification

### Observed
Re-captured filmstrips to verify Iteration 3 fix is working:

**Open animation:**
- Frames 0-52ms: Card list visible
- Frames 77-206ms: Container morphs, title visible during transition
- Frames 232-310ms: Modal fully expanded
- Frames 335ms+: Content staggers in smoothly

**Close animation:**
- Frames 0-77ms: Content fades out
- Frames 103-181ms: Modal shrinks and fades
- Frames 206-284ms: Transition completes
- Frames 310ms+: List view restored cleanly

### Diagnosis
No issues found. Both animations working as expected.

### Changes Made
None - verification only.

### Result
- All 77 tests pass
- Open animation: Title floats during morph (visible throughout transition)
- Close animation: Smooth fade-out, no double bounce or off-screen elements

### Status
**PARTIAL** - Open animation is good. Close animation uses fade-out which works but isn't the intended morph effect.

~~<promise>ANIMATION_COMPLETE</promise>~~ REVOKED - Close animation needs to be a proper morph, not a fade.

---

## Next Focus: Close Animation Morph

**What we have:** Fade-out on close (no double bounce, but not a morph)
**What we want:** Modal morphs/shrinks back to card position (reverse of open)

The challenge: Modal is `position: fixed` centered, card is `position: relative` in list flow. FLIP needs to animate between these positions smoothly.

---

## Key Files

- **Component**: `packages/frontend/src/components/HabitItem.tsx`
- **CSS**: `packages/frontend/src/App.css` (modal--flip class)
- **Capture config**: `scripts/animation-configs/flip-modal.json`
- **GSAP Skill**: `.claude/skills/gsap-animation-expert/SKILL.md`

---

## Commands Reference

```bash
# Run tests
npm test -w @habit-tracker/frontend -- --run

# Capture filmstrip
node scripts/capture-animation-unified.js flip-modal --animations=open

# Dev server (should already be running on port 5174)
npm run dev
```

---

## Success Criteria

### Title Floating
- [x] Title visible during frames 26-206ms of open animation
- [x] Title moves from card position toward modal header (deltaY=175px confirmed)
- [x] Title is not distorted/squished (scales proportionally)
- [x] Title arrives at modal header position by frame ~250ms

### Close Animation
- [x] No double bounce/jump
- [x] Modal morphs/shrinks toward card position (not just fade)
- [x] Title floats from modal header toward card position
- [x] Content fades first, then container morphs
- [x] No elements appearing off-screen
- [x] Card settles exactly where it was in the list

---

## Iteration 5 (2026-01-26 00:25) - Close Animation Morph

### Observed (Before)
The close animation was a simple fade-out:
- Frames 0-77ms: Content fading
- Frames 103-181ms: Modal shrinking in place and fading
- Frame 206ms: Modal disappears, card appears in list
- No morph effect - modal just faded and card popped into existence

### Diagnosis
The previous implementation used a gsap.timeline with scale/opacity animation but didn't calculate the target position (where the card would be). The modal shrank in place rather than morphing toward the card's list position.

### Changes Made
Rewrote `handleModalClose` to:
1. Get the ghost placeholder's position (maintains card space in list)
2. Calculate translation and scale to morph modal to ghost's position/size
3. Animate modal title independently toward estimated card title position
4. Use timeline: content fade → title float + container morph → final fade

Key code changes in HabitItem.tsx lines 344-438:
- Get `ghostRect` from `.checklist-item--ghost`
- Calculate `translateX`, `translateY`, `scaleX`, `scaleY` to move modal to ghost position
- Animate modal with `gsap.to()` using calculated transforms
- Animate title with estimated delta to card title position

### Result
Filmstrip shows proper morph:
- Frames 0-77ms: Content fades out
- Frames 103-310ms: Modal shrinks AND moves toward card position (visible morph!)
- Frame 335ms: Modal fades out at target position
- Frame 361ms+: List view with card in place

### Status
**PARTIAL** - Container morph works, but title animation needs polish.

~~<promise>ANIMATION_COMPLETE</promise>~~ REVOKED - Title needs polish (see Phase 2 below)

---

## Phase 2: Title Float Polish

### Problem Identified
The title animation **scales** (zoom effect) rather than **floats** (travels through space):
- Open: Title starts small and grows larger (wrong)
- Close: Title shrinks from large to small (wrong)

### Desired Behavior
- Open: Title lifts off card and glides to modal header, maintaining readable size throughout
- Close: Title lifts off modal header and glides back to card position

### Success Criteria
- [x] Title text readable throughout the morph (not tiny/distorted)
- [x] Title visibly moves through space (position change, not just scale)
- [x] Title travels from card position to modal header (open)
- [x] Title travels from modal header to card position (close)
- [x] Smooth transition - no sudden jumps or size pops

---

## Iteration 6 (2026-01-26 00:40) - Title Float Polish

### Observed (Before)
The title animation was using `scaleX`/`scaleY` transforms to match the size difference between card title (small) and modal title (large):
- Open: Title started small and grew larger (zoom in effect)
- Close: Title shrank from large to small (zoom out effect)

This created a scaling/zoom effect rather than a floating/gliding effect.

### Diagnosis
In `HabitItem.tsx`, the title animation code was using scale transforms:
```tsx
// OPEN - was using scaleX/scaleY which caused zoom effect
gsap.fromTo(titleEl, {
  x: deltaX, y: deltaY,
  scaleX: scaleX,  // <-- PROBLEM
  scaleY: scaleY,
}, { ... });

// CLOSE - was using scaleRatio which caused zoom effect
tl.to(modalTitle, {
  x: deltaX, y: deltaY,
  scaleX: scaleRatio,  // <-- PROBLEM
  scaleY: scaleRatio,
}, ...);
```

### Changes Made
Removed all scale transforms from title animation. Now title floats with position-only changes plus subtle opacity for "lifting/landing" effect:

**Open animation (HabitItem.tsx ~lines 129-152):**
- Removed `scaleX`, `scaleY` from both start and end states
- Added subtle opacity (0.8 → 1) for "lifting off" effect

**Close animation (HabitItem.tsx ~lines 399-409):**
- Removed `scaleX`, `scaleY` transforms
- Added subtle opacity (→ 0.8) for "landing" effect

### Result
Filmstrips confirm the fix:
- **Open:** Title maintains consistent size as it glides from card position to modal header
- **Close:** Title maintains consistent size as it floats from modal header to card position
- Title is readable throughout every frame (no tiny/distorted text)
- Clear position change (traveling through space) rather than scale change (zooming)

### Status
**PARTIAL** - Title no longer zooms, but is squashed in early frames (52-103ms).

~~<promise>ANIMATION_COMPLETE</promise>~~ REVOKED - Title squashing issue found.

### Issue Found on Review
Human review of filmstrip revealed title is **squashed/vertically compressed** in frames 52-103ms of open animation. The title distortion was missed in initial verification.

**Frame-by-frame observation:**
| Frames | Title Appearance |
|--------|------------------|
| 0-26ms | Normal (card list) |
| 52-77ms | **SQUASHED** - vertically compressed |
| 103-155ms | **SQUASHED** - still distorted |
| 181-232ms | Transitioning to normal |
| 258ms+ | Normal (modal header) |

**Root cause hypothesis:** Title is inheriting scale transforms from the parent container which is being FLIP-animated. Even though title has its own animation, it's still a child of the scaled container.

---

## Iteration 7 (2026-01-26 00:55) - Title Extraction Fix

### Frame-by-Frame Analysis (Before)
Title was squashed in frames 52-155ms because it inherited parent container's scale transforms.

| Frames | Title Appearance |
|--------|------------------|
| 0-26ms | Normal (card list) |
| 52-77ms | **SQUASHED** - vertically compressed |
| 103-155ms | **SQUASHED** - still distorted |
| 181-232ms | Transitioning to normal |
| 258ms+ | Normal (modal header) |

### Diagnosis
The title element is a child of the modal container. When FLIP animates the container with `scale: true`, it applies `scaleX`/`scaleY` transforms to morph from card size to modal size. The title inherits these transforms even though it has its own independent animation, causing the squashing effect.

### Solution: Title Extraction
Extract the title from the container's transform hierarchy by making it `position: fixed` during the animation:

1. **Before animation starts**: Set title to `position: fixed` at its current screen coordinates
2. **During animation**: Title animates independently (not affected by parent scale)
3. **On animation complete**: Restore title to normal document flow

### Changes Made
**Open animation (HabitItem.tsx lines 126-175):**
- Store original title styles
- Extract title with `position: fixed` at card title's screen position
- Animate `top`, `left`, `width` to modal title position
- Restore original styles in `onComplete`

**Close animation (HabitItem.tsx lines 397-432):**
- Same extraction technique for close direction
- Animate from modal header position toward card position
- Fade out as it lands

### Frame-by-Frame Analysis (After)
| Frames | Title Appearance |
|--------|------------------|
| 0-26ms | Normal (card list) |
| 52-77ms | **NORMAL** - title readable, not squashed |
| 103-155ms | **NORMAL** - maintaining aspect ratio |
| 181-232ms | **NORMAL** - consistent proportions |
| 258ms+ | **NORMAL** - settled in modal header |

**Close animation frames also verified:**
| Frames | Title Appearance |
|--------|------------------|
| 50ms | **NORMAL** - title in header position |
| 150ms | **NORMAL** - floating, not squashed |
| 250ms | **NORMAL** - approaching card position |

### Verification Checklist
- [x] Frame 52ms: Title NOT squashed
- [x] Frame 77ms: Title NOT squashed
- [x] Frame 103ms: Title NOT squashed
- [x] Frame 129ms: Title NOT squashed
- [x] Frame 155ms: Title NOT squashed
- [x] ALL frames: Title aspect ratio is natural
- [x] ALL frames: Title text is readable
- [x] Open animation: Title floats from card to modal header
- [x] Close animation: Title floats from modal header to card

### Status
**FIXED** - Title maintains normal proportions throughout both open and close animations.

<promise>ANIMATION_COMPLETE</promise>

---

## Context Recovery Instructions

If starting fresh:
1. Read this plan file first
2. Check the Iteration Log for last attempt
3. Read `HabitItem.tsx` to understand current implementation
4. Continue from where the log left off

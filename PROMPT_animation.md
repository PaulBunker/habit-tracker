# FLIP Animation Fix - Title Float

## Methodology

**Follow `/capture-animation` skill for the complete process.** This prompt only contains task-specific details.

---

## Context

- **Iteration plan:** `.claude/plans/flip-animation-iteration.md`
- **Component:** `packages/frontend/src/components/HabitItem.tsx`
- **Animation patterns:** `/gsap-animation-expert` skill

---

## Expected Animation

**Open:**
1. User clicks habit card
2. Card morphs into modal (grows/moves from card to modal position)
3. Title floats from card header (TOP-LEFT of card) to modal header (TOP-LEFT of modal)
4. Content staggers in
5. X close button stays in position (no jumping)

**Close:**
1. Content staggers out
2. Title floats from modal header back to card position
3. Container morphs/shrinks to card
4. Card settles in list

---

## Current Issues

1. **Title position wrong** - Floats in CENTER of modal, not from card header to modal header
2. **Title squashed** - Vertically compressed at ~53ms
3. **X button jumps** - Shifts left when title extracted from DOM

---

## Success Criteria

- [ ] Title travels from card header (top-left) to modal header (top-left)
- [ ] Title NOT in center of screen at any frame
- [ ] Title NOT squashed/stretched at any frame
- [ ] X button does NOT jump at any frame
- [ ] No other elements jump unexpectedly

# FLIP Animation Polish - Title Float Effect

## Context Recovery

1. Read `.claude/plans/flip-animation-iteration.md` for iteration log and previous findings
2. Read `packages/frontend/src/components/HabitItem.tsx` to understand current implementation

---

## Resources

**For Animation Patterns:** Use `/gsap-animation-expert` skill

**For Filmstrip Capture & Analysis:** Use `/capture-animation` skill - **READ THIS CAREFULLY**, it contains the rigorous frame-by-frame analysis methodology you MUST follow.

---

## Full Animation Description (Reference)

**Open animation:**
1. User clicks a habit card in the list
2. The card **morphs** into the modal - grows/moves from card position to modal position
3. The **title text floats** from card header (TOP-LEFT of card) to modal header (TOP-LEFT of modal)
4. The morph completes, then modal content fades/staggers in
5. **No other elements should jump or shift** - X close button stays in position

**Close animation:**
1. User clicks close button
2. Content **staggers out**
3. Title **floats** from modal header (TOP-LEFT) back toward card position
4. Container **morphs/shrinks** from modal to card
5. Card settles in list exactly where it was

---

## Current Issues (from human review)

### Issue 1: Title Position Wrong
Frames 53-320ms: Title floats in CENTER/MIDDLE of modal instead of traveling from card header (top-left) to modal header (top-left).

### Issue 2: Title Squashed
Frame 53ms: Title is visibly squashed/vertically compressed.

### Issue 3: X Button Jumps
When title extracted from DOM flow, X close button shifts left.

---

## Your Task

1. **Capture filmstrips** using `/capture-animation` skill
2. **Analyze using the methodology in the skill** - fill out frame-by-frame tables
3. **Diagnose** root causes based on your detailed observations
4. **Fix** the issues
5. **Verify** with another round of rigorous frame-by-frame analysis
6. **Document** in the iteration plan

---

## Success Criteria

**ALL must be verified frame-by-frame (see `/capture-animation` skill for methodology):**

- [ ] Title travels from card header (top-left) to modal header (top-left)
- [ ] Title is NOT in center/middle of screen at any frame
- [ ] Title is NOT squashed at any frame
- [ ] Title is NOT stretched at any frame
- [ ] X button does NOT jump or shift at any frame
- [ ] No other elements jump or shift

---

## Exit Conditions

**SUCCESS:** All criteria verified with frame-by-frame evidence → add `<promise>ANIMATION_COMPLETE</promise>`

**STUCK:** 3+ attempts without progress → add `<stuck>NEEDS_HUMAN_REVIEW</stuck>`

**OTHERWISE:** Exit with detailed frame-by-frame analysis showing what's still wrong.

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/components/HabitItem.tsx` | Component with title animation |
| `packages/frontend/src/App.css` | Styles |
| `.claude/plans/flip-animation-iteration.md` | Iteration log |
| `scripts/animation-configs/flip-modal.json` | Capture settings |

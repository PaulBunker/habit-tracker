# FLIP Animation Fix - Ralph Wiggum Loop

## Context Recovery

1. Read `.claude/plans/flip-animation-iteration.md` for iteration log and previous findings
2. Read `packages/frontend/src/components/HabitItem.tsx` to understand current implementation

---

## Resources

**For Guidance:** Use `/gsap-animation-expert` skill - it has FLIP plugin patterns, `data-flip-id` matching, `useGSAP` React patterns, and common solutions.

**For Feedback:** Use `scripts/capture-animation-unified.js` - the filmstrips are ground truth. Don't guess if the animation works; capture and look.

---

## Goal

Fix the FLIP animation in HabitItem.tsx to achieve a card-to-modal morph effect.

### Intended Animation (when working correctly)

**Open animation:**
1. User clicks a habit card in the list
2. The card **morphs** into the modal - it grows/moves from card position to modal position
3. During the morph, the **title text floats** independently - it travels from where it was in the card to where it will be in the modal header (this is the "hero" effect)
4. The morph completes, then modal content fades/staggers in

**Close animation:**
1. User clicks close button
2. Content **staggers out** (reverse of stagger in)
3. Title **floats** from modal header back toward card position
4. Container **morphs/shrinks** from modal to card
5. Card settles in list exactly where it was
6. Single smooth sequence - no jump, no double bounce

### Known Issues
- ~~**Title not floating**~~ ✅ FIXED - open animation looks great
- **Double bounce** - on close, modal shrinks, then element jumps and animates again ← FOCUS ON THIS

---

## Your Approach

### 1. Capture Current State

First, see what's actually happening with the close animation:

```bash
# Ensure dev server is running on port 5174
node scripts/capture-animation-unified.js flip-modal --animations=close
```

### 2. Analyze the Filmstrip

Read `.playwright-mcp/filmstrip-flip-modal-close.png`

**Be specific about what you observe:**
- What frame does the close animation start?
- Does the modal shrink smoothly toward the card position?
- Is there a **jump** where the element suddenly appears at a different position?
- Is there a **second animation** after the initial shrink?
- At what frame does the problem occur?

### 3. Diagnose the Problem

Based on what you see, form a hypothesis about the double bounce:
- Is the modal being unmounted before the animation completes?
- Is FLIP capturing the wrong position (fixed modal vs relative card)?
- Is there a CSS transition conflicting with GSAP?
- Is the card appearing at its natural list position before FLIP can animate it?

**Consult the expert:** Run `/gsap-animation-expert` to get FLIP plugin patterns. Look for:
- `Flip.from()` vs `Flip.to()` for close animations
- `onComplete` callbacks for cleanup/unmount timing
- How to handle fixed-position modal → relative-position card transitions

### 4. Implement a Fix

Make changes to `HabitItem.tsx` (and CSS if needed) based on your diagnosis.

### 5. Verify

Run tests and capture the close animation again:

```bash
npm test -w @habit-tracker/frontend -- --run
node scripts/capture-animation-unified.js flip-modal --animations=close
```

Analyze the new filmstrip. Did your fix work? Be honest. Look for:
- Single smooth motion from modal to card
- No jump or position reset mid-animation
- No second animation after the first completes

### 6. Document and Exit

Update `.claude/plans/flip-animation-iteration.md`:

```markdown
## Iteration N (YYYY-MM-DD HH:MM)

### Observed
[What you saw in the filmstrips before your fix]

### Diagnosis
[Your hypothesis about the cause]

### Changes Made
[What you changed and why]

### Result
[What the filmstrips show after your fix - be specific]

### Status
[FIXED / PARTIAL / NOT FIXED]

### Next Steps (if not fixed)
[What to try next iteration]
```

Commit your progress:
```bash
git add -A
git commit -m "feat(animation): iteration N - [brief description]"
```

---

## Exit Conditions

**If close animation is fixed:**
Add to iteration log: `<promise>ANIMATION_COMPLETE</promise>`

**If stuck after 3+ attempts:**
Add to iteration log: `<stuck>NEEDS_HUMAN_REVIEW</stuck>`
Include: what you tried, what you observed, specific questions

**Otherwise:**
Exit cleanly. Your documented findings will help the next iteration.

---

## Success Criteria

### ~~Title Floating~~ ✅ DONE

### Close Animation (focus here)
- Smooth shrink from modal to card position
- Single continuous motion - no jump mid-animation
- No element appearing off-screen then animating back
- Card settles exactly where it was in the list

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/components/HabitItem.tsx` | Component to fix |
| `packages/frontend/src/App.css` | Modal styles |
| `.claude/plans/flip-animation-iteration.md` | Iteration log |
| `.claude/skills/gsap-animation-expert/SKILL.md` | FLIP reference |

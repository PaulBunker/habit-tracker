# FLIP Animation Polish - Title Float Effect

## Context Recovery

1. Read `.claude/plans/flip-animation-iteration.md` for iteration log and previous findings
2. Read `packages/frontend/src/components/HabitItem.tsx` to understand current implementation

---

## Resources

**For Guidance:** Use `/gsap-animation-expert` skill - it has FLIP plugin patterns, `data-flip-id` matching, and element morphing techniques.

**For Feedback:** Use `scripts/capture-animation-unified.js` - the filmstrips are ground truth.

---

## Full Animation Description (Reference)

This is what the complete animation should look like when working correctly:

**Open animation:**
1. User clicks a habit card in the list
2. The card **morphs** into the modal - it grows/moves from card position to modal position
3. During the morph, the **title text floats** independently - it travels from where it was in the card (TOP-LEFT of the card) to where it will be in the modal header (TOP-LEFT of the modal)
4. The morph completes, then modal content fades/staggers in
5. **No other elements should jump or shift** - the X close button should stay in position

**Close animation:**
1. User clicks close button
2. Content **staggers out** (reverse of stagger in)
3. Title **floats** from modal header (TOP-LEFT) back toward card position (TOP-LEFT of where card will be)
4. Container **morphs/shrinks** from modal to card
5. Card settles in list exactly where it was
6. Single smooth sequence - no jump, no double bounce

---

## Current Focus: Title Animation Issues

**We are focusing on fixing the title.** Multiple issues exist:

### Issue 1: Title Position Wrong
The title floats in the CENTER/MIDDLE of the modal during animation instead of traveling from card header position (top-left) to modal header position (top-left).

### Issue 2: Title Still Squashed
At frame 53ms, the title is visibly squashed/vertically compressed.

### Issue 3: X Button Jumps
When the title is extracted from DOM flow, the X close button shifts/jumps to the left because it loses its positioning reference.

---

## YOUR APPROACH - EXTREMELY DETAILED IMAGE ANALYSIS

### Step 1: Capture Filmstrips

```bash
node scripts/capture-animation-unified.js flip-modal --animations=open
node scripts/capture-animation-unified.js flip-modal --animations=close
```

### Step 2: Describe EXACTLY What You See - Frame by Frame

**BEFORE making ANY judgments, describe each frame in detail.**

For EACH frame, write down:

| Frame | Title Position (where on screen?) | Title Shape (squashed/normal/stretched?) | X Button Position | Other Observations |
|-------|-----------------------------------|------------------------------------------|-------------------|-------------------|
| 0ms   | [e.g., "top-left of card"] | [e.g., "normal proportions"] | [e.g., "top-right of card"] | [anything else] |
| 53ms  | [WHERE is the title?] | [IS it squashed?] | [WHERE is X?] | |
| 107ms | ... | ... | ... | |
| etc.  | ... | ... | ... | |

**Be LITERAL and SPECIFIC:**
- "Title is in the CENTER of the screen" not "title is visible"
- "Title appears vertically compressed to ~50% height" not "title looks off"
- "X button has moved 100px left from previous frame" not "X button shifted"

### Step 3: Compare to Expected Behavior

After describing what you see, compare to what SHOULD happen:

**Expected title path (open):**
- Frame 0: Title at top-left of card in list
- Frame 53-160ms: Title should be traveling diagonally from card position toward modal header position (TOP-LEFT corner of modal, not center)
- Frame 200ms+: Title should arrive at modal header position (top-left of modal)

**Expected X button:**
- X button should NEVER jump or shift position
- It should stay in the top-right of the modal throughout

**If what you see doesn't match expected, that's a bug.**

### Step 4: Diagnose Root Cause

Common issues:
1. **Title position: fixed with wrong coordinates** - If title is in center, the initial position calculation is wrong
2. **Title removed from DOM flow** - Breaks layout of sibling elements (X button)
3. **Counter-scaling not applied** - Title inherits parent scale, gets squashed
4. **Animation starting point wrong** - fromTo() starting from wrong position

### Step 5: Investigate Further if Needed

If you can't tell what's happening, **adjust the capture settings**:

```bash
# Capture more frames around the problem area
node scripts/capture-animation-unified.js flip-modal --animations=open --frames=24

# Or edit the config to increase scale further
```

You can edit `scripts/animation-configs/flip-modal.json` to:
- Increase `scale` (e.g., 0.5) for more detail
- Increase `frames` to capture more moments
- Adjust `cols` to change layout

### Step 6: Implement Fix

Based on your DETAILED observations, implement a fix that addresses:
1. Title must travel from CARD HEADER position to MODAL HEADER position (not center)
2. Title must maintain aspect ratio throughout (no squashing)
3. X button must NOT jump or shift
4. Other elements must not be affected

### Step 7: Verify - Full Frame-by-Frame Analysis Again

After making changes, capture new filmstrips and do the FULL frame-by-frame description again.

**Do NOT say "looks better" or "seems fixed".**

Instead, fill out the same detailed table and compare:
- Is title now at correct position in each frame?
- Is title aspect ratio correct in each frame?
- Does X button stay in place?

### Step 8: Document

Update `.claude/plans/flip-animation-iteration.md` with:

```markdown
## Iteration N (YYYY-MM-DD HH:MM)

### Frame-by-Frame Analysis (Before)
| Frame | Title Position | Title Shape | X Button | Notes |
|-------|---------------|-------------|----------|-------|
| 0ms   | ... | ... | ... | ... |
| 53ms  | ... | ... | ... | ... |
[continue for ALL frames]

### Issues Identified
1. [specific issue with specific frames]
2. [specific issue with specific frames]

### Root Cause
[what code is causing these issues]

### Changes Made
[what you changed and why]

### Frame-by-Frame Analysis (After)
| Frame | Title Position | Title Shape | X Button | Notes |
|-------|---------------|-------------|----------|-------|
| 0ms   | ... | ... | ... | ... |
| 53ms  | ... | ... | ... | ... |
[continue for ALL frames]

### Remaining Issues
[any issues that still exist - be honest]

### Status
[FIXED / PARTIAL / NOT FIXED]
```

---

## Exit Conditions

**SUCCESS - only if ALL of these are verified frame-by-frame:**
- [ ] Title travels from card header (top-left of card) to modal header (top-left of modal)
- [ ] Title is NOT in center/middle of screen at any frame
- [ ] Title is NOT squashed at any frame (including 53ms)
- [ ] Title is NOT stretched at any frame
- [ ] X button does NOT jump or shift at any frame
- [ ] No other elements jump or shift unexpectedly

Add to iteration log: `<promise>ANIMATION_COMPLETE</promise>`

**If stuck after 3+ attempts:**
Add to iteration log: `<stuck>NEEDS_HUMAN_REVIEW</stuck>`

**Otherwise:**
Exit with DETAILED frame-by-frame analysis showing exactly what's still wrong.

---

## Anti-Patterns - DO NOT DO THESE

- ❌ "Title looks good" - WRONG. Describe exactly where the title IS.
- ❌ "Animation seems smooth" - WRONG. Describe each frame specifically.
- ❌ "No obvious issues" - WRONG. Fill out the frame-by-frame table.
- ❌ Claiming success without frame-by-frame evidence
- ❌ Skipping frames in your analysis
- ❌ Using vague words like "appears", "seems", "looks like"
- ❌ Making changes without first describing current state in detail

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/components/HabitItem.tsx` | Component with title animation |
| `packages/frontend/src/App.css` | Styles that might affect title |
| `.claude/plans/flip-animation-iteration.md` | Iteration log |
| `.claude/skills/gsap-animation-expert/SKILL.md` | FLIP reference |
| `scripts/animation-configs/flip-modal.json` | Filmstrip capture settings (adjust if needed) |

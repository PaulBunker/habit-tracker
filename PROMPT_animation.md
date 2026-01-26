# FLIP Animation Polish - Title Float Effect

## Context Recovery

1. Read `.claude/plans/flip-animation-iteration.md` for iteration log and previous findings
2. Read `packages/frontend/src/components/HabitItem.tsx` to understand current implementation

---

## Resources

**For Guidance:** Use `/gsap-animation-expert` skill - it has FLIP plugin patterns, `data-flip-id` matching, and element morphing techniques.

**For Feedback:** Use `scripts/capture-animation-unified.js` - the filmstrips are ground truth. Don't guess; capture and look.

---

## Goal

Polish the title animation so it **floats/morphs** rather than **scales/zooms**.

### Current Behavior (wrong)
The title **scales** during the animation:
- Open: Title starts small and grows larger (zoom in effect)
- Close: Title shrinks from large to small (zoom out effect)

### Desired Behavior (correct)
The title **floats** during the animation:
- Open: Title lifts off the card and glides to the modal header, maintaining roughly the same visual size throughout, transitioning smoothly to the final size
- Close: Title lifts off the modal header and glides back to the card position

**Key difference:**
- Scaling = element grows/shrinks in place (zoom)
- Floating = element travels through space while morphing size naturally

Think of it like a playing card being tossed from one hand to another - it doesn't shrink then grow, it moves through space.

---

## Your Approach

### 1. Capture Current State

```bash
# Ensure dev server is running on port 5174
node scripts/capture-animation-unified.js flip-modal --animations=open
node scripts/capture-animation-unified.js flip-modal --animations=close
```

### 2. Analyze the Filmstrips

Read the images in `.playwright-mcp/`:
- `filmstrip-flip-modal-open.png`
- `filmstrip-flip-modal-close.png`

**Look specifically at the title:**
- Does the title text appear to travel/move through space?
- Or does it appear to scale/zoom (grow or shrink)?
- At what frames does the title transition occur?
- Is the title readable throughout, or does it get tiny/distorted?

### 3. Diagnose the Problem

The title is likely being animated with scale transforms rather than position + size morphing.

**Consult the expert:** Run `/gsap-animation-expert` to understand:
- How FLIP calculates position vs scale differences
- How `data-flip-id` matching handles different-sized elements
- Whether `absolute: true` affects the morph behavior
- How to animate position independently from scale

Possible causes:
- Title is inside a scaled container (inherits parent scale)
- FLIP is calculating scale delta instead of position delta
- Title animation is using `scale` instead of `x/y` + font-size

### 4. Implement a Fix

Focus on making the title **move through space** rather than scale. Consider:
- Animating title position (x, y) separately from container
- Using actual position values rather than scale transforms
- Ensuring title maintains readable size throughout transition
- Matching start/end positions precisely for smooth handoff

### 5. Verify

```bash
npm test -w @habit-tracker/frontend -- --run
node scripts/capture-animation-unified.js flip-modal --animations=open
node scripts/capture-animation-unified.js flip-modal --animations=close
```

**Check the filmstrips critically:**
- Can you read the title text in every frame during the morph?
- Does the title appear to travel horizontally/vertically?
- Is it clearly moving position, not just scaling?

### 6. Document and Exit

Update `.claude/plans/flip-animation-iteration.md`:

```markdown
## Iteration N (YYYY-MM-DD HH:MM) - Title Float Polish

### Observed (Before)
[Describe the title behavior in filmstrip - scaling? floating? at which frames?]

### Diagnosis
[What's causing the scale effect instead of float?]

### Changes Made
[What you changed to make it float instead of scale]

### Result
[What the filmstrips show after - is it floating now?]

### Status
[FIXED / PARTIAL / NOT FIXED]

### Next Steps (if not fixed)
[What to try next]
```

Commit:
```bash
git add -A
git commit -m "feat(animation): iteration N - [brief description]"
```

---

## Exit Conditions

**If title properly floats (not scales):**
Add to iteration log: `<promise>ANIMATION_COMPLETE</promise>`

**If stuck after 3+ attempts:**
Add to iteration log: `<stuck>NEEDS_HUMAN_REVIEW</stuck>`
Include: what you tried, what you observed, specific questions

**Otherwise:**
Exit cleanly. Document findings for next iteration.

---

## Success Criteria

### Title Float Effect
- [ ] Title text readable throughout the morph (not tiny/distorted)
- [ ] Title visibly moves through space (position change, not just scale)
- [ ] Title travels from card position to modal header (open)
- [ ] Title travels from modal header to card position (close)
- [ ] Smooth transition - no sudden jumps or size pops

### What to Avoid
- [ ] Title should NOT shrink to tiny size then grow
- [ ] Title should NOT appear to zoom in/out
- [ ] Title should NOT be unreadable at any point during morph

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/components/HabitItem.tsx` | Component with title animation |
| `packages/frontend/src/App.css` | Styles that might affect title |
| `.claude/plans/flip-animation-iteration.md` | Iteration log |
| `.claude/skills/gsap-animation-expert/SKILL.md` | FLIP reference |

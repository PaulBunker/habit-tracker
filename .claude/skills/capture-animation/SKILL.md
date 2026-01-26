---
name: capture-animation
description: Capture and analyze animation frames for visual debugging. Complete methodology for iterative animation fixes.
allowed-tools: Bash, Read, Task, Glob, Grep, Edit, Write
---

# Animation Debugging Skill

Use this skill for iterative animation debugging. It provides the complete methodology - your task prompt only needs to specify what the animation should look like and what's currently wrong.

---

## Phase 1: Capture Filmstrips

```bash
# Capture specific animation
node scripts/capture-animation-unified.js <config> <animation>

# Examples
node scripts/capture-animation-unified.js flip-modal open
node scripts/capture-animation-unified.js flip-modal close

# List available configs
node scripts/capture-animation-unified.js --list

# More frames for finer detail
node scripts/capture-animation-unified.js flip-modal open --frames=24
```

### Adjusting Capture Settings

Edit `scripts/animation-configs/<config>.json`:

```json
{
  "filmstrip": {
    "scale": 0.35,     // Larger = more detail (0.1=tiny, 0.5=large)
    "cols": 8,         // Fewer cols = bigger frames
    "labelHeight": 18  // Smaller = more frame space
  },
  "animations": {
    "open": {
      "frames": 16,    // More frames = finer timing
      "duration": 800
    }
  }
}
```

---

## Phase 2: Analyze Filmstrips

### Step 1: Frame-by-Frame Description Table

**BEFORE making ANY judgments**, describe each frame literally:

| Frame | Element Positions | Element Shapes | Layout Changes | Notes |
|-------|-------------------|----------------|----------------|-------|
| 0ms   | [WHERE is each element?] | [squashed/normal?] | [any jumps?] | |
| 53ms  | [be SPECIFIC] | [be SPECIFIC] | [be SPECIFIC] | |
| 107ms | ... | ... | ... | |

### Step 2: Use Specific Language

| ❌ Don't Say | ✅ Say Instead |
|-------------|----------------|
| "Looks good" | "Title at top-left, 20px margins, normal proportions" |
| "Seems smooth" | "Each frame shows ~10px movement, consistent spacing" |
| "Title is floating" | "Title is at center of screen, 200px from top" |
| "No obvious issues" | [Fill out the table first] |

### Step 3: Compare to Expected Behavior

```
EXPECTED: [What the prompt says should happen]
OBSERVED: [What you literally see in the filmstrip]
VERDICT:  [MATCH or BUG - be specific about which frames]
```

---

## Phase 3: Multi-Method Validation

For high confidence, use multiple validation methods:

### Method 1: Blind Sub-Agent Description

Launch sub-agents with **NO CONTEXT** about what the animation should do:

```
Prompt for sub-agent:
"Describe this image literally:
1. What UI elements do you see?
2. Where is each text element positioned? (top-left, center, etc.)
3. Are any elements distorted? (squashed, stretched, normal)
4. Where are buttons/icons positioned?
Do NOT assume what this should look like. Just describe what you see."
```

**Why:** Sub-agents can't assume "it's probably fine" - they only describe raw observations.

### Method 2: Frame Comparison

Compare consecutive frames:

```
"Compare Frame A and Frame B:
1. What elements moved? From where to where?
2. What changed size or shape?
3. Did anything jump suddenly vs move smoothly?"
```

### Method 3: Expectation Matching

Main agent compares blind descriptions to expected behavior:

```
EXPECTED: Title at top-left of modal header
BLIND DESCRIPTION: "Text 'Morning Exercise' is in center of white rectangle"
VERDICT: MISMATCH - title position wrong
```

---

## Phase 4: Diagnose & Fix

### Consult Animation Expert

Use `/gsap-animation-expert` skill for:
- FLIP plugin patterns
- Nested element handling
- Counter-scaling techniques
- Hero animation patterns

Examples are in `.claude/skills/gsap-animation-expert/examples/`

### Common Issues & Causes

| Symptom | Likely Cause |
|---------|--------------|
| Element squashed | Inheriting parent scale transforms |
| Element in wrong position | Position calculated incorrectly, or animated from wrong start |
| Sibling elements jump | Element removed from DOM flow |
| Animation jumps/stutters | Timing mismatch, or transform-origin conflict |

---

## Phase 5: Verify Fix

After making changes:

1. **Capture new filmstrips**
2. **Fill out frame-by-frame table again** (don't skip this)
3. **Use blind sub-agents** for critical frames
4. **Compare before/after** tables explicitly

**Do NOT claim success without frame-by-frame evidence.**

---

## Phase 6: Document Iteration

Update the iteration plan file with:

```markdown
## Iteration N (YYYY-MM-DD HH:MM)

### Frame-by-Frame Analysis (Before)
| Frame | Position | Shape | Layout | Notes |
|-------|----------|-------|--------|-------|
| 0ms   | ... | ... | ... | ... |

### Issues Identified
1. [specific issue at specific frames]

### Diagnosis
[root cause]

### Changes Made
[what and why]

### Frame-by-Frame Analysis (After)
| Frame | Position | Shape | Layout | Notes |
|-------|----------|-------|--------|-------|
| 0ms   | ... | ... | ... | ... |

### Status
[FIXED / PARTIAL / NOT FIXED]

### Remaining Issues
[be honest]
```

---

## Phase 7: Exit Conditions

### SUCCESS
All criteria verified frame-by-frame → add `<promise>ANIMATION_COMPLETE</promise>`

### STUCK (4-5 iterations without progress)

Before giving up, expand the knowledge base:

1. **Launch research agents** to search for techniques related to the specific issue
2. **Add findings** to `.claude/skills/gsap-animation-expert/examples/`
3. **Retry** with new knowledge

```bash
# Example research prompts:
# "GSAP FLIP nested element animation"
# "GSAP counter-scaling child elements"
# "React FLIP hero text animation"
```

If still stuck after research → add `<stuck>NEEDS_HUMAN_REVIEW</stuck>`

### OTHERWISE

Exit cleanly with detailed frame-by-frame analysis showing exactly what's still wrong. Your documented findings help the next iteration.

---

## Anti-Patterns - NEVER DO THESE

- ❌ Claim success without frame-by-frame evidence
- ❌ Skip frames in analysis
- ❌ Use vague words ("appears", "seems", "looks like") without specifics
- ❌ Make changes without first describing current state
- ❌ Give up without launching research agents first

---

## Config Reference

### Available Configs

```bash
node scripts/capture-animation-unified.js --list
```

### Creating New Configs

Create JSON in `scripts/animation-configs/`:

```json
{
  "name": "Animation Name",
  "url": "http://localhost:5174/page",
  "viewport": { "width": 800, "height": 600 },
  "filmstrip": { "scale": 0.35, "cols": 8, "labelHeight": 18 },
  "animations": {
    "animationName": {
      "setup": [{ "waitFor": ".selector" }, { "click": ".trigger" }],
      "trigger": { "click": ".button" },
      "duration": 800,
      "frames": 16
    }
  }
}
```

---

## Quick Reference

```bash
# Capture
node scripts/capture-animation-unified.js flip-modal open

# View filmstrip
# Use Read tool on .playwright-mcp/filmstrip-flip-modal-open.png

# Consult animation patterns
# Use /gsap-animation-expert skill
```

---
name: capture-animation
description: Capture animation frames for visual debugging. Use capture scripts instead of browser automation.
allowed-tools: Bash, Read
---

# Capture Animation

Use this for visual debugging of animations. ALWAYS prefer this over playwright MCP tools.

## Quick Commands

```bash
# Capture specific animation
node scripts/capture-animation-unified.js flip-modal open

# Capture all animations in a config
node scripts/capture-animation-unified.js flip-modal

# Test capture pipeline with verification
node scripts/capture-animation-unified.js progress-bar fill --verify

# List available configs
node scripts/capture-animation-unified.js --list
```

## CLI Options

| Option | Description |
|--------|-------------|
| `--frames=N` | Override frame count |
| `--duration=MS` | Override animation duration |
| `--verify` | Run verification (if config supports it) |
| `--output=DIR` | Output directory (default: `.playwright-mcp`) |
| `--list` | List available configs |

## Output

Filmstrip images saved to `.playwright-mcp/` directory:
- `filmstrip-{config}-{animation}.png`

---

# Filmstrip Analysis Methodology

**This is critical.** When analyzing filmstrips, you must be EXTREMELY rigorous. Vague observations lead to false conclusions.

## Step 1: Frame-by-Frame Description Table

**BEFORE making ANY judgments**, describe each frame in a table:

| Frame | Element Positions | Element Shapes | Layout Changes | Other |
|-------|-------------------|----------------|----------------|-------|
| 0ms   | [WHERE is each element?] | [squashed/normal/stretched?] | [any jumps/shifts?] | |
| 53ms  | [be SPECIFIC] | [be SPECIFIC] | [be SPECIFIC] | |
| 107ms | ... | ... | ... | |

### Position Descriptions - Be LITERAL

❌ **Wrong:** "Title is visible"
✅ **Right:** "Title is at top-left of card, ~20px from edges"

❌ **Wrong:** "Title is floating"
✅ **Right:** "Title is in CENTER of screen, ~200px from top, not near header"

❌ **Wrong:** "Element moved"
✅ **Right:** "X button shifted 50px left from frame 0"

### Shape Descriptions - Be SPECIFIC

❌ **Wrong:** "Title looks off"
✅ **Right:** "Title appears vertically compressed to ~60% normal height"

❌ **Wrong:** "Text seems squashed"
✅ **Right:** "Text height is ~10px, should be ~16px based on frame 0"

## Step 2: Compare to Expected Behavior

After describing what you SEE, compare to what SHOULD happen:

```
EXPECTED: Title travels from point A (card header) to point B (modal header)
OBSERVED: Title is in center of screen, nowhere near the expected path
VERDICT: BUG - title position is wrong
```

## Step 3: Identify ALL Issues

For each issue found, document:
1. **Which frames** show the problem
2. **What exactly** is wrong (position, shape, timing)
3. **What it should be** instead

## Step 4: Adjust Settings if Needed

If you can't see enough detail:

```bash
# More frames for finer timing
node scripts/capture-animation-unified.js flip-modal open --frames=24

# Edit config for larger scale
```

Edit `scripts/animation-configs/{config}.json`:
```json
{
  "filmstrip": {
    "scale": 0.5,      // Increase for more detail (0.1 = tiny, 0.5 = large)
    "cols": 6,         // Fewer columns = bigger frames
    "labelHeight": 18  // Smaller labels = more frame space
  }
}
```

---

# Anti-Patterns - NEVER DO THESE

| ❌ Don't Say | ✅ Say Instead |
|-------------|----------------|
| "Looks good" | "Title at top-left, 20px margins, normal proportions" |
| "Seems smooth" | "Each frame shows ~10px movement, consistent spacing" |
| "No obvious issues" | [Fill out the frame-by-frame table first] |
| "Animation appears correct" | "Frame 0: X at position A. Frame 100: X at position B. Matches expected path." |
| "Title is floating" | "Title is at coordinates (x, y) relative to modal" |

**Rules:**
- NEVER claim success without frame-by-frame evidence
- NEVER skip frames in analysis
- NEVER use "appears", "seems", "looks like" without specifics
- NEVER make changes without first describing current state
- ALWAYS fill out the description table BEFORE making judgments

---

# Verification Checklist Template

Before claiming an animation is fixed:

```markdown
### Frame-by-Frame Verification
| Frame | [Element 1] Position | [Element 1] Shape | [Element 2] Position | Issues |
|-------|---------------------|-------------------|---------------------|--------|
| 0ms   | [specific location] | [specific shape]  | [specific location] | none/[issue] |
| Nms   | ... | ... | ... | ... |

### Success Criteria
- [ ] Element A travels from [start] to [end] (verified at frames X, Y, Z)
- [ ] Element A maintains aspect ratio (verified: height is Npx throughout)
- [ ] Element B does not shift (verified: position unchanged across all frames)
- [ ] No layout jumps (verified: sibling elements stable)

### Remaining Issues
[List any issues that still exist - be specific about which frames]
```

---

# Config Reference

## Available Configs

| Config | Animations | Description |
|--------|------------|-------------|
| `flip-modal` | open, close | Card-to-modal FLIP animation |
| `progress-bar` | fill | Deterministic test animation |

## Creating New Configs

Create JSON in `scripts/animation-configs/`:

```json
{
  "name": "Animation Name",
  "description": "What this animation does",
  "url": "http://localhost:5174/page",
  "postNavWait": 300,
  "viewport": { "width": 800, "height": 600 },
  "filmstrip": {
    "scale": 0.35,
    "cols": 8,
    "labelHeight": 18
  },
  "animations": {
    "animationName": {
      "setup": [
        { "waitFor": ".selector" },
        { "click": ".selector" },
        { "wait": 500 }
      ],
      "trigger": { "click": ".trigger" },
      "duration": 800,
      "frames": 16
    }
  }
}
```

---

# Important

DO NOT use playwright MCP tools for iterative animation debugging - they are expensive.

Use this script, then READ the filmstrip image to analyze:

```bash
node scripts/capture-animation-unified.js flip-modal open
# Then use Read tool on .playwright-mcp/filmstrip-flip-modal-open.png
```

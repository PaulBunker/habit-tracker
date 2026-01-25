---
name: capture-animation
description: Capture animation frames for visual debugging. Use capture scripts instead of browser automation.
allowed-tools: Bash, Read
---

# Capture Animation

Use this for visual debugging of animations. ALWAYS prefer this over playwright MCP tools.

## Quick Commands

```bash
# Capture modal open animation
node scripts/capture-animation-unified.js modal open

# Capture modal close animation
node scripts/capture-animation-unified.js modal close

# Capture all animations in a config
node scripts/capture-animation-unified.js modal

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

Filmstrip images saved to `.playwright-mcp/` directory with naming:
- `filmstrip-{config}-{animation}.png`

## Available Configs

| Config | Animations | Description |
|--------|------------|-------------|
| `modal` | open, close | Card-to-modal animation from habit tracker |
| `progress-bar` | fill | Deterministic progress bar for verification |

## Adding New Animations

Create a JSON config in `scripts/animation-configs/` following this schema:

```json
{
  "name": "Animation Name",
  "description": "Description",
  "url": "http://localhost:5174/page",
  "postNavWait": 300,
  "animations": {
    "animationName": {
      "setup": [
        { "waitFor": ".selector" },
        { "click": ".selector" },
        { "wait": 500 }
      ],
      "trigger": { "click": ".trigger-selector" },
      "duration": 800,
      "frames": 10,
      "verify": {
        "selector": "[data-testid='element']",
        "attribute": "data-progress",
        "tolerance": 0.05
      }
    }
  },
  "filmstrip": {
    "backgroundColor": "#1a1a2e",
    "scale": 0.5,
    "cols": 6
  }
}
```

## IMPORTANT

DO NOT use playwright MCP tools for iterative animation debugging - they are expensive.
Use this script instead, then view the filmstrip images with:

```bash
open .playwright-mcp/filmstrip-modal-open.png
```

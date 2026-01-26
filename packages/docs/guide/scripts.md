# Scripts

Utility scripts for development, deployment, and debugging.

## Animation Capture

Tools for capturing UI animations frame-by-frame.

### capture-animation-unified.js (Recommended)

A unified, configurable animation capture script using JSON configs.

```bash
# Capture specific animation
node scripts/capture-animation-unified.js flip-modal open
node scripts/capture-animation-unified.js flip-modal close

# Capture all animations in config
node scripts/capture-animation-unified.js flip-modal

# With options
node scripts/capture-animation-unified.js flip-modal open --frames=20 --duration=1000

# With verification
node scripts/capture-animation-unified.js progress-bar fill --verify

# List available configs
node scripts/capture-animation-unified.js --list
```

**Available Configs:**

| Config | Animations | Description |
|--------|------------|-------------|
| `flip-modal` | open, close | Card-to-modal FLIP from habit tracker |
| `flip-playground` | open, close | Card-to-modal FLIP from playground |
| `progress-bar` | fill | Deterministic progress bar for verification |

**Options:**

| Option | Description |
|--------|-------------|
| `--frames=N` | Override frame count |
| `--duration=MS` | Override animation duration |
| `--verify` | Run verification (if config supports it) |
| `--output=DIR` | Output directory (default: `.playwright-mcp`) |

Configs are stored in `scripts/animation-configs/`. See existing configs for schema examples.

### capture-flip-debug.js

Captures FLIP animations from the habit tracker modal.

```bash
node scripts/capture-flip-debug.js open --frames=36 --duration=800
node scripts/capture-flip-debug.js close --frames=36 --duration=1200
node scripts/capture-flip-debug.js both
```

### capture-progress-animation.js

Captures a deterministic progress bar animation for verifying the capture pipeline.

```bash
node scripts/capture-progress-animation.js --frames=36
```

Test page available at `/animation-test` when running the dev server.

## Daemon Management

| Script | Description |
|--------|-------------|
| `daemon-status.sh` | Check daemon status |
| `restore-hosts.sh` | Restore `/etc/hosts` |
| `install-daemon.sh` | Install launchd daemon |
| `uninstall-daemon.sh` | Remove daemon |

## Production

| Script | Description |
|--------|-------------|
| `install-production.sh` | Full production install |
| `uninstall-production.sh` | Remove production install |

## Development

| Script | Description |
|--------|-------------|
| `cleanup-test-data.sh` | Remove test databases |
| `fix-local-domains.sh` | Fix `/etc/hosts` domains |

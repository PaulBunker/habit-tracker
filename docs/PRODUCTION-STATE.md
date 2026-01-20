# Production State Tracking

**IMPORTANT**: This document tracks all system modifications made by the Habit Tracker. Keep this updated during development/testing.

## Current System Modifications

### 1. Hosts File (`/etc/hosts`)
**Status**: ACTIVE - Being modified by daemon

```bash
# View current state
cat /etc/hosts | grep -A10 "HABIT-TRACKER"

# Manual cleanup if needed
sudo sed -i '' '/# HABIT-TRACKER-START/,/# HABIT-TRACKER-END/d' /etc/hosts
```

**Markers used**:
- `# HABIT-TRACKER-START`
- `# HABIT-TRACKER-END`

### 2. Sudoers Entry (`/etc/sudoers.d/habit-tracker`)
**Status**: ACTIVE - Allows passwordless sudo for daemon

```bash
# View current state
sudo cat /etc/sudoers.d/habit-tracker

# Manual cleanup
sudo rm /etc/sudoers.d/habit-tracker
```

**Contents**:
```
paulbunker ALL=(ALL) NOPASSWD: /bin/cp /tmp/habit-tracker-hosts-temp /etc/hosts
paulbunker ALL=(ALL) NOPASSWD: /usr/bin/killall -HUP mDNSResponder
```

### 3. LaunchAgents (~/Library/LaunchAgents/)
**Status**: ACTIVE - 3 services running

| Service | Plist File | Status |
|---------|------------|--------|
| Backend | com.habit-tracker.backend.plist | Running on :3000 |
| Frontend | com.habit-tracker.frontend.plist | Running on :5173 |
| Daemon | com.habit-tracker.daemon.plist | Running (60s cycle) |

```bash
# View status
launchctl list | grep habit-tracker

# Stop all services
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.*.plist

# Remove plist files
rm ~/Library/LaunchAgents/com.habit-tracker.*.plist
```

### 4. Data Directory (~/.habit-tracker/)
**Status**: ACTIVE

| Path | Purpose |
|------|---------|
| ~/.habit-tracker/data/habit-tracker.db | SQLite database |
| ~/.habit-tracker/logs/backend.log | Backend logs |
| ~/.habit-tracker/logs/frontend.log | Frontend logs |
| ~/.habit-tracker/logs/daemon.log | Daemon logs (most useful for debugging) |
| ~/.habit-tracker/backups/ | Hosts file backups before each modification |

```bash
# View daemon activity
tail -f ~/.habit-tracker/logs/daemon.log

# Full cleanup (DESTRUCTIVE - removes all data)
rm -rf ~/.habit-tracker
```

### 5. Unix Socket (~/.habit-tracker/daemon.sock)
**Status**: ACTIVE - IPC between backend and daemon

| Path | Purpose |
|------|---------|
| ~/.habit-tracker/daemon.sock | Unix socket for instant daemon refresh |

```bash
# Check if socket exists (daemon is running)
ls -la ~/.habit-tracker/daemon.sock

# Test socket manually
echo "ping" | nc -U ~/.habit-tracker/daemon.sock

# Cleanup (socket auto-removed on daemon stop)
rm ~/.habit-tracker/daemon.sock
```

**Protocol**:
- `ping` → `pong` (health check)
- `refresh` → `ok` (trigger immediate hosts file check)

### 6. Temp Files
**Status**: Transient - created and deleted during hosts file updates

| Path | Purpose |
|------|---------|
| /tmp/habit-tracker-hosts-temp | Temporary hosts content before sudo cp |

---

## Quick Cleanup Commands

### Full Production Uninstall
```bash
# 1. Stop services
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.*.plist

# 2. Remove plist files
rm ~/Library/LaunchAgents/com.habit-tracker.*.plist

# 3. Clean hosts file
sudo sed -i '' '/# HABIT-TRACKER-START/,/# HABIT-TRACKER-END/d' /etc/hosts

# 4. Remove sudoers entry
sudo rm /etc/sudoers.d/habit-tracker

# 5. Flush DNS
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# 6. Optional: Remove data
rm -rf ~/.habit-tracker
```

### Emergency Hosts Restore
If websites are blocked and you need immediate access:
```bash
sudo sed -i '' '/# HABIT-TRACKER-START/,/# HABIT-TRACKER-END/d' /etc/hosts
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

---

## Known Behaviors

### Blocking Delay
- Backend notifies daemon instantly via Unix socket IPC (~10ms)
- Daemon also polls every **30 seconds** as fallback for time-based triggers
- After completing habits, blocking should update within 1 second

### DNS Caching
- macOS caches DNS entries
- Daemon flushes cache after hosts file changes
- Browsers may have additional caching (close/reopen tab)

### Chrome Secure DNS
- **Must be set to "OS default"** for hosts blocking to work
- If set to specific provider (Cloudflare, Google), hosts file is bypassed
- Location: chrome://settings/security → "Use secure DNS"

---

## Debugging

### Check if daemon is running
```bash
launchctl list | grep habit-tracker.daemon
pgrep -f "packages/daemon/dist/index.js"
```

### Check daemon logs
```bash
tail -20 ~/.habit-tracker/logs/daemon.log
```

### Check what's currently blocked
```bash
cat /etc/hosts | grep -A20 "HABIT-TRACKER-START"
```

### Force daemon restart
```bash
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
launchctl load ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
```

---

## File Modifications Made

These project files were modified from their original state:

| File | Changes |
|------|---------|
| packages/backend/src/db/index.ts | Production default path (~/.habit-tracker/data) |
| packages/backend/src/routes/habits.ts | Added notifyDaemon() calls after mutations |
| packages/backend/src/routes/settings.ts | Added notifyDaemon() calls after mutations |
| packages/backend/src/routes/status.ts | Implemented /api/daemon/sync endpoint |
| packages/daemon/src/scheduler.ts | Production default path |
| packages/daemon/src/hosts-manager.ts | sudo cp, www. variants, /tmp path |
| packages/daemon/src/index.ts | Added socket server, reduced polling to 30s |
| packages/shared/package.json | CJS build fix (adds package.json to dist/cjs) |
| scripts/install-daemon.sh | Dynamic NODE_PATH |
| package.json | Added install:production, uninstall:production |

New files created:
- packages/daemon/src/socket-server.ts
- packages/shared/src/daemon-client.ts
- scripts/install-production.sh
- scripts/uninstall-production.sh
- docs/workflows/deployment-guide.md (migrated to packages/docs/guide/deployment.md)
- docs/PRODUCTION-STATE.md (this file)

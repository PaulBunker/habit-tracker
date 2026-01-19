# @habit-tracker/daemon

Background service that enforces website blocking by managing `/etc/hosts`. Runs with elevated privileges and communicates with the backend via Unix socket IPC.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main daemon loop and lifecycle management |
| `src/hosts-manager.ts` | `/etc/hosts` file manipulation with backup/restore |
| `src/scheduler.ts` | Habit checking logic and deadline calculations |
| `src/socket-server.ts` | Unix socket IPC server for backend communication |
| `src/schema.ts` | Zod schemas for validating API responses |

## How Blocking Works

1. **Trigger**: Deadline passes OR backend signals state change
2. **Check**: Daemon queries backend API for incomplete timed habits
3. **Block**: If any habits are overdue, add domains to `/etc/hosts`
4. **Unblock**: When all overdue habits are completed/skipped, remove entries

The daemon modifies `/etc/hosts` with entries like:

```
# HABIT_TRACKER_START
127.0.0.1 twitter.com
127.0.0.1 www.twitter.com
127.0.0.1 reddit.com
127.0.0.1 www.reddit.com
# HABIT_TRACKER_END
```

## Development

```bash
# Run daemon (requires sudo for /etc/hosts access)
sudo npm run dev -w @habit-tracker/daemon

# Check daemon status
npm run daemon:status

# Emergency restore (remove all blocks)
npm run daemon:restore

# View logs
tail -f ~/.habit-tracker/logs/daemon.log
```

## Architecture

The daemon uses three mechanisms to stay in sync:

1. **IPC Socket**: Backend notifies daemon immediately on habit completion
2. **Deadline Timers**: Precise timers fire when habit deadlines pass
3. **Fallback Polling**: 60-second interval catch-all for edge cases

### Data Flow

```
Backend API → (habit completed) → IPC trigger → checkAndUpdate()
                                               ↓
Deadline Timer → (time passes) ────────────────→ checkHabits()
                                               ↓
                                         updateHostsFile()
                                               ↓
                                         /etc/hosts modified
```

## IPC Commands

The daemon listens on a Unix socket for commands from the backend:

| Command | Description |
|---------|-------------|
| `refresh` | Re-check habits and update blocking state |
| `reset` | Emergency reset - unblock all websites |

## Safety Features

- **Backup/Restore**: Original `/etc/hosts` backed up before modification
- **Marker Comments**: Only modifies lines between `HABIT_TRACKER_START/END`
- **Graceful Shutdown**: Cleans up on SIGINT/SIGTERM
- **Error Logging**: All operations logged to `~/.habit-tracker/logs/`

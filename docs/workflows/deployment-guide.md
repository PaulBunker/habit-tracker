# Production Deployment Guide

This guide explains how to deploy the Habit Tracker to production on macOS, ensuring all services persist across laptop restarts.

## Overview

The Habit Tracker consists of three services that run as macOS launchd agents:

| Component | Port | Description |
|-----------|------|-------------|
| Backend API | 3000 | Express.js API server for habit management |
| Frontend | 5173 | Vite preview server for the React UI |
| Daemon | N/A | Background service that manages hosts file blocking |

All services are configured to:
- Start automatically at login
- Restart automatically if they crash
- Log output to `~/.habit-tracker/logs/`

## Prerequisites

- macOS (tested on macOS 14+)
- Node.js 18 or higher
- npm 9 or higher
- sudo access (for hosts file modification)

## Quick Installation

```bash
# Clone and enter the project
cd habit-tracker

# Install dependencies
npm install

# Run the production installer
bash scripts/install-production.sh
```

The installer will:
1. Build all packages (with version metadata)
2. Create `~/.habit-tracker/` directories
3. Run database migrations
4. Create and load launchd services
5. Verify deployed version matches build

## Data Locations

| Path | Description |
|------|-------------|
| `~/.habit-tracker/data/habit-tracker.db` | SQLite database |
| `~/.habit-tracker/logs/backend.log` | Backend API logs |
| `~/.habit-tracker/logs/frontend.log` | Frontend server logs |
| `~/.habit-tracker/logs/daemon.log` | Daemon logs |
| `~/.habit-tracker/backups/` | Hosts file backups |

## Verification

### Check Services Are Running

```bash
launchctl list | grep habit-tracker
```

Expected output shows three services:
```
-	0	com.habit-tracker.backend
-	0	com.habit-tracker.daemon
-	0	com.habit-tracker.frontend
```

### Check Backend Health

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### Check Frontend

Open http://localhost:5173 in your browser.

### Verify Deployed Version

Each build includes version metadata in HTML meta tags. To check the deployed version:

```bash
curl -s http://localhost:5173 | grep -E "(app-version|build-time)"
```

Expected output:
```html
<meta name="app-version" content="abc1234">
<meta name="build-time" content="2024-01-18T12:00:00.000Z">
```

The `app-version` should match the git commit hash that was deployed. You can also view this in browser DevTools under Elements → `<head>`.

### Check Daemon Logs

```bash
tail -f ~/.habit-tracker/logs/daemon.log
```

You should see periodic "Checking habits..." messages every 30 seconds, plus instant refresh messages when habits are completed.

## Testing Hosts File Blocking

1. **Create a test habit** with a deadline that has passed (e.g., deadline at current time minus 1 hour)

2. **Add blocked websites** in Settings (e.g., `example.com`)

3. **Changes apply instantly** (or within 30 seconds if daemon is recovering)

4. **Verify hosts file has blocked entries:**
   ```bash
   cat /etc/hosts | grep HABIT-TRACKER
   ```
   Expected output:
   ```
   # BEGIN HABIT-TRACKER BLOCK
   127.0.0.1 example.com
   127.0.0.1 www.example.com
   # END HABIT-TRACKER BLOCK
   ```

5. **Test blocking works:**
   ```bash
   ping example.com
   ```
   Should resolve to 127.0.0.1

6. **Complete all habits** in the UI

7. **Verify unblocked instantly** (or within 30 seconds):
   ```bash
   cat /etc/hosts | grep HABIT-TRACKER
   ```
   Should show no blocked domains.

## Service Management

### Stop All Services

```bash
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.*.plist
```

### Start All Services

```bash
launchctl load ~/Library/LaunchAgents/com.habit-tracker.*.plist
```

### Restart a Specific Service

```bash
# Example: restart backend
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.backend.plist
launchctl load ~/Library/LaunchAgents/com.habit-tracker.backend.plist
```

### View Service Status

```bash
launchctl list | grep habit-tracker
```

## Uninstallation

```bash
bash scripts/uninstall-production.sh
```

This will:
1. Restore the hosts file (remove any blocked entries)
2. Unload and remove all launchd services
3. Optionally remove all data, logs, and backups

## Rollback / Emergency Recovery

If websites are blocked and you need to unblock immediately:

```bash
# Restore hosts file
npm run daemon:restore

# Or manually
sudo sed -i '' '/# BEGIN HABIT-TRACKER BLOCK/,/# END HABIT-TRACKER BLOCK/d' /etc/hosts
```

## Troubleshooting

### Services Not Starting

Check the error logs:
```bash
cat ~/.habit-tracker/logs/backend.error.log
cat ~/.habit-tracker/logs/frontend.error.log
cat ~/.habit-tracker/logs/daemon.error.log
```

### Database Issues

The database is at `~/.habit-tracker/data/habit-tracker.db`. To reset:
```bash
rm ~/.habit-tracker/data/habit-tracker.db
DB_PATH=~/.habit-tracker/data npm run db:migrate -w @habit-tracker/backend
```

### Hosts File Not Updating

The daemon needs sudo access. Check if there are sudo permission issues in the daemon logs:
```bash
grep -i "permission\|sudo\|error" ~/.habit-tracker/logs/daemon.log
```

### Port Already in Use

If port 3000 or 5173 is already in use:
```bash
# Find what's using the port
lsof -i :3000
lsof -i :5173

# Kill the process
kill -9 <PID>

# Restart services
bash scripts/install-production.sh
```

## Chrome Homepage Integration

Setting Chrome to open the Habit Tracker on new tabs creates a powerful workflow: when a blocked website redirects you, opening a new tab immediately shows which habits need completing.

### Manual Setup

1. Open Chrome and go to `chrome://settings/`
2. In the left sidebar, click **On startup**
3. Select **Open a specific page or set of pages**
4. Click **Add a new page**
5. Enter `http://localhost:5173`
6. Click **Add**

Alternatively, to set it as your homepage (accessible via the Home button):
1. Go to `chrome://settings/appearance`
2. Enable **Show home button**
3. Select **Enter custom web address**
4. Enter `http://localhost:5173`

### Automated Setup (macOS)

You can use a Chrome policy to automatically configure the homepage:

```bash
bash scripts/setup-chrome-homepage.sh
```

This creates a Chrome managed policy that:
- Sets the homepage to `http://localhost:5173`
- Adds it to the pages opened on startup
- Requires Chrome restart to take effect

To remove the policy:
```bash
bash scripts/setup-chrome-homepage.sh --remove
```

> **Note:** Chrome policies require admin privileges and Chrome must be restarted after changes.

## Architecture Notes

- **Backend** runs as a standalone Node.js process serving the API
- **Frontend** uses Vite's preview server to serve the built static files
- **Daemon** receives instant refresh signals from backend via Unix socket at `~/.habit-tracker/daemon.sock`, with 30-second fallback polling for time-based triggers
- All three services share the same SQLite database at `~/.habit-tracker/data/habit-tracker.db`
- Environment variable `NODE_ENV=production` ensures proper database path defaults

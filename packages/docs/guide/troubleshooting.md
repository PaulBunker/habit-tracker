# Troubleshooting Guide

This guide covers common issues and their solutions.

## Quick Diagnostic Commands

```bash
# Check all services are running
launchctl list | grep habit-tracker

# Check daemon status
npm run daemon:status

# View daemon logs (most useful)
tail -f ~/.habit-tracker/logs/daemon.log

# Check what's currently blocked
cat /etc/hosts | grep -A20 "HABIT-TRACKER-START"

# Emergency unblock all websites
npm run daemon:restore
```

## Website Blocking Issues

### Websites Not Being Blocked

1. **Verify daemon is running:**
   ```bash
   launchctl list | grep habit-tracker.daemon
   pgrep -f "packages/daemon/dist/index.js"
   ```

2. **Check hosts file has entries:**
   ```bash
   cat /etc/hosts | grep HABIT-TRACKER
   ```

3. **Flush DNS cache:**
   ```bash
   sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
   ```

4. **Check Chrome Secure DNS setting:**
   - Go to `chrome://settings/security`
   - "Use secure DNS" must be set to **"With your current service provider"** (OS default)
   - If set to Cloudflare/Google, the hosts file is bypassed

5. **Try a different browser:**
   - Some browsers cache DNS aggressively
   - Close and reopen browser tabs after blocking changes

### Websites Still Blocked After Completing Habits

1. **Check blocking should have stopped:**
   ```bash
   npm run daemon:status
   ```
   Should show empty `blockedDomains` array.

2. **Force daemon refresh:**
   ```bash
   curl -X POST http://localhost:3000/api/daemon/sync
   ```

3. **Check hosts file was cleaned:**
   ```bash
   cat /etc/hosts | grep HABIT-TRACKER
   ```
   Should show nothing between the markers.

4. **Flush DNS cache:**
   ```bash
   sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
   ```

### Emergency: Need Immediate Access

If you need to unblock immediately without completing habits:

```bash
# Option 1: Use the app's emergency reset
npm run daemon:restore

# Option 2: Manual removal
sudo sed -i '' '/# HABIT-TRACKER-START/,/# HABIT-TRACKER-END/d' /etc/hosts
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

## Daemon Issues

### Daemon Not Starting

1. **Check logs for errors:**
   ```bash
   cat ~/.habit-tracker/logs/daemon.error.log
   tail -20 ~/.habit-tracker/logs/daemon.log
   ```

2. **Verify plist is loaded:**
   ```bash
   launchctl list | grep habit-tracker.daemon
   ```

3. **Manually restart:**
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
   launchctl load ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
   ```

4. **Check for port/socket conflicts:**
   ```bash
   ls -la ~/.habit-tracker/daemon.sock
   ```
   If socket exists but daemon isn't running, remove it:
   ```bash
   rm ~/.habit-tracker/daemon.sock
   ```

### Permission Errors

The daemon needs sudo access to modify `/etc/hosts`. Check sudoers:

```bash
sudo cat /etc/sudoers.d/habit-tracker
```

Should contain rules allowing passwordless sudo for specific commands. If missing, re-run the installation script.

### Daemon Not Responding to IPC

1. **Test socket manually:**
   ```bash
   echo "ping" | nc -U ~/.habit-tracker/daemon.sock
   ```
   Should respond with `pong`.

2. **Check backend is notifying daemon:**
   Look for "Refresh triggered" messages in daemon.log after completing a habit.

## Backend/Frontend Issues

### Services Not Starting

1. **Check error logs:**
   ```bash
   cat ~/.habit-tracker/logs/backend.error.log
   cat ~/.habit-tracker/logs/frontend.error.log
   ```

2. **Check ports are available:**
   ```bash
   lsof -i :3000   # Production backend
   lsof -i :3001   # Development backend
   lsof -i :5173   # Production frontend
   lsof -i :5174   # Development frontend
   ```

3. **Kill conflicting processes:**
   ```bash
   kill -9 <PID>
   ```

### Database Issues

1. **Database locked error:**
   - Close any other running instances
   - Check for multiple backend processes:
     ```bash
     pgrep -f "packages/backend"
     ```

2. **Database corruption:**
   ```bash
   # Backup first!
   cp ~/.habit-tracker/data/habit-tracker.db ~/.habit-tracker/data/habit-tracker.db.backup

   # Reset database
   rm ~/.habit-tracker/data/habit-tracker.db
   DB_PATH=~/.habit-tracker/data npm run db:migrate -w @habit-tracker/backend
   ```

### API Errors

1. **Check backend health:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return `{"status":"ok",...}`

2. **Check CORS issues:**
   - Open browser DevTools → Network tab
   - Look for CORS-related errors

## Development vs Production Confusion

| Aspect | Development | Production |
|--------|-------------|------------|
| Backend | :3001 | :3000 |
| Frontend | :5174 | :5173 |
| Database | `./packages/backend/data/dev/` | `~/.habit-tracker/data/` |
| Command | `npm run dev` | `npm run start:prod` |

**Check which environment you're in:**
```bash
# Check running ports
lsof -i :3000 -i :3001 -i :5173 -i :5174 | grep LISTEN
```

## Build Issues

### Type Errors

Build shared package first (other packages depend on it):
```bash
npm run build -w @habit-tracker/shared
```

### Tests Failing

1. **Ensure shared package is built:**
   ```bash
   npm run build -w @habit-tracker/shared
   ```

2. **Run tests in isolation:**
   ```bash
   npm test -w @habit-tracker/backend
   ```

## Full System Reset

If all else fails, perform a clean reinstall:

```bash
# 1. Stop all services
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.*.plist

# 2. Remove plist files
rm ~/Library/LaunchAgents/com.habit-tracker.*.plist

# 3. Clean hosts file
sudo sed -i '' '/# HABIT-TRACKER-START/,/# HABIT-TRACKER-END/d' /etc/hosts

# 4. Remove sudoers entry
sudo rm /etc/sudoers.d/habit-tracker

# 5. Flush DNS
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# 6. Optional: Remove all data (DESTRUCTIVE)
rm -rf ~/.habit-tracker

# 7. Rebuild
npm run build

# 8. Reinstall
bash scripts/install-production.sh
```

## Getting Help

If you're still stuck:

1. Check daemon logs: `tail -100 ~/.habit-tracker/logs/daemon.log`
2. Check backend logs: `tail -100 ~/.habit-tracker/logs/backend.log`
3. File an issue with logs at https://github.com/PaulBunker/habit-tracker/issues

#!/bin/bash

# Habit Tracker Daemon Status Script
# Shows the current state of the daemon and hosts file blocking

set -e

CURRENT_USER=$(whoami)
HOME_DIR=$(eval echo ~$CURRENT_USER)
PLIST_PATH="$HOME_DIR/Library/LaunchAgents/com.habit-tracker.daemon.plist"
HOSTS_FILE="/etc/hosts"
BACKUP_DIR="$HOME_DIR/.habit-tracker/backups"
LOG_FILE="$HOME_DIR/.habit-tracker/logs/daemon.log"

echo "=========================================="
echo "  Habit Tracker Daemon Status"
echo "=========================================="
echo ""

# Check if daemon is installed
echo "Daemon Installation:"
if [ -f "$PLIST_PATH" ]; then
    echo "  ✓ Launchd plist exists at $PLIST_PATH"
else
    echo "  ✗ Daemon not installed (no plist found)"
fi
echo ""

# Check if daemon is running
echo "Daemon Process:"
if launchctl list 2>/dev/null | grep -q "com.habit-tracker.daemon"; then
    echo "  ✓ Daemon is running"
    PID=$(launchctl list | grep "com.habit-tracker.daemon" | awk '{print $1}')
    if [ "$PID" != "-" ]; then
        echo "  PID: $PID"
    fi
else
    echo "  ✗ Daemon is not running"
fi
echo ""

# Check hosts file for habit-tracker entries
echo "Hosts File Blocking Status:"
if grep -q "# HABIT-TRACKER-START" "$HOSTS_FILE" 2>/dev/null; then
    echo "  ⚠ Websites are currently BLOCKED"
    echo ""
    echo "  Blocked domains:"
    sed -n '/# HABIT-TRACKER-START/,/# HABIT-TRACKER-END/p' "$HOSTS_FILE" | grep "127.0.0.1" | awk '{print "    - " $2}'
else
    echo "  ✓ No websites currently blocked"
fi
echo ""

# Show backup info
echo "Backup Status:"
if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/hosts.backup.* 2>/dev/null | wc -l | tr -d ' ')
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        echo "  $BACKUP_COUNT backup(s) in $BACKUP_DIR"
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/hosts.backup.* 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            echo "  Latest: $(basename "$LATEST_BACKUP")"
        fi
    else
        echo "  No backups found"
    fi
else
    echo "  Backup directory does not exist"
fi
echo ""

# Show recent log entries
echo "Recent Log Entries:"
if [ -f "$LOG_FILE" ]; then
    tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /'
else
    echo "  No log file found"
fi
echo ""

echo "=========================================="
echo ""
echo "Commands:"
echo "  npm run daemon:restore  - Restore hosts file from backup"
echo "  tail -f ~/.habit-tracker/logs/daemon.log - View live logs"
echo ""

#!/bin/bash

# Habit Tracker Hosts File Restore Script
# Restores the hosts file from the latest backup

set -e

CURRENT_USER=$(whoami)
HOME_DIR=$(eval echo ~$CURRENT_USER)
BACKUP_DIR="$HOME_DIR/.habit-tracker/backups"
HOSTS_FILE="/etc/hosts"

echo "=========================================="
echo "  Habit Tracker Hosts Restore"
echo "=========================================="
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory does not exist at $BACKUP_DIR"
    exit 1
fi

# Find available backups
BACKUPS=$(ls -t "$BACKUP_DIR"/hosts.backup.* 2>/dev/null || true)

if [ -z "$BACKUPS" ]; then
    echo "Error: No backups found in $BACKUP_DIR"
    exit 1
fi

# Show available backups
echo "Available backups:"
echo ""
i=1
for backup in $BACKUPS; do
    BACKUP_DATE=$(basename "$backup" | sed 's/hosts.backup.//')
    echo "  [$i] $BACKUP_DATE"
    i=$((i + 1))
    if [ $i -gt 10 ]; then
        echo "  ... and more"
        break
    fi
done
echo ""

# Get the latest backup by default
LATEST_BACKUP=$(echo "$BACKUPS" | head -1)
LATEST_DATE=$(basename "$LATEST_BACKUP" | sed 's/hosts.backup.//')

echo "Latest backup: $LATEST_DATE"
echo ""
read -p "Restore from latest backup? [Y/n] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Remove habit-tracker entries from hosts file
echo ""
echo "Removing habit-tracker entries from hosts file..."

# Create a temp file without the habit-tracker section
TEMP_FILE=$(mktemp)
sed '/# HABIT-TRACKER-START/,/# HABIT-TRACKER-END/d' "$HOSTS_FILE" > "$TEMP_FILE"

# Use sudo to update hosts file
echo "Updating hosts file (may require password)..."
sudo cp "$TEMP_FILE" "$HOSTS_FILE"
rm "$TEMP_FILE"

# Flush DNS cache
echo "Flushing DNS cache..."
if command -v dscacheutil &> /dev/null; then
    sudo dscacheutil -flushcache
fi
if command -v killall &> /dev/null; then
    sudo killall -HUP mDNSResponder 2>/dev/null || true
fi

echo ""
echo "✓ Hosts file restored successfully!"
echo ""
echo "The habit-tracker blocking entries have been removed."
echo "Your original hosts file content has been preserved."
echo ""
echo "Note: If the daemon is still running, it may re-add blocked sites."
echo "To stop the daemon: launchctl unload ~/Library/LaunchAgents/com.habit-tracker.daemon.plist"
echo ""

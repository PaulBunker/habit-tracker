#!/bin/bash

set -e

echo "============================================"
echo "  Habit Tracker - Production Uninstall"
echo "============================================"
echo ""

# Get the current user and paths
CURRENT_USER=$(whoami)
HOME_DIR=$(eval echo ~$CURRENT_USER)
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
LAUNCH_AGENTS_DIR="$HOME_DIR/Library/LaunchAgents"

# Step 1: Restore hosts file (remove any blocked entries)
echo "[1/4] Restoring hosts file..."
if [ -f "$PROJECT_DIR/scripts/restore-hosts.sh" ]; then
    bash "$PROJECT_DIR/scripts/restore-hosts.sh" || true
fi

# Step 2: Unload and remove services
echo ""
echo "[2/4] Stopping and removing services..."

SERVICES=(
    "com.habit-tracker.daemon"
    "com.habit-tracker.backend"
    "com.habit-tracker.frontend"
    "com.habit-tracker.caddy"
)

for SERVICE in "${SERVICES[@]}"; do
    PLIST="$LAUNCH_AGENTS_DIR/$SERVICE.plist"
    if [ -f "$PLIST" ]; then
        echo "  Unloading $SERVICE..."
        launchctl unload "$PLIST" 2>/dev/null || true
        rm -f "$PLIST"
        echo "  Removed $PLIST"
    fi
done

# Step 3: Ask about /etc/hosts cleanup
echo ""
echo "[3/4] Cleaning up /etc/hosts..."
if grep -q "habits.localhost" /etc/hosts 2>/dev/null; then
    read -p "Remove habits.localhost entries from /etc/hosts? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing habits.localhost entries (requires sudo)..."
        sudo sed -i '' '/habits\.localhost/d' /etc/hosts
        sudo dscacheutil -flushcache 2>/dev/null || true
        sudo killall -HUP mDNSResponder 2>/dev/null || true
        echo "  ✓ Removed habits.localhost entries"
    else
        echo "  Keeping habits.localhost entries in /etc/hosts"
    fi
else
    echo "  No habits.localhost entries found in /etc/hosts"
fi

# Step 4: Ask about data removal
echo ""
echo "[4/4] Data cleanup..."
echo ""
echo "The following directories contain your habit data and logs:"
echo "  ~/.habit-tracker/data    (database)"
echo "  ~/.habit-tracker/logs    (log files)"
echo "  ~/.habit-tracker/backups (hosts file backups)"
echo ""

read -p "Do you want to remove all data, logs, and backups? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$HOME_DIR/.habit-tracker"
    echo "All data removed."
else
    echo "Data preserved at ~/.habit-tracker"
fi

echo ""
echo "============================================"
echo "  Uninstall Complete!"
echo "============================================"
echo ""
echo "All Habit Tracker services have been stopped and removed."
echo ""

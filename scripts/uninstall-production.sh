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
echo "[1/3] Restoring hosts file..."
if [ -f "$PROJECT_DIR/scripts/restore-hosts.sh" ]; then
    bash "$PROJECT_DIR/scripts/restore-hosts.sh" || true
fi

# Step 2: Unload and remove services
echo ""
echo "[2/3] Stopping and removing services..."

SERVICES=(
    "com.habit-tracker.daemon"
    "com.habit-tracker.backend"
    "com.habit-tracker.frontend"
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

# Step 3: Ask about data removal
echo ""
echo "[3/3] Data cleanup..."
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

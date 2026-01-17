#!/bin/bash

set -e

echo "Uninstalling Habit Tracker Daemon..."

# Get the current user
CURRENT_USER=$(whoami)
HOME_DIR=$(eval echo ~$CURRENT_USER)
PLIST_PATH="$HOME_DIR/Library/LaunchAgents/com.habit-tracker.daemon.plist"

# Unload the daemon if it's running
if launchctl list | grep -q "com.habit-tracker.daemon"; then
    echo "Stopping daemon..."
    launchctl unload "$PLIST_PATH"
fi

# Remove plist file
if [ -f "$PLIST_PATH" ]; then
    echo "Removing plist file..."
    rm "$PLIST_PATH"
fi

# Ask if user wants to remove logs and backups
read -p "Do you want to remove logs and backups? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$HOME_DIR/.habit-tracker"
    echo "Logs and backups removed"
fi

echo "Daemon uninstalled successfully!"

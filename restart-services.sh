#!/bin/bash

echo "Restarting Habit Tracker services..."

# Unload all services
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.*.plist 2>/dev/null

# Wait a moment for clean shutdown
sleep 2

# Load all services
launchctl load ~/Library/LaunchAgents/com.habit-tracker.*.plist

# Wait for services to start
sleep 3

echo ""
echo "Verifying services..."
launchctl list | grep habit-tracker

echo ""
echo "Checking socket..."
if [ -S ~/.habit-tracker/daemon.sock ]; then
    echo "Socket exists: ~/.habit-tracker/daemon.sock"
    echo "Testing ping..."
    echo "ping" | nc -U ~/.habit-tracker/daemon.sock
else
    echo "WARNING: Socket not found yet. Check daemon logs."
fi

echo ""
echo "Recent daemon logs:"
tail -5 ~/.habit-tracker/logs/daemon.log

echo ""
echo "Done! Test by completing a habit and watching:"
echo "  tail -f ~/.habit-tracker/logs/daemon.log"

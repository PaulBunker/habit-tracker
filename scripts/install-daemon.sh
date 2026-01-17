#!/bin/bash

set -e

echo "Installing Habit Tracker Daemon..."

# Get the current user
CURRENT_USER=$(whoami)
HOME_DIR=$(eval echo ~$CURRENT_USER)

# Build the daemon
echo "Building daemon..."
cd packages/daemon
npm run build
cd ../..

# Get absolute path to daemon
DAEMON_PATH=$(pwd)/packages/daemon/dist/index.js

# Create launchd plist
PLIST_PATH="$HOME_DIR/Library/LaunchAgents/com.habit-tracker.daemon.plist"

echo "Creating launchd plist at $PLIST_PATH..."

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.habit-tracker.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/node</string>
        <string>$DAEMON_PATH</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME_DIR/.habit-tracker/logs/daemon.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME_DIR/.habit-tracker/logs/daemon.error.log</string>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
</dict>
</plist>
EOF

# Create necessary directories
mkdir -p "$HOME_DIR/.habit-tracker/logs"
mkdir -p "$HOME_DIR/.habit-tracker/backups"

# Load the daemon
echo "Loading daemon..."
launchctl load "$PLIST_PATH"

echo ""
echo "Installation complete!"
echo ""
echo "IMPORTANT: The daemon needs sudo access to modify /etc/hosts"
echo "You may be prompted for your password when the daemon runs."
echo ""
echo "To check daemon status:"
echo "  launchctl list | grep habit-tracker"
echo ""
echo "To view logs:"
echo "  tail -f ~/.habit-tracker/logs/daemon.log"
echo ""

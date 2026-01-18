#!/bin/bash

set -e

echo "============================================"
echo "  Habit Tracker - Production Installation"
echo "============================================"
echo ""

# Get the current user and paths
CURRENT_USER=$(whoami)
HOME_DIR=$(eval echo ~$CURRENT_USER)
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
LAUNCH_AGENTS_DIR="$HOME_DIR/Library/LaunchAgents"
DATA_DIR="$HOME_DIR/.habit-tracker/data"
LOGS_DIR="$HOME_DIR/.habit-tracker/logs"

NODE_PATH=$(which node)
NPX_PATH=$(which npx)
NODE_DIR=$(dirname "$NODE_PATH")

echo "Project directory: $PROJECT_DIR"
echo "Data directory: $DATA_DIR"
echo "Logs directory: $LOGS_DIR"
echo "Node path: $NODE_PATH"
echo ""

if [ -z "$NODE_PATH" ]; then
    echo "Error: node not found in PATH. Please install Node.js."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Build all packages
echo "[1/5] Building all packages..."
cd "$PROJECT_DIR"
npm run build

# Step 2: Create necessary directories
echo ""
echo "[2/5] Creating directories..."
mkdir -p "$DATA_DIR"
mkdir -p "$LOGS_DIR"
mkdir -p "$HOME_DIR/.habit-tracker/backups"
echo "Created: $DATA_DIR"
echo "Created: $LOGS_DIR"
echo "Created: $HOME_DIR/.habit-tracker/backups"

# Step 3: Run database migrations
echo ""
echo "[3/5] Running database migrations..."
cd "$PROJECT_DIR"
DB_PATH="$DATA_DIR" npm run db:migrate -w @habit-tracker/backend

# Step 4: Unload any existing services (ignore errors if they don't exist)
echo ""
echo "[4/5] Stopping any existing services..."
launchctl unload "$LAUNCH_AGENTS_DIR/com.habit-tracker.daemon.plist" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENTS_DIR/com.habit-tracker.backend.plist" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENTS_DIR/com.habit-tracker.frontend.plist" 2>/dev/null || true

# Step 5: Create and load launchd services
echo ""
echo "[5/5] Creating launchd services..."

# Backend service
BACKEND_PLIST="$LAUNCH_AGENTS_DIR/com.habit-tracker.backend.plist"
echo "Creating $BACKEND_PLIST..."
cat > "$BACKEND_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.habit-tracker.backend</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$PROJECT_DIR/packages/backend/dist/server.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>DB_PATH</key>
        <string>$DATA_DIR</string>
        <key>PORT</key>
        <string>3000</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOGS_DIR/backend.log</string>
    <key>StandardErrorPath</key>
    <string>$LOGS_DIR/backend.error.log</string>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR/packages/backend</string>
</dict>
</plist>
EOF

# Frontend service
FRONTEND_PLIST="$LAUNCH_AGENTS_DIR/com.habit-tracker.frontend.plist"
echo "Creating $FRONTEND_PLIST..."
cat > "$FRONTEND_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.habit-tracker.frontend</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NPX_PATH</string>
        <string>vite</string>
        <string>preview</string>
        <string>--port</string>
        <string>5173</string>
        <string>--host</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>$NODE_DIR:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOGS_DIR/frontend.log</string>
    <key>StandardErrorPath</key>
    <string>$LOGS_DIR/frontend.error.log</string>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR/packages/frontend</string>
</dict>
</plist>
EOF

# Daemon service
DAEMON_PLIST="$LAUNCH_AGENTS_DIR/com.habit-tracker.daemon.plist"
echo "Creating $DAEMON_PLIST..."
cat > "$DAEMON_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.habit-tracker.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$PROJECT_DIR/packages/daemon/dist/index.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>DB_PATH</key>
        <string>$DATA_DIR</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOGS_DIR/daemon.log</string>
    <key>StandardErrorPath</key>
    <string>$LOGS_DIR/daemon.error.log</string>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR/packages/daemon</string>
</dict>
</plist>
EOF

# Load all services
echo ""
echo "Loading services..."
launchctl load "$BACKEND_PLIST"
launchctl load "$FRONTEND_PLIST"
launchctl load "$DAEMON_PLIST"

# Wait a moment for services to start
sleep 2

# Verify services are running
echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "Services status:"
launchctl list | grep habit-tracker || echo "  (no services found)"
echo ""

# Check backend health
echo "Checking backend health..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "  Backend: OK (http://localhost:3000)"
else
    echo "  Backend: Starting... (may take a few seconds)"
fi

# Check frontend
echo "  Frontend: http://localhost:5173"
echo ""

echo "Logs:"
echo "  Backend: $LOGS_DIR/backend.log"
echo "  Frontend: $LOGS_DIR/frontend.log"
echo "  Daemon: $LOGS_DIR/daemon.log"
echo ""

echo "Database: $DATA_DIR/habit-tracker.db"
echo ""

echo "IMPORTANT: The daemon needs sudo access to modify /etc/hosts"
echo "You may be prompted for your password when websites are blocked."
echo ""

echo "To view logs:"
echo "  tail -f $LOGS_DIR/daemon.log"
echo ""

echo "To uninstall:"
echo "  bash scripts/uninstall-production.sh"
echo ""

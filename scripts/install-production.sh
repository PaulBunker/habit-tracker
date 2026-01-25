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

# Check for Caddy
CADDY_PATH=$(which caddy 2>/dev/null || true)
if [ -z "$CADDY_PATH" ]; then
    echo ""
    echo "Warning: Caddy is not installed."
    echo "Caddy is required for habits.localhost to work."
    echo ""
    read -p "Install Caddy with Homebrew? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Caddy..."
        brew install caddy
        CADDY_PATH=$(which caddy)
    else
        echo "Skipping Caddy installation. habits.localhost will not work."
        echo "You can install later with: brew install caddy"
        CADDY_PATH=""
    fi
fi

# Setup /etc/hosts for local domains
echo ""
echo "Checking /etc/hosts for local domain entries..."
if ! grep -q "habits.localhost" /etc/hosts 2>/dev/null; then
    echo "Adding habits.localhost entries to /etc/hosts (requires sudo)..."
    echo "127.0.0.1 habits.localhost dev.habits.localhost" | sudo tee -a /etc/hosts > /dev/null
    echo "  ✓ Added habits.localhost entries"
    # Flush DNS cache
    sudo dscacheutil -flushcache 2>/dev/null || true
    sudo killall -HUP mDNSResponder 2>/dev/null || true
    echo "  ✓ DNS cache flushed"
else
    echo "  ✓ /etc/hosts already has habits.localhost entries"
fi

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Capture git hash for verification
EXPECTED_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "Deploying version: $EXPECTED_VERSION"
echo ""

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
launchctl unload "$LAUNCH_AGENTS_DIR/com.habit-tracker.caddy.plist" 2>/dev/null || true

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

# Caddy service (only if Caddy is installed)
if [ -n "$CADDY_PATH" ]; then
    CADDY_PLIST="$LAUNCH_AGENTS_DIR/com.habit-tracker.caddy.plist"
    echo "Creating $CADDY_PLIST..."
    cat > "$CADDY_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.habit-tracker.caddy</string>
    <key>ProgramArguments</key>
    <array>
        <string>$CADDY_PATH</string>
        <string>run</string>
        <string>--config</string>
        <string>$PROJECT_DIR/Caddyfile</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOGS_DIR/caddy.log</string>
    <key>StandardErrorPath</key>
    <string>$LOGS_DIR/caddy.error.log</string>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
</dict>
</plist>
EOF
fi

# Load all services
echo ""
echo "Loading services..."
launchctl load "$BACKEND_PLIST"
launchctl load "$FRONTEND_PLIST"
launchctl load "$DAEMON_PLIST"
if [ -n "$CADDY_PATH" ]; then
    launchctl load "$CADDY_PLIST"
fi

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

# Check frontend and verify version
echo ""
echo "Verifying deployment version..."
sleep 2  # Give frontend time to start

DEPLOYED_VERSION=""
for i in 1 2 3 4 5; do
    DEPLOYED_VERSION=$(curl -s http://localhost:5173 2>/dev/null | grep -o 'app-version" content="[^"]*"' | cut -d'"' -f3 || echo "")
    if [ -n "$DEPLOYED_VERSION" ]; then
        break
    fi
    sleep 2
done

if [ "$DEPLOYED_VERSION" = "$EXPECTED_VERSION" ]; then
    echo "  ✓ Version verified: $DEPLOYED_VERSION"
elif [ -n "$DEPLOYED_VERSION" ]; then
    echo "  ⚠ Version mismatch!"
    echo "    Expected: $EXPECTED_VERSION"
    echo "    Deployed: $DEPLOYED_VERSION"
else
    echo "  ⚠ Could not verify version (frontend may still be starting)"
    echo "    Expected: $EXPECTED_VERSION"
    echo "    Check manually: curl -s http://localhost:5173 | grep app-version"
fi

echo ""
echo "  Frontend: http://localhost:5173"
if [ -n "$CADDY_PATH" ]; then
    echo "  Frontend: http://habits.localhost (via Caddy)"
fi
echo ""

echo "Logs:"
echo "  Backend: $LOGS_DIR/backend.log"
echo "  Frontend: $LOGS_DIR/frontend.log"
echo "  Daemon: $LOGS_DIR/daemon.log"
if [ -n "$CADDY_PATH" ]; then
    echo "  Caddy: $LOGS_DIR/caddy.log"
fi
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

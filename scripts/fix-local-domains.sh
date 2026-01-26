#!/bin/bash
# Fix local domain setup - corrects spelling and restarts services

set -e

echo "Fixing local domain setup..."

# 1. Update /etc/hosts - replace habbits with habits
if grep -q "habbits" /etc/hosts; then
    echo "Updating /etc/hosts (requires sudo)..."
    sudo sed -i '' 's/habbits/habits/g' /etc/hosts
    echo "  ✓ Updated /etc/hosts"
else
    # Check if habits entries exist, if not add them
    if ! grep -q "habits.localhost" /etc/hosts; then
        echo "Adding habits.localhost entries to /etc/hosts (requires sudo)..."
        echo "127.0.0.1 habits.localhost dev.habits.localhost" | sudo tee -a /etc/hosts > /dev/null
        echo "  ✓ Added habits.localhost entries"
    else
        echo "  ✓ /etc/hosts already correct"
    fi
fi

# 2. Flush DNS cache
echo "Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null || true
echo "  ✓ DNS cache flushed"

# 3. Restart Caddy if running
if pgrep -x "caddy" > /dev/null; then
    echo "Restarting Caddy..."
    caddy stop 2>/dev/null || true
    sleep 1
    caddy start --config "$(dirname "$0")/../Caddyfile"
    echo "  ✓ Caddy restarted"
else
    echo "  ℹ Caddy not running (start with: caddy run --config Caddyfile)"
fi

echo ""
echo "Done! Access the app at:"
echo "  Development: http://dev.habits.localhost"
echo "  Production:  http://habits.localhost"
echo ""
echo "If the browser still shows old content, do a hard refresh (Cmd+Shift+R)"

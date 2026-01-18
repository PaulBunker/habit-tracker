#!/bin/bash

# Setup Chrome homepage to Habit Tracker
# Creates a Chrome managed policy on macOS

set -e

POLICY_DIR="/Library/Google/Chrome/policies/managed"
POLICY_FILE="$POLICY_DIR/habit-tracker.json"
HABIT_TRACKER_URL="http://localhost:5173"

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Configure Chrome to open Habit Tracker on startup/homepage."
    echo ""
    echo "Options:"
    echo "  --remove    Remove the Chrome policy"
    echo "  --help      Show this help message"
    echo ""
    echo "Note: Requires sudo privileges. Chrome must be restarted after changes."
}

create_policy() {
    echo "=== Chrome Homepage Setup ==="
    echo ""
    echo "This will configure Chrome to:"
    echo "  - Set homepage to $HABIT_TRACKER_URL"
    echo "  - Open $HABIT_TRACKER_URL on startup"
    echo ""
    echo "Policy file: $POLICY_FILE"
    echo ""

    # Create policy directory if it doesn't exist
    if [ ! -d "$POLICY_DIR" ]; then
        echo "Creating policy directory..."
        sudo mkdir -p "$POLICY_DIR"
    fi

    # Create policy JSON
    echo "Creating Chrome policy..."
    sudo tee "$POLICY_FILE" > /dev/null << EOF
{
    "HomepageLocation": "$HABIT_TRACKER_URL",
    "HomepageIsNewTabPage": false,
    "RestoreOnStartup": 4,
    "RestoreOnStartupURLs": ["$HABIT_TRACKER_URL"],
    "ShowHomeButton": true
}
EOF

    echo ""
    echo "✓ Chrome policy created successfully!"
    echo ""
    echo "Please restart Chrome for changes to take effect."
    echo ""
    echo "To verify, open Chrome and go to chrome://policy"
    echo "You should see the Habit Tracker policies listed."
}

remove_policy() {
    echo "=== Remove Chrome Homepage Policy ==="
    echo ""

    if [ -f "$POLICY_FILE" ]; then
        echo "Removing policy file: $POLICY_FILE"
        sudo rm "$POLICY_FILE"
        echo ""
        echo "✓ Chrome policy removed successfully!"
        echo ""
        echo "Please restart Chrome for changes to take effect."
    else
        echo "No Habit Tracker policy found at $POLICY_FILE"
    fi
}

# Parse arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --remove)
        remove_policy
        exit 0
        ;;
    "")
        create_policy
        exit 0
        ;;
    *)
        echo "Unknown option: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

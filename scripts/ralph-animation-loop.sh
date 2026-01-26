#!/bin/bash
#
# Ralph Wiggum Animation Loop
# Runs Claude iteratively until animation is fixed or max iterations reached
#
# Usage:
#   ./scripts/ralph-animation-loop.sh [max_iterations]
#
# Default: 10 iterations
# Set to 0 for infinite (not recommended without supervision)
#

set -e

MAX_ITERATIONS="${1:-10}"
ITERATION=0
PLAN_FILE=".claude/plans/flip-animation-iteration.md"
PROMPT_FILE="PROMPT_animation.md"
LOG_FILE="ralph-animation-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Ralph Wiggum Animation Loop ===${NC}"
echo "Max iterations: $MAX_ITERATIONS"
echo "Log file: $LOG_FILE"
echo ""

# Check preconditions
if [ ! -f "$PROMPT_FILE" ]; then
    echo -e "${RED}Error: $PROMPT_FILE not found${NC}"
    exit 1
fi

if [ ! -f "$PLAN_FILE" ]; then
    echo -e "${RED}Error: $PLAN_FILE not found${NC}"
    exit 1
fi

# Check if dev server is running
if ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Dev server not detected on port 5174${NC}"
    echo "Start it with: npm run dev"
    echo "Continuing anyway (Claude may start it)..."
    echo ""
fi

# Function to check completion
check_completion() {
    if grep -q "<promise>ANIMATION_COMPLETE</promise>" "$PLAN_FILE"; then
        return 0
    fi
    return 1
}

# Function to check if stuck
check_stuck() {
    if grep -q "<stuck>NEEDS_HUMAN_REVIEW</stuck>" "$PLAN_FILE"; then
        return 0
    fi
    return 1
}

# Main loop
while true; do
    # Check iteration limit
    if [ "$MAX_ITERATIONS" -gt 0 ] && [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
        echo -e "${YELLOW}Max iterations ($MAX_ITERATIONS) reached${NC}"
        break
    fi

    ITERATION=$((ITERATION + 1))
    echo ""
    echo -e "${GREEN}=== Iteration $ITERATION of $MAX_ITERATIONS ===${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo "---"

    # Run Claude with the prompt
    # Using --print to output directly, no interactive mode
    # Using --dangerously-skip-permissions for autonomous operation
    cat "$PROMPT_FILE" | claude -p \
        --dangerously-skip-permissions \
        --verbose 2>&1 | tee -a "$LOG_FILE"

    # Check for completion
    if check_completion; then
        echo ""
        echo -e "${GREEN}=== SUCCESS! Animation complete ===${NC}"
        echo "Completed in $ITERATION iterations"
        echo "Review the filmstrip and iteration log to verify"
        break
    fi

    # Check if stuck
    if check_stuck; then
        echo ""
        echo -e "${YELLOW}=== Claude reports being stuck ===${NC}"
        echo "Human review needed. Check $PLAN_FILE for details"
        break
    fi

    # Push changes if any
    if git diff --quiet && git diff --cached --quiet; then
        echo "No changes to push"
    else
        echo "Changes detected, pushing to remote..."
        git push origin "$(git branch --show-current)" 2>&1 || echo "Push failed (non-fatal)"
    fi

    # Brief pause between iterations
    echo ""
    echo "Pausing 5 seconds before next iteration..."
    sleep 5
done

echo ""
echo "=== Ralph Loop Complete ==="
echo "Total iterations: $ITERATION"
echo "Full log: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  1. Review: cat $PLAN_FILE"
echo "  2. View filmstrip: open .playwright-mcp/filmstrip-flip-modal-open.png"
echo "  3. Check git log: git log --oneline -10"

#!/bin/bash

# Cleanup script to remove test data from production database
# Test habits have names ending with 13-digit timestamps (e.g., "Exercise 1768745721300")

set -e

PROD_DB="${HOME}/.habit-tracker/data/habit-tracker.db"

if [ ! -f "$PROD_DB" ]; then
  echo "Production database not found at: $PROD_DB"
  exit 1
fi

echo "=== Habit Tracker Test Data Cleanup ==="
echo "Database: $PROD_DB"
echo ""

# Count test habits (names ending with 13-digit timestamp)
TEST_HABIT_COUNT=$(sqlite3 "$PROD_DB" "SELECT COUNT(*) FROM habits WHERE name GLOB '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]';")

if [ "$TEST_HABIT_COUNT" -eq 0 ]; then
  echo "No test habits found. Database is clean."
  exit 0
fi

echo "Found $TEST_HABIT_COUNT test habit(s):"
echo ""
sqlite3 "$PROD_DB" "SELECT '  - ' || name FROM habits WHERE name GLOB '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]';"
echo ""

if [ "$1" != "--force" ]; then
  read -p "Delete these habits and their logs? [y/N] " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Get IDs of test habits
TEST_HABIT_IDS=$(sqlite3 "$PROD_DB" "SELECT id FROM habits WHERE name GLOB '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]';")

# Delete habit logs first (foreign key constraint)
for id in $TEST_HABIT_IDS; do
  sqlite3 "$PROD_DB" "DELETE FROM habit_logs WHERE habit_id = '$id';"
done

# Delete test habits
sqlite3 "$PROD_DB" "DELETE FROM habits WHERE name GLOB '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]';"

echo "✓ Deleted $TEST_HABIT_COUNT test habit(s) and their logs."

# Debugging: Test Data in Production Database

## Issue Discovered: 2026-01-19

Test habits with timestamp-based names appeared in the production database.

## Root Cause

E2E tests were writing to the production database instead of an isolated test database. This was fixed in **PR #20** (merged 2026-01-18).

### The Fix (PR #20)
- E2E tests now use `NODE_ENV=test` with a separate database path
- Test database: `./packages/backend/data/test/habit-tracker.db`
- Production database: `~/.habit-tracker/data/habit-tracker.db`

## How to Identify Test Data

Test habits have timestamp suffixes in their names:
```
Exercise 1768803042999
Read 1768803043455
```

Pattern to match: `%176880%` (Unix timestamp prefix from Jan 2026)

## Production Database Location

```
~/.habit-tracker/data/habit-tracker.db
```

## Cleanup Commands (if needed)

### View all habits
```bash
sqlite3 ~/.habit-tracker/data/habit-tracker.db "SELECT id, name, created_at FROM habits ORDER BY created_at;"
```

### Delete test habits
```bash
sqlite3 ~/.habit-tracker/data/habit-tracker.db "DELETE FROM habits WHERE name LIKE '%176880%';"
```

### Verify cleanup
```bash
sqlite3 ~/.habit-tracker/data/habit-tracker.db "SELECT name FROM habits;"
```

### Check log count
```bash
sqlite3 ~/.habit-tracker/data/habit-tracker.db "SELECT COUNT(*) FROM habit_logs;"
```

## If Test Data Reappears

If new test habits appear in production after PR #20 was merged:

1. Check that E2E tests are running with `NODE_ENV=test`
2. Verify the test database path in `packages/backend/src/db/index.ts`
3. Check if any new test files bypass the environment isolation
4. Review recent changes to test configuration

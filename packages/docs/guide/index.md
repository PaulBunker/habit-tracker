# Introduction

Habit Tracker is a macOS application that helps you stay productive by blocking distracting websites when your daily habits aren't completed.

## How It Works

1. **Define habits** - Create habits with optional deadlines
2. **Track completion** - Mark habits as done each day
3. **Automatic blocking** - Websites are blocked when habits become overdue
4. **Enforcement** - A background daemon modifies `/etc/hosts` to enforce blocking

## Architecture Overview

The application is built as a monorepo with four main packages:

| Package | Description |
|---------|-------------|
| `shared` | TypeScript types and utilities |
| `backend` | Express API server with SQLite |
| `frontend` | React + Vite webapp |
| `daemon` | Background service for `/etc/hosts` management |

## Blocking Logic

Websites are blocked when **any** habit with a deadline becomes overdue (current time >= deadline). Blocking continues until **all** overdue habits are completed or skipped.

Habits without deadlines are simple checklist items that never trigger blocking.

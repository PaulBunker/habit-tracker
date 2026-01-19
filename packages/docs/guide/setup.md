# Setup Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- macOS (for website blocking functionality)

## Installation

```bash
# Clone the repository
git clone https://github.com/PaulBunker/habit-tracker.git
cd habit-tracker

# Install dependencies
npm install

# Build shared package first
npm run build -w @habit-tracker/shared
```

## Development Mode

Development mode uses a sandboxed database and different ports to avoid conflicts with production.

```bash
npm run dev
```

| Service | Port |
|---------|------|
| Backend | 3001 |
| Frontend | 5174 |

## Production Mode

Production mode uses persistent storage in `~/.habit-tracker/`.

```bash
npm run start:prod
```

| Service | Port |
|---------|------|
| Backend | 3000 |
| Frontend | 5173 |

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# E2E tests
npm run test:e2e

# BDD tests
npm run test:bdd
```

## Database Management

```bash
# Run migrations
npm run db:migrate -w @habit-tracker/backend

# Generate migration
npm run db:generate -w @habit-tracker/backend
```

## Daemon Management

```bash
# Check daemon status
npm run daemon:status

# Restore /etc/hosts (remove blocking entries)
npm run daemon:restore
```

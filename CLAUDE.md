# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Habit Tracker with Website Blocking - a macOS app that blocks specified websites when daily habits aren't completed. Uses a daemon to manage `/etc/hosts` for enforcement.

## Build & Development Commands

```bash
# Development (sandbox mode - separate DB, ports 3001/5174)
npm run dev

# Production mode (persistent DB, ports 3000/5173)
npm run start:prod

# Build all packages (order matters: shared → backend → daemon → frontend)
npm run build

# Build single package
npm run build -w @habit-tracker/shared

# Tests
npm test                                    # All tests
npm run test:unit                           # Unit tests only
npm run test:e2e                            # Playwright E2E
npm run test:bdd                            # Cucumber BDD
npm run test -w @habit-tracker/backend      # Single package

# Lint & Format
npm run lint
npm run format

# Database (backend package)
npm run db:migrate -w @habit-tracker/backend
npm run db:generate -w @habit-tracker/backend

# Daemon management
npm run daemon:status
npm run daemon:restore
```

## Architecture

**Monorepo with npm workspaces** containing 4 packages:

- **shared** - TypeScript types and utilities (dual CJS/ESM build, must build first)
- **backend** - Express API server with SQLite (Drizzle ORM)
- **frontend** - React + Vite webapp
- **daemon** - Background service that receives IPC triggers from backend, 60s fallback poll, and modifies `/etc/hosts`

**Data Flow**: User → Frontend → Backend API → SQLite ← Daemon → /etc/hosts

**Blocking Logic**: Websites are blocked when ANY habit with a deadline becomes overdue (current time >= deadline). Blocking continues until ALL overdue habits are completed/skipped. Habits without deadlines are simple checklist items that never trigger blocking.

## Key Files

| Location | Purpose |
|----------|---------|
| `packages/shared/src/types.ts` | All TypeScript interfaces (Habit, HabitLog, AppSettings) |
| `packages/shared/src/daemon-client.ts` | IPC client for daemon (Node.js only, import via `@habit-tracker/shared/daemon-client`) |
| `packages/backend/src/db/schema.ts` | Drizzle ORM schema |
| `packages/backend/src/server.ts` | Express app setup |
| `packages/daemon/src/hosts-manager.ts` | /etc/hosts manipulation |
| `.env.development` / `.env.production` | Environment configs |

## Coding Standards

- **TypeScript strict mode** - no `any`, explicit return types
- **TDD/BDD approach** - write tests first
- **Naming**: camelCase (vars/functions), PascalCase (components/types), UPPER_SNAKE_CASE (constants)
- **Booleans**: prefix with `is`, `has`, `should`, `can`
- **File naming**: kebab-case (dirs), PascalCase (React components)
- **Commit format**: `<type>(<scope>): <subject>` (feat, fix, docs, refactor, test, chore)

## Environment Separation

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | `./packages/backend/data/dev/habit-tracker.db` | `~/.habit-tracker/data/habit-tracker.db` |
| Backend | :3001 | :3000 |
| Frontend | :5174 | :5173 |

## Common Issues

- **Type errors on build** - Run `npm run build -w @habit-tracker/shared` first
- **Database locked** - Close other running instances
- **Tests fail** - Ensure shared package is built
- **Daemon not blocking** - Check `tail -f ~/.habit-tracker/logs/daemon.log`

## Documentation

This project uses **docs-as-code**: documentation lives in `packages/docs/` as markdown files built with VitePress.

**Source files** (read these directly):
- `packages/docs/guide/` - Setup, architecture, testing, deployment, coding standards
- `packages/docs/api/` - Generated from TSDoc comments (run `npm run docs:generate` first)
- Each package has its own `README.md` with package-specific details

**To preview as a website**: `npm run docs:dev` (builds TypeDoc API docs then starts VitePress)

## Documentation-First Workflow

1. **Check docs first** - Read CLAUDE.md, README.md, and `packages/docs/guide/` before starting
2. **Keep docs current** - Update when adding features, changing setup, or discovering conventions
3. **Ask before assuming** - Clarify when requirements are ambiguous, multiple approaches exist, or decisions are hard to reverse
4. **Plan before executing** - Outline approach, reference patterns, flag deviations

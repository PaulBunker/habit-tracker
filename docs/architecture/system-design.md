# System Design

## Overview

The Habit Tracker is a full-stack application that combines a web interface, REST API, database, and system-level daemon to enforce habit completion through website blocking.

## Architecture Diagram

```
┌─────────────────┐
│   React UI      │ (Frontend)
│   (Vite)        │ Dev: Port 5174 | Prod: Port 5173
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Express API   │ (Backend)
│   + SQLite DB   │ Dev: Port 3001 | Prod: Port 3000
└────────┬────────┘
         │ Shared Database
         │ Unix Socket IPC
         ▼
┌─────────────────┐
│   Daemon        │ (Background Service)
│   + Hosts File  │
│     Manager     │
└─────────────────┘
```

## Environment Separation

| Environment | Database Location | Backend Port | Frontend Port | Purpose |
|-------------|-------------------|--------------|---------------|---------|
| **Development** | `./packages/backend/data/dev/habit-tracker.db` | 3001 | 5174 | Sandbox for testing |
| **Production** | `~/.habit-tracker/data/habit-tracker.db` | 3000 | 5173 | Daily use |

> **Note:** Relative paths in `DB_PATH` are resolved from the monorepo root using `INIT_CWD` (set by npm when running via workspaces). This ensures both backend and daemon use the same database file regardless of which package directory they run from.

## Components

### 1. Frontend (React + Vite)

**Responsibilities:**
- User interface for habit management
- Daily checklist view for completing habits
- Calendar view for tracking history
- Graph view for data visualization
- Settings management
- API communication

**Key Files:**
- `App.tsx`: Main application component with routing
- `pages/GlobalSettings.tsx`: Global settings management
- `components/DailyChecklist.tsx`: Daily habit completion view
- `components/ChecklistItem.tsx`: Individual habit completion control
- `components/CalendarView.tsx`: Calendar-based habit history
- `components/GraphView.tsx`: Data visualization for tracked values
- `components/HabitSettingsPanel.tsx`: Individual habit configuration
- `components/QuickAddHabit.tsx`: Quick habit creation
- `api/client.ts`: API communication layer

**State Management:**
- Custom hooks (`useHabits`, `useSettings`)
- Local component state
- No global state library (keeps it simple)

### 2. Backend (Express + TypeScript)

**Responsibilities:**
- RESTful API endpoints
- Business logic
- Database operations
- Input validation
- Error handling

**Key Files:**
- `server.ts`: Express server setup with environment awareness
- `routes/habits.ts`: Habit CRUD endpoints
- `routes/settings.ts`: Settings endpoints (blocked websites)
- `routes/status.ts`: System status endpoints
- `db/schema.ts`: Drizzle ORM schema
- `db/index.ts`: Database connection with environment handling
- `middleware/validators.ts`: Zod validation schemas

**Database:**
- SQLite for simplicity and portability
- Drizzle ORM for type-safe queries
- WAL mode for better concurrency

### 3. Daemon (Node.js Service)

**Responsibilities:**
- Listen for IPC refresh signals from backend via Unix socket
- Fallback poll every 30 seconds for time-based triggers (deadlines)
- Check habit start times and deadlines
- Modify hosts file to block/unblock sites based on global blocked websites
- Create backups before modifications
- Log all actions

**Key Files:**
- `index.ts`: Main daemon loop with socket server and environment logging
- `socket-server.ts`: Unix socket server for IPC
- `scheduler.ts`: Habit deadline checking and database queries
- `hosts-manager.ts`: Hosts file operations
- `schema.ts`: Database schema (shared with backend)

**Safety Features:**
- Timestamped backups before every change
- 30-day backup retention
- Clear section markers (`# HABIT-TRACKER-START/END`)
- DNS cache flushing after changes
- Graceful shutdown handlers
- Restore script available (`npm run daemon:restore`)

### 4. Shared Package

**Responsibilities:**
- Type definitions shared across packages
- Utility functions
- Daemon IPC client
- Constants

**Key Files:**
- `types.ts`: TypeScript interfaces
- `utils.ts`: Helper functions (timezone, validation)
- `daemon-client.ts`: Unix socket client for notifying daemon

## Data Flow

### Creating a Habit

1. User enters habit name in QuickAddHabit component
2. Frontend sends request to `POST /api/habits`
3. Backend validates with Zod schemas
4. Database insert via Drizzle ORM
5. Response returned to frontend
6. UI updates to show new habit in DailyChecklist

### Website Blocking (V2 Global Blocking)

V2 uses global blocked websites instead of per-habit blocking:

1. User configures blocked websites in GlobalSettings page
2. Settings stored in database via `POST /api/settings`
3. Daemon reads blocked websites from settings table
4. When any timed habit's start time passes:
   - All configured websites are blocked
   - Blocking continues until ALL timed habits are complete
5. Once all timed habits are completed/skipped:
   - All websites are unblocked
   - Hosts file is restored

### Completing a Habit

1. User checks checkbox in DailyChecklist
2. API request to `POST /api/habits/:id/complete`
3. Backend creates HabitLog entry with status
4. Optional: Record tracked value (with units)
5. Response returned
6. On next daemon cycle:
   - Checks if ALL timed habits are complete
   - If yes, removes blocking entries from hosts file
   - Flushes DNS cache

### Data Tracking

V2 supports optional data tracking for habits:

1. User enables data tracking in HabitSettingsPanel
2. Configures unit type (minutes, hours, count, etc.)
3. When completing habit, user enters tracked value
4. Values stored in HabitLog
5. GraphView visualizes tracked data over time

## Design Decisions

### Why SQLite?

- **Pros**:
  - No separate database server needed
  - Perfect for single-user desktop app
  - ACID compliant
  - Fast for our use case
- **Cons**:
  - Not suitable for multi-user/web deployment
  - Requires file system access

**Decision**: SQLite is ideal for MVP. Can migrate to PostgreSQL if needed for multi-user version.

### Why Hosts File Blocking?

- **Pros**:
  - System-level blocking (works across all browsers)
  - No browser extensions needed
  - Simple and reliable
- **Cons**:
  - Requires elevated permissions
  - macOS-specific implementation
  - Can be bypassed by tech-savvy users

**Decision**: Hosts file is the simplest cross-browser solution. Future versions could add browser extension support.

### Why Global Blocking (V2)?

- **Pros**:
  - Simpler mental model for users
  - One list of blocked sites to manage
  - Blocking logic is straightforward (any incomplete = blocked)
- **Cons**:
  - Less granular control per habit
  - All-or-nothing approach

**Decision**: V2 global blocking simplifies UX. Per-habit blocking was confusing for users.

### Why Monorepo?

- **Pros**:
  - Shared types between frontend/backend
  - Easier dependency management
  - Atomic commits across packages
- **Cons**:
  - More complex build setup
  - Larger repository size

**Decision**: Benefits outweigh costs for this project size.

### Why Daemon vs Cron?

- **Pros of Daemon**:
  - More responsive (1-minute intervals)
  - Better error handling
  - Easier logging
- **Cons**:
  - Always running (minimal resource usage)
  - Requires launchd setup

**Decision**: Daemon provides better UX with minimal overhead.

## Security Model

### Daemon Permissions

The daemon requires write access to `/etc/hosts`. This is achieved through:

1. User installs daemon with `sudo`
2. launchd runs daemon with user permissions
3. Daemon uses `sudo` only for hosts file writes

**Risk Mitigation**:
- Daemon only modifies hosts file (no other system access)
- All domains validated before adding
- Backups created before every change
- Comprehensive logging for audit trail

### API Security

- CORS configured for localhost only (dev)
- Input validation with Zod
- SQL injection prevented by ORM
- No authentication (single-user app)

**Future Enhancements**:
- Add authentication for multi-user
- Rate limiting on endpoints
- HTTPS in production

## Performance Considerations

### Database

- SQLite WAL mode for better concurrency
- Indexes on `habitId` and `date` for fast queries
- No N+1 queries (uses joins)

### Frontend

- React.StrictMode for development checks
- Component-level code splitting (lazy loading)
- Minimal re-renders with proper memoization

### Daemon

- Instant IPC refresh via Unix socket (~10ms)
- 30-second fallback poll interval for time-based triggers
- Efficient queries (only active habits)
- Debouncing for rapid changes

## Scalability Limitations

**Current MVP**:
- Single user
- Local database
- macOS only
- No real-time updates

**Future Versions**:
- Multi-user with authentication
- PostgreSQL database
- Cross-platform daemon (Windows, Linux)
- WebSocket for real-time status
- Cloud sync for habit data

## Testing Strategy

### Unit Tests (90%+ coverage)

- Jest for backend/daemon
- Vitest for frontend
- Test-first approach (TDD)

### BDD Tests (Cucumber)

- Feature files define requirements
- Step definitions for automation
- Covers all user flows

### E2E Tests (Playwright)

- Full user journeys
- Cross-browser testing
- Visual regression tests

### Integration Tests

- API endpoint tests with Supertest
- Database operations tests
- Hosts file modification tests (mocked)

## Monitoring & Logging

### Daemon Logs

Location: `~/.habit-tracker/logs/`

- `daemon.log`: All daemon activities
- `daemon.error.log`: Error output from launchd

Format:
```
[2026-01-17T10:30:00.000Z] [INFO] Checking habits...
[2026-01-17T10:30:01.000Z] [INFO] Found 2 incomplete timed habits: Morning Exercise, Study Session
[2026-01-17T10:30:02.000Z] [INFO] Backup created: /Users/user/.habit-tracker/backups/hosts_2026-01-17T10-30-02.bak
[2026-01-17T10:30:03.000Z] [INFO] Hosts file updated. Blocking 3 domains: reddit.com, twitter.com, youtube.com
```

### Frontend Logging

- Console errors for development
- Future: Error tracking service (e.g., Sentry)

### Backend Logging

- Express morgan middleware for HTTP logs
- Custom error logging to files

## Deployment

### Development (Sandbox)

```bash
npm run dev:sandbox
```

Starts all services in development mode on ports 5174/3001.

### Production

```bash
npm run start:prod
```

Starts all services in production mode on ports 5173/3000.

### Daemon Installation

```bash
npm run install:daemon
```

Creates launchd plist and loads daemon.

### Daemon Status & Restore

```bash
npm run daemon:status   # Show current blocking state
npm run daemon:restore  # Restore hosts from backup
```

## Future Enhancements

1. **Weekly/Custom Habits**: Beyond daily habits
2. **Streak Tracking**: Visualize consistency
3. **Data Export**: Backup habit data
4. **Browser Extension**: More granular blocking
5. **Mobile App**: iOS/Android companion
6. **Achievements**: Gamification elements
7. **Social Features**: Share progress with friends
8. **Cloud Sync**: Access habits across devices

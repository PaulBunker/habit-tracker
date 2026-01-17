# System Design

## Overview

The Habit Tracker is a full-stack application that combines a web interface, REST API, database, and system-level daemon to enforce habit completion through website blocking.

## Architecture Diagram

```
┌─────────────────┐
│   React UI      │ (Frontend - Port 5173)
│   (Vite)        │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Express API   │ (Backend - Port 3000)
│   + SQLite DB   │
└────────┬────────┘
         │ Shared Database
         ▼
┌─────────────────┐
│   Daemon        │ (Background Service)
│   + Hosts File  │
│     Manager     │
└─────────────────┘
```

## Components

### 1. Frontend (React + Vite)

**Responsibilities:**
- User interface for habit management
- Real-time habit status display
- Form validation
- API communication

**Key Files:**
- `App.tsx`: Main application component
- `components/HabitList.tsx`: Display habits
- `components/HabitForm.tsx`: Create/edit habits
- `components/CheckInModal.tsx`: Complete/skip habits
- `api/client.ts`: API communication layer

**State Management:**
- Custom hooks (`useHabits`)
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
- `server.ts`: Express server setup
- `routes/habits.ts`: Habit CRUD endpoints
- `routes/status.ts`: System status endpoints
- `db/schema.ts`: Drizzle ORM schema
- `middleware/validators.ts`: Zod validation schemas

**Database:**
- SQLite for simplicity and portability
- Drizzle ORM for type-safe queries
- WAL mode for better concurrency

### 3. Daemon (Node.js Service)

**Responsibilities:**
- Poll database every 60 seconds
- Check habit deadlines
- Modify hosts file to block/unblock sites
- Create backups before modifications
- Log all actions

**Key Files:**
- `index.ts`: Main daemon loop
- `scheduler.ts`: Habit deadline checking
- `hosts-manager.ts`: Hosts file operations
- `schema.ts`: Database schema (shared with backend)

**Safety Features:**
- Timestamped backups before every change
- Rollback capability on errors
- Comprehensive logging
- DNS cache flushing

### 4. Shared Package

**Responsibilities:**
- Type definitions shared across packages
- Utility functions
- Constants

**Key Files:**
- `types.ts`: TypeScript interfaces
- `utils.ts`: Helper functions (timezone, validation)

## Data Flow

### Creating a Habit

1. User fills form in React UI
2. Frontend validates input (domain format, required fields)
3. API request sent to `POST /api/habits`
4. Backend validates with Zod schemas
5. Timezone conversion (local → UTC)
6. Database insert via Drizzle ORM
7. Response returned to frontend
8. UI updates to show new habit

### Deadline Enforcement

1. Daemon wakes up every 60 seconds
2. Queries database for active habits
3. Compares current UTC time with deadlines
4. For overdue habits without completion:
   - Marks as "missed" in database
   - Collects blocked domains
5. Creates timestamped backup of hosts file
6. Updates hosts file with blocking entries
7. Flushes DNS cache
8. Logs actions to `~/.habit-tracker/logs/`

### Completing a Habit

1. User clicks "Check In" on habit card
2. Modal opens with Complete/Skip options
3. User submits (with optional notes)
4. API request to `POST /api/habits/:id/complete`
5. Backend creates/updates HabitLog
6. Response returned
7. On next daemon cycle:
   - Checks habit status
   - Removes blocking entries
   - Updates hosts file
   - Flushes DNS cache

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

- 60-second poll interval (configurable)
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
[2026-01-17T10:30:01.000Z] [INFO] Found 2 overdue habits: Morning Exercise, Study Session
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

### Development

```bash
npm run dev
```

Starts all services concurrently.

### Production

```bash
npm run build
npm start
```

### Daemon Installation

```bash
npm run install:daemon
```

Creates launchd plist and loads daemon.

## Future Enhancements

1. **Weekly/Custom Habits**: Beyond daily habits
2. **Streak Tracking**: Visualize consistency
3. **Data Export**: Backup habit data
4. **Browser Extension**: More granular blocking
5. **Mobile App**: iOS/Android companion
6. **Achievements**: Gamification elements
7. **Social Features**: Share progress with friends
8. **Cloud Sync**: Access habits across devices

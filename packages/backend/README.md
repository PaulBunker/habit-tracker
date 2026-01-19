# @habit-tracker/backend

Express.js REST API server for the Habit Tracker application. Manages habits, logs, and settings with SQLite persistence.

## Key Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Express app setup with middleware and routes |
| `src/routes/habits.ts` | CRUD operations for habits and completion/skip actions |
| `src/routes/settings.ts` | Global settings (blocked websites) |
| `src/routes/status.ts` | Daemon status endpoint |
| `src/db/schema.ts` | Drizzle ORM schema definitions |
| `src/db/index.ts` | Database connection and initialization |
| `src/middleware/validators.ts` | Request validation middleware |

## API Endpoints

### Habits

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/habits` | List all habits |
| `POST` | `/api/habits` | Create a new habit |
| `GET` | `/api/habits/:id` | Get habit details |
| `PUT` | `/api/habits/:id` | Update habit settings |
| `DELETE` | `/api/habits/:id` | Delete a habit |
| `POST` | `/api/habits/:id/complete` | Mark habit complete for today |
| `POST` | `/api/habits/:id/skip` | Skip habit with reason |
| `GET` | `/api/habits/:id/logs` | Get habit completion history |
| `PATCH` | `/api/habits/:id/logs/date/:date` | Update log data value for specific date |
| `GET` | `/api/habits/:id/calendar` | Get calendar view data for habit |
| `GET` | `/api/habits/:id/graph` | Get graph data for data-tracking habits |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get global settings |
| `PUT` | `/api/settings` | Update settings |

### Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Get daemon status |
| `POST` | `/api/daemon/reset` | Emergency reset (unblock all) |
| `GET` | `/health` | Health check |

## Development

```bash
# Start development server (port 3001, sandbox DB)
npm run dev -w @habit-tracker/backend

# Start production server (port 3000, persistent DB)
npm run start:prod -w @habit-tracker/backend

# Run tests
npm test -w @habit-tracker/backend

# Database migrations
npm run db:migrate -w @habit-tracker/backend
npm run db:generate -w @habit-tracker/backend
```

## Architecture

The backend follows a standard Express pattern:

1. **Routes** handle HTTP requests and responses
2. **Validators** ensure request data is valid
3. **Drizzle ORM** manages SQLite database operations
4. **Daemon Client** notifies the daemon when blocking state changes

When a habit is completed or a deadline passes, the backend signals the daemon via IPC to update `/etc/hosts`.

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `PORT` | 3001 | 3000 |
| `DB_PATH` | `./data/dev/habit-tracker.db` | `~/.habit-tracker/data/habit-tracker.db` |
| `NODE_ENV` | development | production |

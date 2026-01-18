# Habit Tracker with Website Blocking

A habit tracking webapp that blocks specified websites when habits aren't completed by their deadlines. Uses the system hosts file for blocking, with a background daemon managing the enforcement.

## Features

### Core Functionality
- Create daily habits with optional deadlines
- Global website blocking (sites blocked when habits are overdue)
- Complete or skip habits with reasons
- Calendar view for tracking history
- Graph view for data visualization

### V2 Enhancements
- **Quick Add**: Rapid habit creation from the main view
- **Data Tracking**: Track values (minutes, pages, reps) with units
- **Daily Checklist**: Simple checkbox-based completion
- **Habit Settings Panel**: Configure individual habit options
- **Global Settings**: Manage blocked websites in one place
- **Active Days**: Set which days each habit applies

### Technical Features
- Automatic website blocking via macOS daemon
- Timestamped backups of hosts file (30-day retention)
- Development/Production environment separation
- Full BDD test coverage with Cucumber
- E2E tests with Playwright

## Tech Stack

- **Frontend**: React with TypeScript + Vite
- **Backend**: Node.js with Express + TypeScript
- **Database**: SQLite with Drizzle ORM
- **Testing**: Jest/Vitest for unit tests, Playwright for E2E, Cucumber for BDD
- **Process**: TDD/BDD approach

## Project Structure

```
habit-tracker/
├── docs/                          # Documentation
│   ├── architecture/              # Architecture decisions
│   ├── workflows/                 # Development workflows
│   ├── best-practices/            # Coding standards
│   └── planning/                  # Planning documents
├── packages/
│   ├── frontend/                  # React webapp
│   │   └── src/
│   │       ├── components/        # UI components
│   │       │   ├── DailyChecklist.tsx
│   │       │   ├── CalendarView.tsx
│   │       │   ├── GraphView.tsx
│   │       │   └── ...
│   │       └── pages/
│   │           └── GlobalSettings.tsx
│   ├── backend/                   # Express API server
│   ├── daemon/                    # Background service for hosts file
│   ├── shared/                    # Shared types and utilities
│   └── e2e/                       # End-to-end tests
├── scripts/                       # Installation scripts
├── .env.development               # Development config
├── .env.production                # Production config
└── package.json                   # Root workspace config
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- macOS (for daemon features)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build all packages:
   ```bash
   npm run build
   ```

3. Set up the database:
   ```bash
   cd packages/backend
   npm run db:migrate
   ```

4. Install the daemon (requires sudo):
   ```bash
   npm run install:daemon
   ```

### Development

Run in **sandbox mode** (separate database for testing):
```bash
npm run dev:sandbox
```

This starts:
- Frontend on http://localhost:5174
- Backend on http://localhost:3001
- Daemon in watch mode

### Production

Run in **production mode**:
```bash
npm run start:prod
```

This starts:
- Frontend on http://localhost:5173
- Backend on http://localhost:3000
- Daemon with production database

### Environment Separation

| Environment | Database Location | Backend | Frontend | Purpose |
|-------------|-------------------|---------|----------|---------|
| Development | `./data/dev/habit-tracker.db` | :3001 | :5174 | Sandbox testing |
| Production | `~/.habit-tracker/data/habit-tracker.db` | :3000 | :5173 | Daily use |

### Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run BDD tests
npm run test:bdd
```

## Documentation

- [Setup Guide](./docs/workflows/setup-guide.md)
- [Development Workflow](./docs/workflows/development-workflow.md)
- [API Documentation](./docs/architecture/api-documentation.md)
- [Testing Guide](./docs/workflows/testing-guide.md)
- [System Architecture](./docs/architecture/system-design.md)

## How It Works

1. **Create Habits**: Define daily habits with optional deadlines
2. **Configure Blocking**: Set global list of websites to block in Settings
3. **Daemon Monitoring**: Background service checks habit status every 30 seconds
4. **Automatic Blocking**: When a deadline passes, all configured sites are blocked
5. **Complete Habits**: Check off habits to unblock (all overdue habits must be complete)
6. **Data Tracking**: Optionally track values like time spent or quantity

### Blocking Logic

- Habits without deadlines are simple checklist items (never trigger blocking)
- Habits with deadlines trigger blocking when overdue (current time >= deadline)
- Blocking continues until ALL overdue habits are completed/skipped
- At midnight, new day starts fresh

## Database Schema

### Habits
- `id`: UUID primary key
- `name`: Habit name
- `description`: Optional description
- `deadlineUtc`: When habit is due (HH:MM) - blocking starts when overdue
- `timezoneOffset`: User's timezone offset
- `dataTracking`: Boolean for value tracking
- `dataUnit`: Unit for tracked values (e.g., "minutes")
- `activeDays`: JSON array of day indices (0-6)
- `isActive`: Boolean flag
- `createdAt`: Creation timestamp

### HabitLogs
- `id`: UUID primary key
- `habitId`: Foreign key to habits
- `date`: Date in YYYY-MM-DD format
- `status`: 'completed' | 'skipped' | 'missed'
- `completedAt`: Completion timestamp
- `skipReason`: Required when status is 'skipped'
- `value`: Tracked value (when dataTracking enabled)
- `notes`: Optional notes
- `createdAt`: Creation timestamp

### Settings
- `key`: Setting key (e.g., "blockedWebsites")
- `value`: JSON value
- `updatedAt`: Last update timestamp

## API Endpoints

### Habits
- `POST /api/habits` - Create habit
- `GET /api/habits` - List all habits
- `GET /api/habits/:id` - Get habit details
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Habit Actions
- `POST /api/habits/:id/complete` - Mark habit complete
- `POST /api/habits/:id/skip` - Skip habit with reason
- `GET /api/habits/:id/logs` - Get habit history

### Settings (V2)
- `GET /api/settings` - Get global settings
- `PUT /api/settings` - Update global settings
- `POST /api/settings/blocked-websites` - Add blocked site
- `DELETE /api/settings/blocked-websites` - Remove blocked site

### System
- `GET /api/status` - Get current blocking status
- `GET /health` - Server health check

## Daemon Management

```bash
# Check daemon status and current blocking state
npm run daemon:status

# Restore hosts file from backup
npm run daemon:restore

# View daemon logs
tail -f ~/.habit-tracker/logs/daemon.log
```

## Security Considerations

- Daemon runs with minimal privileges (only hosts file access)
- Input validation on all domains
- CORS properly configured for localhost
- Timestamped backups before any hosts file modification
- 30-day backup retention

## Contributing

This project follows TDD/BDD practices:

1. Write BDD feature files first
2. Implement step definitions
3. Write failing unit tests
4. Implement the feature
5. Verify E2E tests pass

## License

MIT

## Troubleshooting

### Daemon not starting
Check the logs:
```bash
tail -f ~/.habit-tracker/logs/daemon.log
```

### Websites not blocking
1. Verify daemon is running: `launchctl list | grep habit-tracker`
2. Check hosts file: `cat /etc/hosts`
3. Check daemon status: `npm run daemon:status`
4. Flush DNS cache: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`

### Restore hosts file
If the hosts file is corrupted:
```bash
npm run daemon:restore
```

### Permission errors
The daemon needs sudo access to modify `/etc/hosts`. You may need to grant permissions or run the installation script again.

### Dev vs Prod confusion
Check which environment you're in:
- Dev: ports 3001/5174, database in `./data/dev/`
- Prod: ports 3000/5173, database in `~/.habit-tracker/data/`

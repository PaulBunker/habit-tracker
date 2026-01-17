# Habit Tracker with Website Blocking

A habit tracking webapp that blocks specified websites when habits aren't completed by their deadlines. Uses the system hosts file for blocking, with a background service managing permissions.

## Features

- Create daily habits with deadlines
- Block specific websites when habits are overdue
- Complete or skip habits with reasons
- View habit history and statistics
- Automatic website blocking via macOS daemon
- Timestamped backups of hosts file
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
│   ├── backend/                   # Express API server
│   ├── daemon/                    # Background service for hosts file
│   ├── shared/                    # Shared types and utilities
│   └── e2e/                       # End-to-end tests
├── scripts/                       # Installation scripts
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
   npm run db:seed  # Optional: seed with sample data
   ```

4. Install the daemon (requires sudo):
   ```bash
   npm run install:daemon
   ```

### Development

Run all services in development mode:
```bash
npm run dev
```

This starts:
- Frontend on http://localhost:5173
- Backend on http://localhost:3000
- Daemon in watch mode

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

1. **Create Habits**: Define daily habits with deadlines and websites to block
2. **Daemon Monitoring**: Background service checks habit deadlines every minute
3. **Automatic Blocking**: When deadline passes without completion, daemon updates hosts file
4. **Check In**: Complete or skip habits to unblock websites
5. **Backup & Rollback**: Daemon creates timestamped backups before modifying hosts file

## Database Schema

### Habits
- `id`: UUID primary key
- `name`: Habit name
- `description`: Optional description
- `deadlineUtc`: Deadline in UTC (HH:MM)
- `timezoneOffset`: User's timezone offset
- `blockedWebsites`: JSON array of domains
- `isActive`: Boolean flag
- `createdAt`: Creation timestamp

### HabitLogs
- `id`: UUID primary key
- `habitId`: Foreign key to habits
- `date`: Date in YYYY-MM-DD format
- `status`: 'completed' | 'skipped' | 'missed'
- `completedAt`: Completion timestamp
- `skipReason`: Required when status is 'skipped'
- `notes`: Optional notes
- `createdAt`: Creation timestamp

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

### System
- `GET /api/status` - Get current blocking status
- `POST /api/daemon/sync` - Trigger daemon sync

## Security Considerations

- Daemon runs with minimal privileges (only hosts file access)
- Input validation on all domains
- Rate limiting on API endpoints
- CORS properly configured
- Timestamped backups before any hosts file modification

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
3. Flush DNS cache: `dscacheutil -flushcache`

### Permission errors
The daemon needs sudo access to modify `/etc/hosts`. You may need to grant permissions or run the installation script again.

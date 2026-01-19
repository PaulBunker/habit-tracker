# System Architecture

## Package Structure

```
habit-tracker/
├── packages/
│   ├── shared/      # TypeScript types and utilities
│   ├── backend/     # Express API server
│   ├── frontend/    # React webapp
│   ├── daemon/      # Background service
│   └── docs/        # Documentation (VitePress)
└── docs/            # Legacy markdown docs
```

## Data Flow

```
User → Frontend → Backend API → SQLite ← Daemon → /etc/hosts
```

1. User interacts with the React frontend
2. Frontend makes API calls to the Express backend
3. Backend persists data to SQLite using Drizzle ORM
4. Daemon monitors habit status and updates `/etc/hosts` accordingly

## Key Components

### Shared Package

Contains all TypeScript interfaces shared across packages:

- `Habit` - Habit definition with deadline
- `HabitLog` - Daily completion records
- `AppSettings` - Application configuration
- `BlockedSite` - Website blocking configuration

### Backend Package

Express API server providing REST endpoints:

- `/api/habits` - CRUD operations for habits
- `/api/habits/:id/logs` - Habit completion logging
- `/api/blocked-sites` - Website blocklist management
- `/api/settings` - Application settings

### Frontend Package

React application with Vite:

- Components for habit management
- Real-time status display
- Settings interface

### Daemon Package

Background service responsibilities:

- Receives IPC triggers from backend
- 30-second fallback polling
- Modifies `/etc/hosts` for blocking
- Runs with elevated privileges

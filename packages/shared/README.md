# @habit-tracker/shared

Shared TypeScript types and utility functions used across all Habit Tracker packages.

## Key Files

| File | Purpose |
|------|---------|
| `src/types.ts` | Core interfaces: `Habit`, `HabitLog`, `AppSettings`, request/response types |
| `src/utils.ts` | Timezone conversion, date formatting, domain validation |
| `src/daemon-client.ts` | IPC client for daemon communication (Node.js only) |
| `src/index.ts` | Package entry point - re-exports types and utils |

## Exports

### Types

- `Habit` - Habit definition with deadline, tracking options, and active days
- `HabitLog` - Daily completion record with status, notes, and data values
- `AppSettings` - Global settings including blocked websites
- `CreateHabitRequest`, `UpdateHabitRequest` - API request types
- `CompleteHabitRequest`, `SkipHabitRequest` - Habit action types
- `DaemonStatus` - Current blocking state
- `ApiResponse<T>` - Standard API response wrapper

### Utilities

- `localTimeToUtc()` / `utcTimeToLocal()` - Timezone conversions
- `isValidDomain()` - Domain format validation
- `getCurrentDateUtc()` / `getCurrentTimeUtc()` - Date/time helpers
- `getTimezoneOffset()` - Browser timezone detection

### Daemon Client

The daemon client is server-only and must be imported directly:

```typescript
import { notifyDaemon, pingDaemon, resetHosts } from '@habit-tracker/shared/daemon-client';
```

## Development

```bash
# Build (required before other packages)
npm run build -w @habit-tracker/shared

# Run tests
npm test -w @habit-tracker/shared
```

## Architecture

This package is built as dual CJS/ESM to support both Node.js (backend/daemon) and browser (frontend) environments. The daemon client is excluded from the main entry point since it requires Node.js-specific modules.

**Build order matters**: This package must be built first before backend, daemon, or frontend can compile.

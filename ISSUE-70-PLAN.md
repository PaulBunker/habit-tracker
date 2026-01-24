# Issue #70 Implementation Plan: Emergency Reset Bypass Mechanism

**Issue**: Emergency reset button ineffective - daemon re-blocks within 60s
**Branch**: `claude/github-issues-skill-l9rm0`
**Status**: Planning Complete - Ready for Implementation

---

## Problem Summary

The emergency reset button clears blocked websites from `/etc/hosts`, but the daemon's 60-second polling loop immediately re-blocks them since no bypass mechanism exists to persist the unblocked state.

**Root Cause**: The daemon has no concept of a "bypass period" - it always applies blocking logic based purely on habit status.

---

## Solution Overview

Implement a time-limited bypass mechanism:
- Add `bypassUntil` field to daemon state (persisted to JSON file)
- Set bypass duration (default 30 minutes, max 120) when emergency reset triggers
- Modify polling logic to skip blocking during bypass period
- Add API endpoints to manage bypass status
- Display bypass countdown in frontend

---

## Acceptance Criteria

- [ ] Emergency reset provides configurable duration of unblocking (30 min default)
- [ ] Daemon respects bypass period without re-blocking
- [ ] Bypass state persists across daemon restarts
- [ ] User visibility into active bypass status and expiration
- [ ] Normal blocking resumes after bypass expires

---

## Phase 1: Shared Types & Client

### 1.1 Add Bypass Types

**File**: `packages/shared/src/types.ts`

Add after existing interfaces:

```typescript
/** Bypass state for emergency reset functionality */
export interface BypassState {
  /** ISO 8601 timestamp when bypass expires, null if not active */
  bypassUntil: string | null;
  /** Minutes remaining in bypass period, 0 if not active */
  remainingMinutes: number;
  /** Whether bypass is currently active */
  isActive: boolean;
}

/** Request body for activating emergency bypass */
export interface ActivateBypassRequest {
  /** Duration in minutes (default: 30, max: 120) */
  durationMinutes?: number;
}
```

### 1.2 Extend Daemon Client

**File**: `packages/shared/src/daemon-client.ts`

Add new functions following existing socket communication pattern:

```typescript
/**
 * Activates emergency bypass for specified duration.
 * @param durationMinutes - Duration in minutes (default 30, max 120)
 */
export async function activateBypass(durationMinutes: number = 30): Promise<BypassState | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH);
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(null);
    }, SOCKET_TIMEOUT);

    socket.on('connect', () => {
      socket.write(`bypass ${durationMinutes}\n`);
    });

    socket.on('data', (data) => {
      clearTimeout(timeout);
      try {
        const response = JSON.parse(data.toString().trim());
        resolve(response as BypassState);
      } catch {
        resolve(null);
      }
      socket.destroy();
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

/**
 * Cancels any active emergency bypass.
 */
export async function cancelBypass(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH);
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, SOCKET_TIMEOUT);

    socket.on('connect', () => {
      socket.write('bypass-cancel\n');
    });

    socket.on('data', (data) => {
      clearTimeout(timeout);
      resolve(data.toString().trim() === 'ok');
      socket.destroy();
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

/**
 * Gets current bypass status from daemon.
 */
export async function getBypassStatus(): Promise<BypassState | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH);
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(null);
    }, SOCKET_TIMEOUT);

    socket.on('connect', () => {
      socket.write('bypass-status\n');
    });

    socket.on('data', (data) => {
      clearTimeout(timeout);
      try {
        const response = JSON.parse(data.toString().trim());
        resolve(response as BypassState);
      } catch {
        resolve(null);
      }
      socket.destroy();
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}
```

### 1.3 Tests for Daemon Client

**File**: `packages/shared/src/daemon-client.test.ts`

Test cases:
- `activateBypass()` sends correct command format
- `activateBypass()` parses successful response
- `activateBypass()` returns null on connection failure
- `cancelBypass()` sends correct command and returns true on 'ok'
- `getBypassStatus()` parses state correctly
- All functions handle timeout gracefully

### Phase 1 Verification

```bash
npm run build -w @habit-tracker/shared
npm test -w @habit-tracker/shared
```

---

## Phase 2: Daemon State Management

### 2.1 Create State Manager Module

**File**: `packages/daemon/src/state-manager.ts` (NEW)

```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { BypassState } from '@habit-tracker/shared';

const STATE_DIR = path.join(os.homedir(), '.habit-tracker');
const STATE_FILE_PATH = path.join(STATE_DIR, 'daemon-state.json');

interface DaemonState {
  bypassUntil: string | null; // ISO 8601 timestamp
}

const DEFAULT_STATE: DaemonState = {
  bypassUntil: null,
};

/**
 * Ensure state directory exists
 */
function ensureStateDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

/**
 * Load daemon state from disk
 */
export function loadState(): DaemonState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const content = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      return JSON.parse(content) as DaemonState;
    }
  } catch {
    // Return defaults on any error
  }
  return { ...DEFAULT_STATE };
}

/**
 * Save daemon state to disk
 */
export function saveState(state: DaemonState): void {
  ensureStateDir();
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

/**
 * Check if bypass is currently active
 */
export function isBypassActive(): boolean {
  const state = loadState();
  if (!state.bypassUntil) return false;
  return new Date(state.bypassUntil).getTime() > Date.now();
}

/**
 * Get bypass state with computed fields
 */
export function getBypassState(): BypassState {
  const state = loadState();

  if (!state.bypassUntil) {
    return { bypassUntil: null, remainingMinutes: 0, isActive: false };
  }

  const expiresAt = new Date(state.bypassUntil).getTime();
  const now = Date.now();
  const remainingMs = Math.max(0, expiresAt - now);
  const remainingMinutes = remainingMs / (1000 * 60);
  const isActive = remainingMs > 0;

  return {
    bypassUntil: isActive ? state.bypassUntil : null,
    remainingMinutes: isActive ? remainingMinutes : 0,
    isActive,
  };
}

/**
 * Activate bypass for specified duration
 */
export function activateBypass(durationMinutes: number): BypassState {
  const bypassUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  saveState({ bypassUntil });
  return getBypassState();
}

/**
 * Cancel active bypass
 */
export function cancelBypass(): void {
  saveState({ bypassUntil: null });
}
```

### 2.2 State Manager Tests

**File**: `packages/daemon/src/state-manager.test.ts` (NEW)

Test cases:
- `loadState()` returns defaults when file missing
- `loadState()` parses valid state file
- `saveState()` writes JSON correctly
- `isBypassActive()` returns true when `bypassUntil` is in future
- `isBypassActive()` returns false when `bypassUntil` is in past
- `isBypassActive()` returns false when `bypassUntil` is null
- `activateBypass()` calculates correct timestamp
- `activateBypass()` persists state to disk
- `cancelBypass()` clears `bypassUntil` and persists
- `getBypassState()` computes remaining minutes correctly

### Phase 2 Verification

```bash
npm test -w @habit-tracker/daemon -- --testPathPattern=state-manager
```

---

## Phase 3: Daemon Core Integration

### 3.1 Extend Socket Server

**File**: `packages/daemon/src/socket-server.ts`

Update `SocketServerOptions` interface:

```typescript
export interface SocketServerOptions {
  onRefresh: () => Promise<void>;
  onReset: () => Promise<void>;
  onBypass: (durationMinutes: number) => Promise<BypassState>;
  onBypassCancel: () => Promise<void>;
  onBypassStatus: () => BypassState;
  socketPath?: string;
}
```

Add command handlers in `socket.on('data')`:

```typescript
else if (message.startsWith('bypass ')) {
  const minutes = parseInt(message.split(' ')[1], 10);
  if (isNaN(minutes) || minutes < 1 || minutes > 120) {
    socket.write('error: invalid duration (1-120 minutes)\n');
  } else {
    const state = await onBypass(minutes);
    socket.write(JSON.stringify(state) + '\n');
  }
}
else if (message === 'bypass-cancel') {
  await onBypassCancel();
  socket.write('ok\n');
}
else if (message === 'bypass-status') {
  const state = onBypassStatus();
  socket.write(JSON.stringify(state) + '\n');
}
```

### 3.2 Socket Server Tests

**File**: `packages/daemon/src/socket-server.test.ts`

Add test cases:
- `bypass` command activates bypass with valid duration
- `bypass` command returns error for invalid duration
- `bypass` command returns error for duration > 120
- `bypass` command returns error for duration < 1
- `bypass-cancel` command calls callback and returns 'ok'
- `bypass-status` command returns JSON state

### 3.3 Integrate into Main Daemon

**File**: `packages/daemon/src/index.ts`

Add imports:
```typescript
import {
  isBypassActive,
  activateBypass,
  cancelBypass,
  getBypassState,
  loadState,
} from './state-manager';
```

Modify `checkAndUpdate()` function to respect bypass:

```typescript
async function checkAndUpdate(): Promise<void> {
  log('Checking habits...');

  // Check if bypass is active BEFORE checking habits
  if (isBypassActive()) {
    const state = getBypassState();
    log(`Bypass active - ${Math.round(state.remainingMinutes)} minutes remaining. Skipping blocking.`);
    await scheduleNextDeadline();
    return;
  }

  // ... existing logic unchanged ...
}
```

Update socket server initialization:

```typescript
socketServer = startSocketServer({
  onRefresh: checkAndUpdate,
  onReset: async () => {
    log('Emergency reset triggered - clearing all blocked hosts');
    updateHostsFile([]);
  },
  onBypass: async (durationMinutes: number) => {
    const state = activateBypass(durationMinutes);
    log(`Bypass activated for ${durationMinutes} minutes until ${state.bypassUntil}`);
    updateHostsFile([]); // Clear hosts immediately
    return state;
  },
  onBypassCancel: async () => {
    log('Bypass cancelled');
    cancelBypass();
    await checkAndUpdate(); // Re-evaluate blocking immediately
  },
  onBypassStatus: () => getBypassState(),
});
```

Add state loading on startup:
```typescript
// Load persisted bypass state on startup
loadState();
log(`Daemon started. Bypass state: ${isBypassActive() ? 'ACTIVE' : 'inactive'}`);
```

### Phase 3 Verification

```bash
npm test -w @habit-tracker/daemon
npm run build -w @habit-tracker/daemon
```

---

## Phase 4: Backend API

### 4.1 Add Bypass Endpoints

**File**: `packages/backend/src/routes/status.ts`

Add imports:
```typescript
import {
  activateBypass,
  cancelBypass,
  getBypassStatus,
} from '@habit-tracker/shared/daemon-client';
import type { ActivateBypassRequest, BypassState } from '@habit-tracker/shared';
```

Add endpoints:

```typescript
/**
 * POST /api/daemon/bypass - Activate emergency bypass
 */
router.post('/daemon/bypass', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { durationMinutes = 30 } = req.body as ActivateBypassRequest;

    if (durationMinutes < 1 || durationMinutes > 120) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 1 and 120 minutes',
      });
    }

    const bypassState = await activateBypass(durationMinutes);

    if (bypassState) {
      res.json({
        success: true,
        data: {
          message: `Bypass activated for ${durationMinutes} minutes`,
          bypass: bypassState,
        },
      });
    } else {
      res.json({
        success: false,
        message: 'Daemon not reachable',
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/daemon/bypass - Cancel active bypass
 */
router.delete('/daemon/bypass', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await cancelBypass();
    res.json({
      success,
      message: success ? 'Bypass cancelled' : 'Daemon not reachable',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/daemon/bypass - Get bypass status
 */
router.get('/daemon/bypass', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const bypassState = await getBypassStatus();
    res.json({
      success: true,
      data: bypassState || { isActive: false, bypassUntil: null, remainingMinutes: 0 },
    });
  } catch (error) {
    next(error);
  }
});
```

### 4.2 Backend Tests

**File**: `packages/backend/src/routes/status.test.ts`

Add mocks and test cases for all three endpoints.

### Phase 4 Verification

```bash
npm test -w @habit-tracker/backend
npm run build -w @habit-tracker/backend
```

---

## Phase 5: Frontend

### 5.1 Extend API Client

**File**: `packages/frontend/src/api/client.ts`

Add to `statusApi` object:

```typescript
async activateBypass(durationMinutes: number = 30): Promise<ApiResponse<{ message: string; bypass: BypassState }>> {
  return fetchApi<{ message: string; bypass: BypassState }>('/daemon/bypass', {
    method: 'POST',
    body: JSON.stringify({ durationMinutes }),
  });
},

async cancelBypass(): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>('/daemon/bypass', {
    method: 'DELETE',
  });
},

async getBypassStatus(): Promise<ApiResponse<BypassState>> {
  return fetchApi<BypassState>('/daemon/bypass');
},
```

### 5.2 Redesign EmergencyResetButton

**File**: `packages/frontend/src/components/EmergencyResetButton.tsx`

Key changes:
- Add state for `bypassState`, `selectedDuration`
- Poll for bypass status on mount
- Show countdown timer when bypass active
- Duration selector dropdown (15, 30, 60, 120 min)
- Cancel bypass button when active
- Confirmation dialogs before activate/cancel

### 5.3 Component Tests

**File**: `packages/frontend/src/components/EmergencyResetButton.test.tsx`

Update mocks and add test cases for new functionality.

### Phase 5 Verification

```bash
npm test -w @habit-tracker/frontend
npm run build -w @habit-tracker/frontend
```

---

## Phase 6: E2E Testing

### 6.1 Add E2E Test

**File**: `packages/frontend/e2e/emergency-bypass.spec.ts` (NEW)

Test scenarios:
1. User activates bypass with default duration
2. Countdown displays and decrements
3. User cancels bypass early
4. Bypass persists across page reload

### Phase 6 Verification

```bash
npm run test:e2e
```

---

## Final Verification

```bash
# Full test suite
npm test

# Lint
npm run lint

# Build all
npm run build

# Manual test in dev mode
npm run dev
```

---

## Edge Cases Handled

| Edge Case | Solution |
|-----------|----------|
| Daemon restart during bypass | State persisted to JSON file |
| System clock change | Use absolute timestamp comparison |
| State file corruption | Return defaults on parse error |
| Concurrent bypass requests | Last request wins |
| Frontend polls while backend unreachable | Graceful degradation |

---

## Files Changed Summary

| Package | File | Change Type |
|---------|------|-------------|
| shared | `src/types.ts` | Modified |
| shared | `src/daemon-client.ts` | Modified |
| shared | `src/daemon-client.test.ts` | Modified/New |
| daemon | `src/state-manager.ts` | **New** |
| daemon | `src/state-manager.test.ts` | **New** |
| daemon | `src/socket-server.ts` | Modified |
| daemon | `src/socket-server.test.ts` | Modified |
| daemon | `src/index.ts` | Modified |
| backend | `src/routes/status.ts` | Modified |
| backend | `src/routes/status.test.ts` | Modified |
| frontend | `src/api/client.ts` | Modified |
| frontend | `src/components/EmergencyResetButton.tsx` | Modified |
| frontend | `src/components/EmergencyResetButton.test.tsx` | Modified |
| frontend | `e2e/emergency-bypass.spec.ts` | **New** |

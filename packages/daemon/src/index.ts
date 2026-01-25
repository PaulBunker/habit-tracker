import { checkHabits, getNextDeadlineMs } from './scheduler';
import {
  ensureDirectories,
  updateHostsFile,
  cleanupOldBackups,
  log,
  getBlockedDomains,
} from './hosts-manager';
import { startSocketServer, stopSocketServer } from './socket-server';
import {
  isBypassActive,
  getBypassState,
  activateBypass,
  cancelBypass,
} from './state-manager';
import net from 'net';

const CHECK_INTERVAL = 60 * 1000; // 60 seconds (fallback - deadlines use precise timers)

const NODE_ENV = process.env.NODE_ENV || 'development';

let socketServer: net.Server | null = null;
let deadlineTimer: NodeJS.Timeout | null = null;

/**
 * Schedule a timer to trigger at the next deadline
 */
async function scheduleNextDeadline(): Promise<void> {
  // Clear any existing deadline timer
  if (deadlineTimer) {
    clearTimeout(deadlineTimer);
    deadlineTimer = null;
  }

  try {
    const msUntilDeadline = await getNextDeadlineMs();

    if (msUntilDeadline !== null && msUntilDeadline > 0) {
      // Add 1 second buffer to ensure we're past the deadline
      const scheduleMs = msUntilDeadline + 1000;
      const minutes = Math.floor(scheduleMs / 60000);
      const seconds = Math.floor((scheduleMs % 60000) / 1000);

      log(`Next deadline in ${minutes}m ${seconds}s - scheduling timer`);

      deadlineTimer = setTimeout(async () => {
        log('Deadline timer triggered');
        try {
          await checkAndUpdate();
        } catch (error) {
          log(`Error in deadline timer: ${error}`, 'error');
        }
      }, scheduleMs);
    } else {
      log('No upcoming deadlines today');
    }
  } catch (error) {
    log(`Error scheduling deadline: ${error}`, 'error');
  }
}

/**
 * Check habits and update hosts file if needed
 */
async function checkAndUpdate(): Promise<void> {
  log('Checking habits...');

  // Check if bypass is active - skip blocking during bypass period
  if (isBypassActive()) {
    const state = getBypassState();
    log(`Bypass active - ${Math.round(state.remainingMinutes)} minutes remaining. Skipping blocking.`);
    // Still schedule next deadline timer
    await scheduleNextDeadline();
    return;
  }

  const result = await checkHabits();

  if (result.incompleteTimedHabits.length > 0) {
    log(
      `Found ${result.incompleteTimedHabits.length} incomplete timed habits: ${result.incompleteTimedHabits.map((h) => h.name).join(', ')}`
    );
  }

  if (result.missedHabits.length > 0) {
    log(
      `Marked ${result.missedHabits.length} habits as missed: ${result.missedHabits.map((h) => h.name).join(', ')}`
    );
  }

  // Get currently blocked domains
  const currentlyBlocked = getBlockedDomains();

  // Check if we need to update
  const domainsChanged =
    result.domainsToBlock.sort().join(',') !== currentlyBlocked.sort().join(',');

  if (domainsChanged) {
    log(`Updating hosts file. Domains to block: ${result.domainsToBlock.join(', ')}`);
    updateHostsFile(result.domainsToBlock);
  } else {
    log('No changes needed to hosts file');
  }

  // Schedule timer for next deadline
  await scheduleNextDeadline();
}

/**
 * Main daemon loop
 */
async function run(): Promise<void> {
  log(`Habit Tracker Daemon started [${NODE_ENV.toUpperCase()}]`);

  // Ensure necessary directories exist
  ensureDirectories();

  // Initial cleanup of old backups
  cleanupOldBackups();

  // Start socket server for IPC
  socketServer = startSocketServer({
    onRefresh: checkAndUpdate,
    onReset: async () => {
      log('Emergency reset triggered - clearing all blocked hosts');
      updateHostsFile([]);
    },
    onBypass: async (durationMinutes: number) => {
      const state = activateBypass(durationMinutes);
      // Clear hosts immediately when bypass starts
      updateHostsFile([]);
      return state;
    },
    onBypassCancel: async () => {
      cancelBypass();
      // Re-evaluate blocking immediately after cancellation
      await checkAndUpdate();
    },
    onBypassStatus: () => getBypassState(),
  });

  // Fallback polling loop (for time-based triggers like deadlines)
  setInterval(async () => {
    try {
      await checkAndUpdate();
    } catch (error) {
      log(`Error in daemon loop: ${error}`, 'error');
    }
  }, CHECK_INTERVAL);

  // Also run immediately on startup
  try {
    await checkAndUpdate();
  } catch (error) {
    log(`Error in initial check: ${error}`, 'error');
  }
}

// Handle graceful shutdown
async function shutdown(): Promise<void> {
  log('Daemon shutting down...');
  if (socketServer) {
    await stopSocketServer(socketServer);
    log('Socket server stopped');
  }
  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown();
});

process.on('SIGTERM', () => {
  shutdown();
});

// Start daemon
run().catch((error) => {
  log(`Fatal error: ${error}`, 'error');
  process.exit(1);
});

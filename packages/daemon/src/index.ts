import { checkHabits } from './scheduler';
import {
  ensureDirectories,
  updateHostsFile,
  cleanupOldBackups,
  log,
  getBlockedDomains,
} from './hosts-manager';
import { startSocketServer, stopSocketServer } from './socket-server';
import net from 'net';

const CHECK_INTERVAL = 30 * 1000; // 30 seconds (fallback for time-based triggers)

const NODE_ENV = process.env.NODE_ENV || 'development';

let socketServer: net.Server | null = null;

/**
 * Check habits and update hosts file if needed
 */
async function checkAndUpdate(): Promise<void> {
  log('Checking habits...');

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
  socketServer = startSocketServer(checkAndUpdate);

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
    const result = await checkHabits();
    updateHostsFile(result.domainsToBlock);
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

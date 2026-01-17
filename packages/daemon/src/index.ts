import { checkHabits } from './scheduler';
import {
  ensureDirectories,
  updateHostsFile,
  cleanupOldBackups,
  log,
  getBlockedDomains,
} from './hosts-manager';

const CHECK_INTERVAL = 60 * 1000; // 60 seconds

/**
 * Main daemon loop
 */
async function run() {
  log('Habit Tracker Daemon started');

  // Ensure necessary directories exist
  ensureDirectories();

  // Initial cleanup of old backups
  cleanupOldBackups();

  // Main loop
  setInterval(async () => {
    try {
      log('Checking habits...');

      const result = await checkHabits();

      if (result.overdueHabits.length > 0) {
        log(
          `Found ${result.overdueHabits.length} overdue habits: ${result.overdueHabits.map((h) => h.name).join(', ')}`
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
process.on('SIGINT', () => {
  log('Daemon shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Daemon shutting down...');
  process.exit(0);
});

// Start daemon
run().catch((error) => {
  log(`Fatal error: ${error}`, 'error');
  process.exit(1);
});

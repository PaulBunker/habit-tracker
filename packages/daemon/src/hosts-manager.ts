import fs from 'fs';
import path from 'path';
import os from 'os';

const HOSTS_FILE_PATH = '/etc/hosts';
const BACKUP_DIR = path.join(os.homedir(), '.habit-tracker', 'backups');
const LOGS_DIR = path.join(os.homedir(), '.habit-tracker', 'logs');
const HABIT_TRACKER_MARKER = '# HABIT-TRACKER-START';
const HABIT_TRACKER_END = '# HABIT-TRACKER-END';

/**
 * Ensure necessary directories exist
 */
export function ensureDirectories(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

/**
 * Create a timestamped backup of the hosts file
 */
export function createBackup(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `hosts_${timestamp}.bak`);

  try {
    const hostsContent = fs.readFileSync(HOSTS_FILE_PATH, 'utf-8');
    fs.writeFileSync(backupPath, hostsContent);
    log(`Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    log(`Error creating backup: ${error}`, 'error');
    throw error;
  }
}

/**
 * Cleanup old backups (keep last 30 days)
 */
export function cleanupOldBackups(): void {
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const backups = fs.readdirSync(BACKUP_DIR);

    backups.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        log(`Deleted old backup: ${file}`);
      }
    });
  } catch (error) {
    log(`Error cleaning up old backups: ${error}`, 'error');
  }
}

/**
 * Read the current hosts file content
 */
export function readHostsFile(): string {
  try {
    return fs.readFileSync(HOSTS_FILE_PATH, 'utf-8');
  } catch (error) {
    log(`Error reading hosts file: ${error}`, 'error');
    throw error;
  }
}

/**
 * Get currently blocked domains from hosts file
 */
export function getBlockedDomains(): string[] {
  const content = readHostsFile();
  const lines = content.split('\n');
  const blocked: string[] = [];

  let inSection = false;
  for (const line of lines) {
    if (line.includes(HABIT_TRACKER_MARKER)) {
      inSection = true;
      continue;
    }
    if (line.includes(HABIT_TRACKER_END)) {
      break;
    }
    if (inSection && line.trim() && !line.startsWith('#')) {
      const match = line.match(/^127\.0\.0\.1\s+(.+)$/);
      if (match) {
        blocked.push(match[1].trim());
      }
    }
  }

  return blocked;
}

/**
 * Update hosts file with blocked domains
 * Uses sudo to write to /etc/hosts since it requires root permissions
 */
export function updateHostsFile(domainsToBlock: string[]): void {
  const { execSync } = require('child_process');

  try {
    // Create backup first
    createBackup();

    // Read current hosts file
    const content = readHostsFile();
    const lines = content.split('\n');

    // Remove existing habit-tracker section
    const filteredLines: string[] = [];
    let inSection = false;
    for (const line of lines) {
      if (line.includes(HABIT_TRACKER_MARKER)) {
        inSection = true;
        continue;
      }
      if (line.includes(HABIT_TRACKER_END)) {
        inSection = false;
        continue;
      }
      if (!inSection) {
        filteredLines.push(line);
      }
    }

    // Add new habit-tracker section if there are domains to block
    if (domainsToBlock.length > 0) {
      filteredLines.push('');
      filteredLines.push(HABIT_TRACKER_MARKER);
      domainsToBlock.forEach((domain) => {
        // Block the domain and www. variant
        filteredLines.push(`127.0.0.1 ${domain}`);
        if (!domain.startsWith('www.')) {
          filteredLines.push(`127.0.0.1 www.${domain}`);
        }
      });
      filteredLines.push(HABIT_TRACKER_END);
    }

    // Write updated content using sudo cp
    const newContent = filteredLines.join('\n');
    // Use /tmp directly (not os.tmpdir()) to match sudoers entry
    const tempFile = '/tmp/habit-tracker-hosts-temp';
    fs.writeFileSync(tempFile, newContent);

    // Use sudo to copy the temp file to /etc/hosts
    execSync(`sudo cp "${tempFile}" "${HOSTS_FILE_PATH}"`, { stdio: 'inherit' });
    fs.unlinkSync(tempFile);

    log(
      `Hosts file updated. Blocking ${domainsToBlock.length} domains: ${domainsToBlock.join(', ')}`
    );

    // Flush DNS cache on macOS
    flushDnsCache();
  } catch (error) {
    log(`Error updating hosts file: ${error}`, 'error');
    throw error;
  }
}

/**
 * Restore hosts file from backup
 * Uses sudo to write to /etc/hosts since it requires root permissions
 */
export function restoreFromBackup(backupPath: string): void {
  const { execSync } = require('child_process');

  try {
    execSync(`sudo cp "${backupPath}" "${HOSTS_FILE_PATH}"`, { stdio: 'inherit' });
    log(`Hosts file restored from backup: ${backupPath}`);
    flushDnsCache();
  } catch (error) {
    log(`Error restoring from backup: ${error}`, 'error');
    throw error;
  }
}

/**
 * Flush DNS cache on macOS
 */
function flushDnsCache(): void {
  try {
    const { execSync } = require('child_process');
    execSync('dscacheutil -flushcache; sudo killall -HUP mDNSResponder');
    log('DNS cache flushed');
  } catch (error) {
    log(`Error flushing DNS cache: ${error}`, 'error');
  }
}

/**
 * Log message to file
 * Note: We only write to the log file, not console, because launchd
 * redirects stdout to the same log file which would cause duplicates.
 */
export function log(message: string, level: 'info' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  const logPath = path.join(LOGS_DIR, 'daemon.log');

  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    // Fallback to console if file write fails
    console.error(`Error writing to log file: ${error}`);
    console.error(logMessage);
  }
}

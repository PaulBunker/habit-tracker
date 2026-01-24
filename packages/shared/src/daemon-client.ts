/**
 * IPC client for communicating with the habit-tracker daemon.
 *
 * This module provides functions to interact with the background daemon
 * that manages website blocking via /etc/hosts modification. Communication
 * happens over a Unix domain socket at ~/.habit-tracker/daemon.sock.
 *
 * **Note**: This module is Node.js-only and should be imported directly:
 * ```typescript
 * import { notifyDaemon, pingDaemon, resetHosts } from '@habit-tracker/shared/daemon-client';
 * ```
 *
 * @packageDocumentation
 */

import net from 'net';
import path from 'path';
import os from 'os';
import type { BypassState } from './types';

const SOCKET_PATH = path.join(os.homedir(), '.habit-tracker', 'daemon.sock');
const TIMEOUT_MS = 1000;

/**
 * Notifies the daemon to refresh its blocking state.
 *
 * Call this after any change that affects blocking (habit completion,
 * deadline change, settings update). The daemon will re-evaluate which
 * habits are overdue and update /etc/hosts accordingly.
 *
 * @returns Promise resolving to `true` if daemon acknowledged, `false` if
 *          daemon is unavailable or didn't respond in time
 *
 * @example
 * ```typescript
 * // After completing a habit
 * await completeHabit(habitId);
 * const notified = await notifyDaemon();
 * if (!notified) {
 *   console.warn('Daemon not running - blocking state may be stale');
 * }
 * ```
 */
export async function notifyDaemon(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write('refresh\n');
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      const response = data.toString().trim();
      socket.end();
      resolve(response === 'ok');
    });

    socket.on('error', () => {
      // Daemon not running or socket unavailable - fail silently
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Checks if the daemon is running and responsive.
 *
 * Sends a ping command and waits for a pong response. Use this for
 * health checks or to verify daemon connectivity before operations.
 *
 * @returns Promise resolving to `true` if daemon responds with "pong",
 *          `false` if daemon is unavailable or unresponsive
 *
 * @example
 * ```typescript
 * const isRunning = await pingDaemon();
 * if (isRunning) {
 *   console.log('Daemon is healthy');
 * } else {
 *   console.error('Daemon is not responding');
 * }
 * ```
 */
export async function pingDaemon(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write('ping\n');
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      socket.end();
      resolve(data.toString().trim() === 'pong');
    });

    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Emergency reset: removes all habit-tracker entries from /etc/hosts.
 *
 * Use this for emergency unblocking when the user needs immediate access
 * to blocked websites. The daemon will remove all entries between the
 * `# HABIT-TRACKER-START` and `# HABIT-TRACKER-END` markers.
 *
 * **Warning**: This bypasses the normal blocking logic. Websites will
 * remain unblocked until the daemon's next check cycle or until
 * `notifyDaemon()` is called.
 *
 * @returns Promise resolving to `true` if reset succeeded, `false` if
 *          daemon is unavailable or reset failed
 *
 * @example
 * ```typescript
 * // Emergency unblock button handler
 * async function handleEmergencyReset() {
 *   const success = await resetHosts();
 *   if (success) {
 *     alert('All websites unblocked');
 *   } else {
 *     alert('Failed to reset - is the daemon running?');
 *   }
 * }
 * ```
 */
export async function resetHosts(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write('reset\n');
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      const response = data.toString().trim();
      socket.end();
      resolve(response === 'ok');
    });

    socket.on('error', () => {
      // Daemon not running or socket unavailable - fail silently
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Activates emergency bypass for specified duration.
 *
 * During the bypass period, the daemon will not re-block websites even if
 * habits are overdue. Use this when the user needs guaranteed uninterrupted
 * access to blocked websites.
 *
 * @param durationMinutes - Duration in minutes (default 30, max 120)
 * @returns Promise resolving to bypass state if successful, null if daemon unavailable
 *
 * @example
 * ```typescript
 * const bypass = await activateBypass(60); // 1 hour bypass
 * if (bypass) {
 *   console.log(`Bypass active until ${bypass.bypassUntil}`);
 * }
 * ```
 */
export async function activateBypass(
  durationMinutes: number = 30
): Promise<BypassState | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write(`bypass ${durationMinutes}\n`);
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      const response = data.toString().trim();
      socket.end();
      if (response.startsWith('error:')) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(response) as BypassState);
      } catch {
        resolve(null);
      }
    });

    socket.on('error', () => resolve(null));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Cancels any active emergency bypass.
 *
 * After cancellation, the daemon will immediately re-evaluate blocking state.
 * Websites will be re-blocked if any habits are overdue.
 *
 * @returns Promise resolving to `true` if cancelled, `false` if daemon unavailable
 *
 * @example
 * ```typescript
 * const cancelled = await cancelBypass();
 * if (cancelled) {
 *   console.log('Bypass cancelled - normal blocking resumed');
 * }
 * ```
 */
export async function cancelBypass(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write('bypass-cancel\n');
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      socket.end();
      resolve(data.toString().trim() === 'ok');
    });

    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Gets the current bypass status from the daemon.
 *
 * @returns Promise resolving to bypass state if daemon available, null otherwise
 *
 * @example
 * ```typescript
 * const status = await getBypassStatus();
 * if (status?.isActive) {
 *   console.log(`${status.remainingMinutes} minutes remaining`);
 * }
 * ```
 */
export async function getBypassStatus(): Promise<BypassState | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write('bypass-status\n');
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      socket.end();
      try {
        resolve(JSON.parse(data.toString().trim()) as BypassState);
      } catch {
        resolve(null);
      }
    });

    socket.on('error', () => resolve(null));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

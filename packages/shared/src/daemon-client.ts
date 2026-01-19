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

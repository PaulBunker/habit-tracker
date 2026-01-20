/**
 * Daemon status and control REST API routes.
 *
 * Provides endpoints to check daemon health, trigger synchronization,
 * and perform emergency resets of the blocking state.
 *
 * @packageDocumentation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { notifyDaemon, pingDaemon, resetHosts } from '@habit-tracker/shared/daemon-client';

const router = Router();

/**
 * GET /api/status
 *
 * Checks if the blocking daemon is running and responsive.
 *
 * @returns {ApiResponse<{isRunning: boolean, lastCheck: string, environment: string}>} Daemon status
 *
 * @example Response (200 OK) - Daemon running
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "isRunning": true,
 *     "lastCheck": "2024-01-15T14:30:00Z",
 *     "environment": "development"
 *   }
 * }
 * ```
 *
 * @example Response (200 OK) - Daemon not running
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "isRunning": false,
 *     "lastCheck": "2024-01-15T14:30:00Z",
 *     "environment": "production"
 *   }
 * }
 * ```
 */
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const isRunning = await pingDaemon();
    res.json({
      success: true,
      data: {
        isRunning,
        lastCheck: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/daemon/sync
 *
 * Triggers the daemon to immediately re-evaluate blocking state.
 *
 * Use this to force an update after changes that affect blocking
 * (habit completion, deadline changes, settings updates). The daemon
 * will check which habits are overdue and update /etc/hosts accordingly.
 *
 * @returns {{success: boolean, message: string}} Sync result
 *
 * @example Response (200 OK) - Success
 * ```json
 * {
 *   "success": true,
 *   "message": "Daemon refresh triggered"
 * }
 * ```
 *
 * @example Response (200 OK) - Daemon not reachable
 * ```json
 * {
 *   "success": false,
 *   "message": "Daemon not reachable"
 * }
 * ```
 */
router.post('/daemon/sync', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await notifyDaemon();
    res.json({
      success,
      message: success ? 'Daemon refresh triggered' : 'Daemon not reachable',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/daemon/reset
 *
 * Emergency reset: removes all habit-tracker entries from /etc/hosts.
 *
 * Use this for emergency unblocking when the user needs immediate access
 * to blocked websites. The daemon will remove all entries between the
 * `# HABIT-TRACKER-START` and `# HABIT-TRACKER-END` markers.
 *
 * **Warning**: Websites will remain unblocked until the daemon's next
 * check cycle or until /api/daemon/sync is called.
 *
 * @returns {{success: boolean, message: string}} Reset result
 *
 * @example Response (200 OK) - Success
 * ```json
 * {
 *   "success": true,
 *   "message": "Hosts file reset successfully"
 * }
 * ```
 *
 * @example Response (200 OK) - Failed
 * ```json
 * {
 *   "success": false,
 *   "message": "Daemon not reachable or reset failed"
 * }
 * ```
 */
router.post('/daemon/reset', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await resetHosts();
    res.json({
      success,
      message: success ? 'Hosts file reset successfully' : 'Daemon not reachable or reset failed',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

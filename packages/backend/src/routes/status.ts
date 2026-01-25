/**
 * Daemon status and control REST API routes.
 *
 * Provides endpoints to check daemon health, trigger synchronization,
 * and perform emergency resets of the blocking state.
 *
 * @packageDocumentation
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  notifyDaemon,
  pingDaemon,
  resetHosts,
  activateBypass,
  cancelBypass,
  getBypassStatus,
} from '@habit-tracker/shared/daemon-client';
import type { ActivateBypassRequest } from '@habit-tracker/shared';

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

/**
 * POST /api/daemon/bypass
 *
 * Activates emergency bypass for a specified duration.
 *
 * During the bypass period, the daemon will not re-block websites even if
 * habits become overdue. Use this when guaranteed uninterrupted access is needed.
 *
 * @param {ActivateBypassRequest} body - Request body with optional durationMinutes
 * @returns {{success: boolean, data?: {message: string, bypass: BypassState}}} Bypass result
 *
 * @example Request body
 * ```json
 * { "durationMinutes": 60 }
 * ```
 *
 * @example Response (200 OK) - Success
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Bypass activated for 60 minutes",
 *     "bypass": {
 *       "bypassUntil": "2024-01-15T15:30:00Z",
 *       "remainingMinutes": 60,
 *       "isActive": true
 *     }
 *   }
 * }
 * ```
 */
router.post('/daemon/bypass', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { durationMinutes = 30 } = req.body as ActivateBypassRequest;

    // Validate duration
    if (durationMinutes < 1 || durationMinutes > 120) {
      res.status(400).json({
        success: false,
        error: 'Duration must be between 1 and 120 minutes',
      });
      return;
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
 * DELETE /api/daemon/bypass
 *
 * Cancels any active emergency bypass.
 *
 * Normal blocking will resume immediately - websites will be re-blocked
 * if any habits are overdue.
 *
 * @returns {{success: boolean, message: string}} Cancel result
 *
 * @example Response (200 OK) - Success
 * ```json
 * {
 *   "success": true,
 *   "message": "Bypass cancelled"
 * }
 * ```
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
 * GET /api/daemon/bypass
 *
 * Gets the current bypass status.
 *
 * @returns {{success: boolean, data: BypassState}} Current bypass state
 *
 * @example Response (200 OK) - Bypass active
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "bypassUntil": "2024-01-15T15:30:00Z",
 *     "remainingMinutes": 25.5,
 *     "isActive": true
 *   }
 * }
 * ```
 *
 * @example Response (200 OK) - No active bypass
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "bypassUntil": null,
 *     "remainingMinutes": 0,
 *     "isActive": false
 *   }
 * }
 * ```
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

export default router;

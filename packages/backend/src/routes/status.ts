import { Router, Request, Response, NextFunction } from 'express';
import { notifyDaemon, pingDaemon } from '../lib/daemon-client';

const router = Router();

/**
 * GET /api/status - Get current blocking status
 */
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const isRunning = await pingDaemon();
    res.json({
      success: true,
      data: {
        isRunning,
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/daemon/sync - Trigger daemon sync
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

export default router;

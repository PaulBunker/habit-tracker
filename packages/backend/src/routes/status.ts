import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * GET /api/status - Get current blocking status
 */
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, this would query the daemon or check a shared state
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        isRunning: true,
        lastCheck: new Date().toISOString(),
        blockedDomains: [],
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
    // In a real implementation, this would trigger the daemon to check and update
    // For now, return a placeholder
    res.json({
      success: true,
      message: 'Sync triggered successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

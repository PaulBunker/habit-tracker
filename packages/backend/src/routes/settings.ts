import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

const router = Router();

// Validation schema for settings update
const updateSettingsSchema = z.object({
  blockedWebsites: z.array(z.string().url().or(z.string().regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/))).optional(),
  timezone: z.string().optional(),
});

// Helper to get a setting value
async function getSetting(key: string): Promise<string | null> {
  const [result] = await db.select().from(settings).where(eq(settings.key, key));
  return result?.value ?? null;
}

// Helper to set a setting value
async function setSetting(key: string, value: string): Promise<void> {
  const [existing] = await db.select().from(settings).where(eq(settings.key, key));

  if (existing) {
    await db
      .update(settings)
      .set({ value, updatedAt: new Date().toISOString() })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/settings - Get global settings
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const blockedWebsitesStr = await getSetting('blockedWebsites');
    const timezone = await getSetting('timezone');

    const data = {
      blockedWebsites: blockedWebsitesStr ? JSON.parse(blockedWebsitesStr) : [],
      timezone: timezone || undefined,
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings - Update global settings
 */
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateSettingsSchema.parse(req.body);

    if (validatedData.blockedWebsites !== undefined) {
      await setSetting('blockedWebsites', JSON.stringify(validatedData.blockedWebsites));
    }

    if (validatedData.timezone !== undefined) {
      await setSetting('timezone', validatedData.timezone);
    }

    // Return updated settings
    const blockedWebsitesStr = await getSetting('blockedWebsites');
    const timezone = await getSetting('timezone');

    const data = {
      blockedWebsites: blockedWebsitesStr ? JSON.parse(blockedWebsitesStr) : [],
      timezone: timezone || undefined,
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/settings/blocked-websites - Add a website to blocked list
 */
router.post('/blocked-websites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { website } = z.object({ website: z.string() }).parse(req.body);

    const blockedWebsitesStr = await getSetting('blockedWebsites');
    const blockedWebsites: string[] = blockedWebsitesStr ? JSON.parse(blockedWebsitesStr) : [];

    if (!blockedWebsites.includes(website)) {
      blockedWebsites.push(website);
      await setSetting('blockedWebsites', JSON.stringify(blockedWebsites));
    }

    res.json({ success: true, data: { blockedWebsites } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/settings/blocked-websites - Remove a website from blocked list
 */
router.delete('/blocked-websites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { website } = z.object({ website: z.string() }).parse(req.body);

    const blockedWebsitesStr = await getSetting('blockedWebsites');
    const blockedWebsites: string[] = blockedWebsitesStr ? JSON.parse(blockedWebsitesStr) : [];

    const index = blockedWebsites.indexOf(website);
    if (index === -1) {
      throw new AppError(404, 'Website not found in blocked list');
    }

    blockedWebsites.splice(index, 1);
    await setSetting('blockedWebsites', JSON.stringify(blockedWebsites));

    res.json({ success: true, data: { blockedWebsites } });
  } catch (error) {
    next(error);
  }
});

export default router;

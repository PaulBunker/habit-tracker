import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { habits, habitLogs } from '../db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { localTimeToUtc, utcTimeToLocal, getCurrentDateUtc } from '@habit-tracker/shared';
import { notifyDaemon } from '../lib/daemon-client';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

const router = Router();

// Validation schemas for v2
const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startTimeLocal: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  deadlineLocal: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  timezoneOffset: z.number().int().min(-720).max(840).optional().default(0),
  dataTracking: z.boolean().optional().default(false),
  dataUnit: z.string().max(20).optional(),
  activeDays: z.array(z.number().int().min(0).max(6)).optional(),
});

const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  startTimeLocal: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  deadlineLocal: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  timezoneOffset: z.number().int().min(-720).max(840).optional(),
  dataTracking: z.boolean().optional(),
  dataUnit: z.string().max(20).optional().nullable(),
  activeDays: z.array(z.number().int().min(0).max(6)).optional().nullable(),
  isActive: z.boolean().optional(),
});

const completeHabitSchema = z.object({
  notes: z.string().max(500).optional(),
  dataValue: z.number().min(0).optional(),
});

const skipHabitSchema = z.object({
  skipReason: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
});

// Helper to format habit for API response
function formatHabitResponse(habit: typeof habits.$inferSelect) {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    startTimeUtc: habit.startTimeUtc,
    startTimeLocal: habit.startTimeUtc ? utcTimeToLocal(habit.startTimeUtc, habit.timezoneOffset) : undefined,
    deadlineUtc: habit.deadlineUtc,
    deadlineLocal: habit.deadlineUtc ? utcTimeToLocal(habit.deadlineUtc, habit.timezoneOffset) : undefined,
    timezoneOffset: habit.timezoneOffset,
    dataTracking: habit.dataTracking,
    dataUnit: habit.dataUnit,
    activeDays: habit.activeDays ? JSON.parse(habit.activeDays) : undefined,
    createdAt: habit.createdAt,
    isActive: habit.isActive,
  };
}

/**
 * GET /api/habits - List all habits
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const allHabits = await db.select().from(habits).where(eq(habits.isActive, true));
    const formattedHabits = allHabits.map(formatHabitResponse);
    res.json({ success: true, data: formattedHabits });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/habits/:id - Get habit details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    res.json({ success: true, data: formatHabitResponse(habit) });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/habits - Create habit (v2: name only required)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createHabitSchema.parse(req.body);

    const newHabit = {
      id: randomUUID(),
      name: validatedData.name,
      description: validatedData.description || null,
      startTimeUtc: validatedData.startTimeLocal
        ? localTimeToUtc(validatedData.startTimeLocal, validatedData.timezoneOffset)
        : null,
      deadlineUtc: validatedData.deadlineLocal
        ? localTimeToUtc(validatedData.deadlineLocal, validatedData.timezoneOffset)
        : null,
      timezoneOffset: validatedData.timezoneOffset,
      dataTracking: validatedData.dataTracking,
      dataUnit: validatedData.dataUnit || null,
      activeDays: validatedData.activeDays ? JSON.stringify(validatedData.activeDays) : null,
      isActive: true,
    };

    await db.insert(habits).values(newHabit);

    res.status(201).json({ success: true, data: formatHabitResponse(newHabit as any) });

    // Fire-and-forget notification to daemon
    notifyDaemon().catch(() => {});
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/habits/:id - Update habit
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [existingHabit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!existingHabit) {
      throw new AppError(404, 'Habit not found');
    }

    const validatedData = updateHabitSchema.parse(req.body);
    const timezoneOffset = validatedData.timezoneOffset ?? existingHabit.timezoneOffset;

    const updateData: Partial<typeof habits.$inferInsert> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.dataTracking !== undefined) updateData.dataTracking = validatedData.dataTracking;
    if (validatedData.dataUnit !== undefined) updateData.dataUnit = validatedData.dataUnit;
    if (validatedData.activeDays !== undefined) {
      updateData.activeDays = validatedData.activeDays ? JSON.stringify(validatedData.activeDays) : null;
    }
    if (validatedData.timezoneOffset !== undefined) {
      updateData.timezoneOffset = validatedData.timezoneOffset;
    }
    if (validatedData.startTimeLocal !== undefined) {
      updateData.startTimeUtc = validatedData.startTimeLocal
        ? localTimeToUtc(validatedData.startTimeLocal, timezoneOffset)
        : null;
    }
    if (validatedData.deadlineLocal !== undefined) {
      updateData.deadlineUtc = validatedData.deadlineLocal
        ? localTimeToUtc(validatedData.deadlineLocal, timezoneOffset)
        : null;
    }

    await db.update(habits).set(updateData).where(eq(habits.id, req.params.id));

    const [updatedHabit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    res.json({ success: true, data: formatHabitResponse(updatedHabit) });

    // Fire-and-forget notification to daemon
    notifyDaemon().catch(() => {});
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/habits/:id - Delete habit
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [existingHabit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!existingHabit) {
      throw new AppError(404, 'Habit not found');
    }

    await db.delete(habits).where(eq(habits.id, req.params.id));

    res.json({ success: true, message: 'Habit deleted successfully' });

    // Fire-and-forget notification to daemon
    notifyDaemon().catch(() => {});
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/habits/:id/complete - Mark habit as complete (v2: supports dataValue)
 */
router.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    const validatedData = completeHabitSchema.parse(req.body);

    // Validate dataValue is provided for data-tracking habits
    if (habit.dataTracking && validatedData.dataValue === undefined) {
      throw new AppError(400, 'dataValue is required for data-tracking habits');
    }

    const today = getCurrentDateUtc();

    // Check if log already exists for today
    const [existingLog] = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, req.params.id), eq(habitLogs.date, today)));

    const logData = {
      id: existingLog?.id || randomUUID(),
      habitId: req.params.id,
      date: today,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      dataValue: validatedData.dataValue,
      notes: validatedData.notes,
    };

    if (existingLog) {
      await db
        .update(habitLogs)
        .set(logData)
        .where(eq(habitLogs.id, existingLog.id));
    } else {
      await db.insert(habitLogs).values(logData);
    }

    res.json({ success: true, data: logData });

    // Fire-and-forget notification to daemon
    notifyDaemon().catch(() => {});
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/habits/:id/skip - Skip habit with reason
 */
router.post('/:id/skip', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    const validatedData = skipHabitSchema.parse(req.body);
    const today = getCurrentDateUtc();

    // Check if log already exists for today
    const [existingLog] = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, req.params.id), eq(habitLogs.date, today)));

    const logData = {
      id: existingLog?.id || randomUUID(),
      habitId: req.params.id,
      date: today,
      status: 'skipped' as const,
      skipReason: validatedData.skipReason,
      notes: validatedData.notes,
    };

    if (existingLog) {
      await db
        .update(habitLogs)
        .set(logData)
        .where(eq(habitLogs.id, existingLog.id));
    } else {
      await db.insert(habitLogs).values(logData);
    }

    res.json({ success: true, data: logData });

    // Fire-and-forget notification to daemon
    notifyDaemon().catch(() => {});
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/habits/:id/logs - Get habit history
 */
router.get('/:id/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    const logs = await db
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.habitId, req.params.id))
      .orderBy(desc(habitLogs.date));

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/habits/:id/calendar - Get calendar data for a habit
 */
router.get('/:id/calendar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    // Get optional date range from query params
    const startDate = req.query.start as string | undefined;
    const endDate = req.query.end as string | undefined;

    let query = db
      .select({
        date: habitLogs.date,
        status: habitLogs.status,
        dataValue: habitLogs.dataValue,
      })
      .from(habitLogs)
      .where(eq(habitLogs.habitId, req.params.id));

    const logs = await query.orderBy(desc(habitLogs.date));

    // Filter by date range if provided
    const filteredLogs = logs.filter((log) => {
      if (startDate && log.date < startDate) return false;
      if (endDate && log.date > endDate) return false;
      return true;
    });

    res.json({ success: true, data: filteredLogs });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/habits/:id/graph - Get graph data for data-tracking habits
 */
router.get('/:id/graph', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    if (!habit.dataTracking) {
      throw new AppError(400, 'This habit does not have data tracking enabled');
    }

    // Get optional date range from query params
    const startDate = req.query.start as string | undefined;
    const endDate = req.query.end as string | undefined;

    const logs = await db
      .select({
        date: habitLogs.date,
        value: habitLogs.dataValue,
      })
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, req.params.id),
          eq(habitLogs.status, 'completed')
        )
      )
      .orderBy(habitLogs.date);

    // Filter by date range and remove null values
    const graphData = logs
      .filter((log) => {
        if (log.value === null) return false;
        if (startDate && log.date < startDate) return false;
        if (endDate && log.date > endDate) return false;
        return true;
      })
      .map((log) => ({
        date: log.date,
        value: log.value as number,
      }));

    res.json({
      success: true,
      data: {
        unit: habit.dataUnit,
        points: graphData,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { habits, habitLogs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { localTimeToUtc, utcTimeToLocal, getCurrentDateUtc } from '@habit-tracker/shared';
import {
  createHabitSchema,
  updateHabitSchema,
  completeHabitSchema,
  skipHabitSchema,
} from '../middleware/validators';
import { AppError } from '../middleware/error-handler';

const router = Router();

/**
 * GET /api/habits - List all habits
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const allHabits = await db.select().from(habits);

    const habitsWithLocalTime = allHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      deadlineUtc: habit.deadlineUtc,
      deadlineLocal: utcTimeToLocal(habit.deadlineUtc, habit.timezoneOffset),
      timezoneOffset: habit.timezoneOffset,
      blockedWebsites: JSON.parse(habit.blockedWebsites),
      createdAt: habit.createdAt,
      isActive: habit.isActive,
    }));

    res.json({ success: true, data: habitsWithLocalTime });
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

    const habitWithLocalTime = {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      deadlineUtc: habit.deadlineUtc,
      deadlineLocal: utcTimeToLocal(habit.deadlineUtc, habit.timezoneOffset),
      timezoneOffset: habit.timezoneOffset,
      blockedWebsites: JSON.parse(habit.blockedWebsites),
      createdAt: habit.createdAt,
      isActive: habit.isActive,
    };

    res.json({ success: true, data: habitWithLocalTime });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/habits - Create habit
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createHabitSchema.parse(req.body);

    const deadlineUtc = localTimeToUtc(validatedData.deadlineLocal, validatedData.timezoneOffset);

    const newHabit = {
      id: randomUUID(),
      name: validatedData.name,
      description: validatedData.description,
      deadlineUtc,
      timezoneOffset: validatedData.timezoneOffset,
      blockedWebsites: JSON.stringify(validatedData.blockedWebsites),
      isActive: true,
    };

    await db.insert(habits).values(newHabit);

    const habitWithLocalTime = {
      ...newHabit,
      deadlineLocal: validatedData.deadlineLocal,
      blockedWebsites: validatedData.blockedWebsites,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({ success: true, data: habitWithLocalTime });
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

    const updateData: Partial<typeof habits.$inferInsert> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.blockedWebsites !== undefined) {
      updateData.blockedWebsites = JSON.stringify(validatedData.blockedWebsites);
    }
    if (validatedData.deadlineLocal !== undefined && validatedData.timezoneOffset !== undefined) {
      updateData.deadlineUtc = localTimeToUtc(
        validatedData.deadlineLocal,
        validatedData.timezoneOffset
      );
      updateData.timezoneOffset = validatedData.timezoneOffset;
    }

    await db.update(habits).set(updateData).where(eq(habits.id, req.params.id));

    const [updatedHabit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    const habitWithLocalTime = {
      id: updatedHabit.id,
      name: updatedHabit.name,
      description: updatedHabit.description,
      deadlineUtc: updatedHabit.deadlineUtc,
      deadlineLocal: utcTimeToLocal(updatedHabit.deadlineUtc, updatedHabit.timezoneOffset),
      timezoneOffset: updatedHabit.timezoneOffset,
      blockedWebsites: JSON.parse(updatedHabit.blockedWebsites),
      createdAt: updatedHabit.createdAt,
      isActive: updatedHabit.isActive,
    };

    res.json({ success: true, data: habitWithLocalTime });
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
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/habits/:id/complete - Mark habit as complete
 */
router.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    const validatedData = completeHabitSchema.parse(req.body);
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

    const logs = await db.select().from(habitLogs).where(eq(habitLogs.habitId, req.params.id));

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

export default router;

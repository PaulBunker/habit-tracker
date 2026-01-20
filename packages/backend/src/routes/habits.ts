/**
 * Habit management REST API routes.
 *
 * Provides CRUD operations for habits plus completion/skip actions.
 * All responses follow the {@link ApiResponse} wrapper format.
 *
 * @packageDocumentation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { habits, habitLogs } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { localTimeToUtc, utcTimeToLocal, getCurrentDateUtc } from '@habit-tracker/shared';
import { notifyDaemon } from '@habit-tracker/shared/daemon-client';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

const router = Router();

// Validation schemas for v2
const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  deadlineLocal: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  timezoneOffset: z.number().int().min(-720).max(840).optional().default(0),
  dataTracking: z.boolean().optional().default(false),
  dataUnit: z.string().max(20).optional(),
  activeDays: z.array(z.number().int().min(0).max(6)).optional(),
});

const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
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

const updateLogSchema = z.object({
  dataValue: z.number().min(0),
});

// Helper to format habit for API response
function formatHabitResponse(habit: typeof habits.$inferSelect) {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
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
 * GET /api/habits
 *
 * Retrieves all active habits.
 *
 * @returns {ApiResponse<Habit[]>} Array of active habit objects
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "abc-123",
 *       "name": "Exercise",
 *       "deadlineUtc": "14:00",
 *       "deadlineLocal": "09:00",
 *       "timezoneOffset": -300,
 *       "dataTracking": false,
 *       "isActive": true,
 *       "createdAt": "2024-01-15T10:30:00Z"
 *     }
 *   ]
 * }
 * ```
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
 * GET /api/habits/:id
 *
 * Retrieves a single habit by its UUID.
 *
 * @param id - Habit UUID (path parameter)
 * @returns {ApiResponse<Habit>} The habit object
 * @throws {404} Habit not found
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "abc-123",
 *     "name": "Exercise",
 *     "description": "Morning workout",
 *     "deadlineUtc": "14:00",
 *     "deadlineLocal": "09:00",
 *     "timezoneOffset": -300,
 *     "dataTracking": true,
 *     "dataUnit": "minutes",
 *     "activeDays": [1, 2, 3, 4, 5],
 *     "isActive": true,
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   }
 * }
 * ```
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
 * POST /api/habits
 *
 * Creates a new habit. Only `name` is required for quick-add functionality.
 *
 * @body {CreateHabitRequest} Habit creation data
 * - `name` (required): Display name (1-100 chars)
 * - `description` (optional): Longer description (max 500 chars)
 * - `deadlineLocal` (optional): Deadline in HH:MM format (local time)
 * - `timezoneOffset` (optional): Offset in minutes from UTC (default: 0)
 * - `dataTracking` (optional): Enable numeric data entry (default: false)
 * - `dataUnit` (optional): Unit label for data tracking (max 20 chars)
 * - `activeDays` (optional): Days when active [0-6], 0=Sun
 *
 * @returns {ApiResponse<Habit>} The created habit (201 Created)
 * @throws {400} Validation error (invalid name, deadline format, etc.)
 *
 * @example Request - Quick add (minimal)
 * ```json
 * { "name": "Meditate" }
 * ```
 *
 * @example Request - Full creation
 * ```json
 * {
 *   "name": "Exercise",
 *   "description": "Morning workout",
 *   "deadlineLocal": "09:00",
 *   "timezoneOffset": -300,
 *   "dataTracking": true,
 *   "dataUnit": "minutes",
 *   "activeDays": [1, 2, 3, 4, 5]
 * }
 * ```
 *
 * @example Response (201 Created)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "abc-123",
 *     "name": "Exercise",
 *     "deadlineUtc": "14:00",
 *     "deadlineLocal": "09:00",
 *     "timezoneOffset": -300,
 *     "dataTracking": true,
 *     "dataUnit": "minutes",
 *     "activeDays": [1, 2, 3, 4, 5],
 *     "isActive": true,
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   }
 * }
 * ```
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createHabitSchema.parse(req.body);

    const newHabit: typeof habits.$inferSelect = {
      id: randomUUID(),
      name: validatedData.name,
      description: validatedData.description || null,
      deadlineUtc: validatedData.deadlineLocal
        ? localTimeToUtc(validatedData.deadlineLocal, validatedData.timezoneOffset)
        : null,
      timezoneOffset: validatedData.timezoneOffset,
      dataTracking: validatedData.dataTracking,
      dataUnit: validatedData.dataUnit || null,
      activeDays: validatedData.activeDays ? JSON.stringify(validatedData.activeDays) : null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.insert(habits).values(newHabit);

    res.status(201).json({ success: true, data: formatHabitResponse(newHabit) });

    // Fire-and-forget notification to daemon
    notifyDaemon().catch(() => {});
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/habits/:id
 *
 * Updates an existing habit. All fields are optional - only provided fields
 * are updated.
 *
 * @param id - Habit UUID (path parameter)
 * @body {UpdateHabitRequest} Fields to update
 * - `name` (optional): New display name
 * - `description` (optional): New description (null to clear)
 * - `deadlineLocal` (optional): New deadline in HH:MM (null to remove)
 * - `timezoneOffset` (optional): New timezone offset
 * - `dataTracking` (optional): Enable/disable data tracking
 * - `dataUnit` (optional): New unit label (null to clear)
 * - `activeDays` (optional): New active days (null for every day)
 * - `isActive` (optional): Set active/inactive
 *
 * @returns {ApiResponse<Habit>} The updated habit
 * @throws {404} Habit not found
 * @throws {400} Validation error
 *
 * @example Request
 * ```json
 * {
 *   "deadlineLocal": "10:00",
 *   "dataTracking": true,
 *   "dataUnit": "minutes"
 * }
 * ```
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "abc-123",
 *     "name": "Exercise",
 *     "deadlineUtc": "15:00",
 *     "deadlineLocal": "10:00",
 *     "dataTracking": true,
 *     "dataUnit": "minutes",
 *     "isActive": true
 *   }
 * }
 * ```
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
 * DELETE /api/habits/:id
 *
 * Permanently deletes a habit and all its completion logs.
 *
 * @param id - Habit UUID (path parameter)
 * @returns {ApiResponse<{message: string}>} Success confirmation
 * @throws {404} Habit not found
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "message": "Habit deleted successfully"
 * }
 * ```
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
 * POST /api/habits/:id/complete
 *
 * Marks a habit as completed for today. Creates or updates a HabitLog
 * with status 'completed'. If the habit has data tracking enabled,
 * `dataValue` is required.
 *
 * Completing an overdue habit may unblock websites (if all other overdue
 * habits are also resolved).
 *
 * @param id - Habit UUID (path parameter)
 * @body {CompleteHabitRequest} Completion data
 * - `notes` (optional): Notes about this completion (max 500 chars)
 * - `dataValue` (required if dataTracking): Numeric value to record
 *
 * @returns {ApiResponse<HabitLog>} The created/updated completion log
 * @throws {404} Habit not found
 * @throws {400} dataValue required for data-tracking habits
 *
 * @example Request - Simple completion
 * ```json
 * {}
 * ```
 *
 * @example Request - With data tracking
 * ```json
 * {
 *   "dataValue": 45,
 *   "notes": "Great workout!"
 * }
 * ```
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "log-456",
 *     "habitId": "abc-123",
 *     "date": "2024-01-15",
 *     "status": "completed",
 *     "completedAt": "2024-01-15T13:45:00Z",
 *     "dataValue": 45,
 *     "notes": "Great workout!"
 *   }
 * }
 * ```
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
 * POST /api/habits/:id/skip
 *
 * Skips a habit for today with a required reason. Creates or updates
 * a HabitLog with status 'skipped'. Skipping removes the habit from
 * blocking consideration for today.
 *
 * @param id - Habit UUID (path parameter)
 * @body {SkipHabitRequest} Skip data
 * - `skipReason` (required): Reason for skipping (1-200 chars)
 * - `notes` (optional): Additional notes (max 500 chars)
 *
 * @returns {ApiResponse<HabitLog>} The created/updated skip log
 * @throws {404} Habit not found
 * @throws {400} skipReason is required
 *
 * @example Request
 * ```json
 * {
 *   "skipReason": "Feeling sick today",
 *   "notes": "Will resume tomorrow"
 * }
 * ```
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "log-789",
 *     "habitId": "abc-123",
 *     "date": "2024-01-15",
 *     "status": "skipped",
 *     "skipReason": "Feeling sick today",
 *     "notes": "Will resume tomorrow"
 *   }
 * }
 * ```
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
 * PATCH /api/habits/:id/logs/date/:date
 *
 * Updates the data value for a specific habit log. Only works for
 * completed logs on habits with data tracking enabled.
 *
 * @param id - Habit UUID (path parameter)
 * @param date - Log date in YYYY-MM-DD format (path parameter)
 * @body {UpdateHabitLogRequest} Update data
 * - `dataValue` (required): New numeric value (>= 0)
 *
 * @returns {ApiResponse<HabitLog>} The updated log
 * @throws {404} Habit not found
 * @throws {404} No log found for this date
 * @throws {400} Habit does not have data tracking enabled
 * @throws {400} Invalid date format
 * @throws {400} Can only update data value for completed logs
 *
 * @example Request
 * ```json
 * { "dataValue": 50 }
 * ```
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "log-456",
 *     "habitId": "abc-123",
 *     "date": "2024-01-15",
 *     "status": "completed",
 *     "dataValue": 50
 *   }
 * }
 * ```
 */
router.patch('/:id/logs/date/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Verify habit exists
    const [habit] = await db.select().from(habits).where(eq(habits.id, req.params.id));

    if (!habit) {
      throw new AppError(404, 'Habit not found');
    }

    // 2. Verify habit.dataTracking === true
    if (!habit.dataTracking) {
      throw new AppError(400, 'This habit does not have data tracking enabled');
    }

    // 3. Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(req.params.date)) {
      throw new AppError(400, 'Invalid date format. Expected YYYY-MM-DD');
    }

    // 4. Find log by habitId + date
    const [existingLog] = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, req.params.id), eq(habitLogs.date, req.params.date)));

    if (!existingLog) {
      throw new AppError(404, 'No log found for this date');
    }

    // 5. Verify log.status === 'completed'
    if (existingLog.status !== 'completed') {
      throw new AppError(400, 'Can only update data value for completed logs');
    }

    // 6. Validate input with updateLogSchema
    const validatedData = updateLogSchema.parse(req.body);

    // 7. Update and return log
    await db
      .update(habitLogs)
      .set({ dataValue: validatedData.dataValue })
      .where(eq(habitLogs.id, existingLog.id));

    const [updatedLog] = await db.select().from(habitLogs).where(eq(habitLogs.id, existingLog.id));

    res.json({ success: true, data: updatedLog });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/habits/:id/logs
 *
 * Retrieves all completion logs for a habit, ordered by date (newest first).
 *
 * @param id - Habit UUID (path parameter)
 * @returns {ApiResponse<HabitLog[]>} Array of log entries
 * @throws {404} Habit not found
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "log-456",
 *       "habitId": "abc-123",
 *       "date": "2024-01-15",
 *       "status": "completed",
 *       "completedAt": "2024-01-15T13:45:00Z",
 *       "dataValue": 45
 *     },
 *     {
 *       "id": "log-123",
 *       "habitId": "abc-123",
 *       "date": "2024-01-14",
 *       "status": "skipped",
 *       "skipReason": "Rest day"
 *     }
 *   ]
 * }
 * ```
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
 * GET /api/habits/:id/calendar
 *
 * Retrieves calendar view data for a habit. Returns daily status entries
 * suitable for displaying in a monthly calendar.
 *
 * @param id - Habit UUID (path parameter)
 * @query start - Optional start date filter (YYYY-MM-DD)
 * @query end - Optional end date filter (YYYY-MM-DD)
 * @returns {ApiResponse<CalendarDay[]>} Array of calendar entries
 * @throws {404} Habit not found
 *
 * @example Request
 * ```
 * GET /api/habits/abc-123/calendar?start=2024-01-01&end=2024-01-31
 * ```
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     { "date": "2024-01-15", "status": "completed", "dataValue": 45 },
 *     { "date": "2024-01-14", "status": "skipped" },
 *     { "date": "2024-01-13", "status": "missed" }
 *   ]
 * }
 * ```
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

    const query = db
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
 * GET /api/habits/:id/graph
 *
 * Retrieves graph data for data-tracking habits. Returns numeric values
 * recorded for each completion, suitable for charting progress over time.
 *
 * @param id - Habit UUID (path parameter)
 * @query start - Optional start date filter (YYYY-MM-DD)
 * @query end - Optional end date filter (YYYY-MM-DD)
 * @returns {ApiResponse<{unit?: string, points: GraphDataPoint[]}>} Graph data with unit
 * @throws {404} Habit not found
 * @throws {400} Habit does not have data tracking enabled
 *
 * @example Request
 * ```
 * GET /api/habits/abc-123/graph?start=2024-01-01&end=2024-01-31
 * ```
 *
 * @example Response (200 OK)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "unit": "minutes",
 *     "points": [
 *       { "date": "2024-01-13", "value": 30 },
 *       { "date": "2024-01-14", "value": 45 },
 *       { "date": "2024-01-15", "value": 35 }
 *     ]
 *   }
 * }
 * ```
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

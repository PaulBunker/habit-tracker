import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { habits, habitLogs, settings } from './schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentTimeUtc, getCurrentDateUtc } from '@habit-tracker/shared';
import { randomUUID } from 'crypto';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../backend/data/habit-tracker.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

export interface HabitCheckResult {
  domainsToBlock: string[];
  incompleteTimedHabits: Array<{
    id: string;
    name: string;
  }>;
  missedHabits: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Get the current day of week in UTC (0 = Sunday, 6 = Saturday)
 */
function getCurrentDayOfWeek(): number {
  return new Date().getUTCDay();
}

/**
 * Check if a habit is active today based on activeDays
 */
function isHabitActiveToday(habit: typeof habits.$inferSelect): boolean {
  if (!habit.activeDays) {
    return true; // Active every day if not specified
  }
  const activeDays = JSON.parse(habit.activeDays) as number[];
  const today = getCurrentDayOfWeek();
  return activeDays.includes(today);
}

/**
 * Check if a habit is a "timed" habit (has start time or deadline)
 */
function isTimedHabit(habit: typeof habits.$inferSelect): boolean {
  return !!(habit.startTimeUtc || habit.deadlineUtc);
}

/**
 * Check if we're past a habit's start time (blocking should have begun)
 * If no start time but has deadline, blocking starts at midnight (00:00)
 */
function isPastStartTime(habit: typeof habits.$inferSelect, currentTime: string): boolean {
  if (habit.startTimeUtc) {
    return currentTime >= habit.startTimeUtc;
  }
  // If there's a deadline but no start time, blocking starts at 00:00
  if (habit.deadlineUtc) {
    return true; // Always past "start" if there's only a deadline
  }
  return false;
}

/**
 * Check if we're past midnight in a way that indicates a new day rollover
 * This is used to mark habits as missed
 */
function shouldMarkAsMissed(habit: typeof habits.$inferSelect, currentTime: string): boolean {
  // If the habit has a deadline and current time is past it, mark as missed
  if (habit.deadlineUtc) {
    return currentTime >= habit.deadlineUtc;
  }
  return false;
}

/**
 * Get blocked websites from global settings
 */
async function getBlockedWebsites(): Promise<string[]> {
  const [setting] = await db.select().from(settings).where(eq(settings.key, 'blockedWebsites'));
  if (setting) {
    return JSON.parse(setting.value) as string[];
  }
  return [];
}

/**
 * Check all habits and determine which domains should be blocked
 *
 * V2 Logic:
 * - Block websites when ANY timed habit's start time has passed
 * - Stay blocked until ALL timed habits are completed/skipped
 * - At deadline, mark habits as missed (they stay blocked until midnight)
 * - At midnight (new day), unblock and start fresh
 */
export async function checkHabits(): Promise<HabitCheckResult> {
  const currentTime = getCurrentTimeUtc();
  const currentDate = getCurrentDateUtc();

  // Get all active habits
  const activeHabits = await db.select().from(habits).where(eq(habits.isActive, true));

  const incompleteTimedHabits: HabitCheckResult['incompleteTimedHabits'] = [];
  const missedHabits: HabitCheckResult['missedHabits'] = [];
  let hasStartedTimedHabit = false;
  let allTimedHabitsComplete = true;

  for (const habit of activeHabits) {
    // Skip untimed habits (no blocking impact) and habits not active today
    if (!isTimedHabit(habit) || !isHabitActiveToday(habit)) {
      continue;
    }

    // Check if this habit's start time has passed
    const pastStartTime = isPastStartTime(habit, currentTime);
    if (pastStartTime) {
      hasStartedTimedHabit = true;
    }

    // Check if habit has been completed or skipped today
    const [todayLog] = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, currentDate)));

    const isComplete = todayLog && (todayLog.status === 'completed' || todayLog.status === 'skipped');

    if (!isComplete && pastStartTime) {
      allTimedHabitsComplete = false;
      incompleteTimedHabits.push({
        id: habit.id,
        name: habit.name,
      });

      // Check if we should mark as missed (past deadline)
      if (shouldMarkAsMissed(habit, currentTime) && !todayLog) {
        // Mark as missed
        await db.insert(habitLogs).values({
          id: randomUUID(),
          habitId: habit.id,
          date: currentDate,
          status: 'missed',
          createdAt: new Date().toISOString(),
        });

        missedHabits.push({
          id: habit.id,
          name: habit.name,
        });
      }
    }
  }

  // Determine if we should block
  // Block when: at least one timed habit has started AND not all timed habits are complete
  const shouldBlock = hasStartedTimedHabit && !allTimedHabitsComplete;

  // Get domains to block
  let domainsToBlock: string[] = [];
  if (shouldBlock) {
    domainsToBlock = await getBlockedWebsites();
  }

  return {
    domainsToBlock,
    incompleteTimedHabits,
    missedHabits,
  };
}

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { habits, habitLogs, settings } from './schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentTimeUtc, getCurrentDateUtc } from '@habit-tracker/shared';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';

/**
 * Expand ~ to user's home directory
 */
export function expandHome(filePath: string): string {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Resolve path relative to monorepo root (INIT_CWD) for relative paths
 */
export function resolveDbPath(rawPath: string): string {
  // Expand home directory
  const expanded = expandHome(rawPath);
  // If it's a relative path and INIT_CWD is set (npm workspace), resolve from monorepo root
  if (!path.isAbsolute(expanded) && process.env.INIT_CWD) {
    return path.resolve(process.env.INIT_CWD, expanded);
  }
  return path.resolve(expanded);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
// Production uses ~/.habit-tracker/data, development uses backend's data directory
const defaultDbPath =
  NODE_ENV === 'production' ? '~/.habit-tracker/data' : path.join(__dirname, '../../backend/data');
const rawDbPath = process.env.DB_PATH || defaultDbPath;
const dbDir = resolveDbPath(rawDbPath);
const dbPath = path.join(dbDir, 'habit-tracker.db');

console.log(`[DAEMON ${NODE_ENV.toUpperCase()}] Using database: ${dbPath}`);

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
export function isHabitActiveToday(habit: typeof habits.$inferSelect): boolean {
  if (!habit.activeDays) {
    return true; // Active every day if not specified
  }
  const activeDays = JSON.parse(habit.activeDays) as number[];
  const today = getCurrentDayOfWeek();
  return activeDays.includes(today);
}

/**
 * Check if a habit has a deadline (only habits with deadlines can block)
 */
export function hasDeadline(habit: typeof habits.$inferSelect): boolean {
  return !!habit.deadlineUtc;
}

/**
 * Check if a habit is overdue (past its deadline)
 */
export function isOverdue(habit: typeof habits.$inferSelect, currentTime: string): boolean {
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
 * Calculate milliseconds until the next habit deadline
 * Returns null if no upcoming deadlines today
 */
export async function getNextDeadlineMs(): Promise<number | null> {
  const now = new Date();
  const currentTimeUtc = getCurrentTimeUtc();

  // Get all active habits with deadlines
  const activeHabits = await db.select().from(habits).where(eq(habits.isActive, true));

  let soonestMs: number | null = null;

  for (const habit of activeHabits) {
    // Skip habits without deadlines or not active today
    if (!hasDeadline(habit) || !isHabitActiveToday(habit)) {
      continue;
    }

    const deadlineUtc = habit.deadlineUtc!;

    // Skip if deadline has already passed today
    if (currentTimeUtc >= deadlineUtc) {
      continue;
    }

    // Calculate ms until this deadline
    const [deadlineHours, deadlineMinutes] = deadlineUtc.split(':').map(Number);
    const deadlineDate = new Date(now);
    deadlineDate.setUTCHours(deadlineHours, deadlineMinutes, 0, 0);

    const msUntilDeadline = deadlineDate.getTime() - now.getTime();

    if (msUntilDeadline > 0 && (soonestMs === null || msUntilDeadline < soonestMs)) {
      soonestMs = msUntilDeadline;
    }
  }

  return soonestMs;
}

/**
 * Check all habits and determine which domains should be blocked
 *
 * Blocking Logic:
 * - Block websites when ANY habit with a deadline is overdue (past deadline)
 * - Stay blocked until ALL overdue habits are completed/skipped
 * - Habits without deadlines never trigger blocking
 * - At midnight (new day), unblock and start fresh
 */
export async function checkHabits(): Promise<HabitCheckResult> {
  const currentTime = getCurrentTimeUtc();
  const currentDate = getCurrentDateUtc();

  // Get all active habits
  const activeHabits = await db.select().from(habits).where(eq(habits.isActive, true));

  const incompleteTimedHabits: HabitCheckResult['incompleteTimedHabits'] = [];
  const missedHabits: HabitCheckResult['missedHabits'] = [];
  let hasOverdueHabit = false;

  for (const habit of activeHabits) {
    // Skip habits without deadlines (they never block) and habits not active today
    if (!hasDeadline(habit) || !isHabitActiveToday(habit)) {
      continue;
    }

    // Check if this habit is overdue
    const habitIsOverdue = isOverdue(habit, currentTime);
    if (!habitIsOverdue) {
      continue; // Not overdue yet, no blocking impact
    }

    // Check if habit has been completed or skipped today
    const [todayLog] = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, currentDate)));

    const isComplete = todayLog && (todayLog.status === 'completed' || todayLog.status === 'skipped');

    if (!isComplete) {
      hasOverdueHabit = true;
      incompleteTimedHabits.push({
        id: habit.id,
        name: habit.name,
      });

      // Mark as missed if no log exists yet
      if (!todayLog) {
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

  // Get domains to block if any habits are overdue and incomplete
  let domainsToBlock: string[] = [];
  if (hasOverdueHabit) {
    domainsToBlock = await getBlockedWebsites();
  }

  return {
    domainsToBlock,
    incompleteTimedHabits,
    missedHabits,
  };
}

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { habits, habitLogs } from './schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentTimeUtc, getCurrentDateUtc } from '@habit-tracker/shared';
import { randomUUID } from 'crypto';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), '../../data/habit-tracker.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

export interface HabitCheckResult {
  domainsToBlock: string[];
  overdueHabits: Array<{
    id: string;
    name: string;
    domains: string[];
  }>;
}

/**
 * Check all habits and determine which domains should be blocked
 */
export async function checkHabits(): Promise<HabitCheckResult> {
  const currentTime = getCurrentTimeUtc();
  const currentDate = getCurrentDateUtc();

  // Get all active habits
  const activeHabits = await db.select().from(habits).where(eq(habits.isActive, true));

  const domainsToBlock = new Set<string>();
  const overdueHabits: HabitCheckResult['overdueHabits'] = [];

  for (const habit of activeHabits) {
    // Check if habit is overdue (current time > deadline)
    if (currentTime > habit.deadlineUtc) {
      // Check if habit has been completed or skipped today
      const [todayLog] = await db
        .select()
        .from(habitLogs)
        .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, currentDate)));

      if (!todayLog) {
        // Habit is overdue and not completed/skipped - mark as missed and block domains
        await db.insert(habitLogs).values({
          id: randomUUID(),
          habitId: habit.id,
          date: currentDate,
          status: 'missed',
          createdAt: new Date().toISOString(),
        });

        const blockedDomains = JSON.parse(habit.blockedWebsites) as string[];
        blockedDomains.forEach((domain) => domainsToBlock.add(domain));

        overdueHabits.push({
          id: habit.id,
          name: habit.name,
          domains: blockedDomains,
        });
      } else if (todayLog.status === 'missed') {
        // Already marked as missed, continue blocking
        const blockedDomains = JSON.parse(habit.blockedWebsites) as string[];
        blockedDomains.forEach((domain) => domainsToBlock.add(domain));

        overdueHabits.push({
          id: habit.id,
          name: habit.name,
          domains: blockedDomains,
        });
      }
      // If status is 'completed' or 'skipped', don't block
    }
  }

  return {
    domainsToBlock: Array.from(domainsToBlock),
    overdueHabits,
  };
}

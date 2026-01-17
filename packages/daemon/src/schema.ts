import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Habits table - stores user habits with deadlines and blocked websites
 */
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  deadlineUtc: text('deadline_utc').notNull(),
  timezoneOffset: integer('timezone_offset').notNull(),
  blockedWebsites: text('blocked_websites').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

/**
 * Habit logs table - tracks completion, skips, and misses
 */
export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  status: text('status', { enum: ['completed', 'skipped', 'missed'] }).notNull(),
  completedAt: text('completed_at'),
  skipReason: text('skip_reason'),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

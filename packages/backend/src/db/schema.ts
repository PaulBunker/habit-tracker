import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Habits table - stores user habits with deadlines and blocked websites
 */
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  deadlineUtc: text('deadline_utc').notNull(), // HH:MM format in UTC
  timezoneOffset: integer('timezone_offset').notNull(), // minutes from UTC
  blockedWebsites: text('blocked_websites').notNull(), // JSON array of domains
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
  date: text('date').notNull(), // YYYY-MM-DD in UTC
  status: text('status', { enum: ['completed', 'skipped', 'missed'] }).notNull(),
  completedAt: text('completed_at'), // ISO timestamp in UTC
  skipReason: text('skip_reason'), // required when status is 'skipped'
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitLog = typeof habitLogs.$inferSelect;
export type NewHabitLog = typeof habitLogs.$inferInsert;

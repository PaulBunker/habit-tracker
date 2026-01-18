import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Habits table - stores user habits with optional timing and data tracking
 */
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  deadlineUtc: text('deadline_utc'), // HH:MM format in UTC - blocking starts when overdue
  timezoneOffset: integer('timezone_offset').notNull().default(0), // minutes from UTC
  dataTracking: integer('data_tracking', { mode: 'boolean' }).notNull().default(false),
  dataUnit: text('data_unit'), // e.g., "lbs", "minutes", "calories"
  activeDays: text('active_days'), // JSON array of days [0-6], null = every day
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

/**
 * Settings table - global app configuration (key-value store)
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON value
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Habit logs table - tracks completion, skips, misses, and data values
 */
export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD in UTC
  status: text('status', { enum: ['completed', 'skipped', 'missed'] }).notNull(),
  completedAt: text('completed_at'), // ISO timestamp in UTC
  dataValue: real('data_value'), // numeric value for data-tracking habits
  skipReason: text('skip_reason'), // required when status is 'skipped'
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

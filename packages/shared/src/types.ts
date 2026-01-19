/**
 * Shared types for the Habit Tracker application.
 *
 * This module contains all TypeScript interfaces used across the frontend,
 * backend, and daemon packages.
 *
 * @packageDocumentation
 */

/**
 * Status of a habit for a given day.
 *
 * - `completed` - User marked the habit as done
 * - `skipped` - User intentionally skipped (requires reason)
 * - `missed` - Deadline passed without completion (set by daemon)
 */
export type HabitStatus = 'completed' | 'skipped' | 'missed';

/**
 * Represents a daily habit with optional deadline-based website blocking.
 *
 * Habits can be simple checklist items (no deadline) or enforcement habits
 * (with deadline). When ANY habit with a deadline becomes overdue, ALL
 * configured websites are blocked. Blocking continues until ALL overdue
 * habits are completed or skipped.
 *
 * @example
 * ```typescript
 * const habit: Habit = {
 *   id: 'abc-123',
 *   name: 'Morning Exercise',
 *   description: '30 minutes of cardio',
 *   deadlineUtc: '14:00',
 *   deadlineLocal: '09:00',
 *   timezoneOffset: -300,
 *   dataTracking: true,
 *   dataUnit: 'minutes',
 *   activeDays: [1, 2, 3, 4, 5],
 *   createdAt: '2024-01-15T10:30:00Z',
 *   isActive: true
 * };
 * ```
 */
export interface Habit {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name shown in the checklist */
  name: string;
  /** Optional longer description of the habit */
  description?: string;
  /** Deadline time in HH:MM format (UTC). Blocking starts when current time exceeds this. */
  deadlineUtc?: string;
  /** Deadline time in HH:MM format (user's local timezone). Computed from deadlineUtc. */
  deadlineLocal?: string;
  /** User's timezone offset in minutes from UTC (e.g., -300 for EST) */
  timezoneOffset: number;
  /** When true, prompts for numeric data entry on completion */
  dataTracking: boolean;
  /** Unit label for data tracking (e.g., "lbs", "minutes", "calories") */
  dataUnit?: string;
  /** Days of week when habit is active. 0=Sun, 1=Mon, ..., 6=Sat. Undefined means every day. */
  activeDays?: number[];
  /** ISO 8601 timestamp when habit was created (UTC) */
  createdAt: string;
  /** Whether habit appears in daily checklist. Inactive habits are hidden but preserved. */
  isActive: boolean;
}

/**
 * Record of a habit's status for a specific day.
 *
 * Created when a user completes, skips, or misses a habit. Each habit
 * can have at most one log per day.
 *
 * @example
 * ```typescript
 * const log: HabitLog = {
 *   id: 'log-456',
 *   habitId: 'abc-123',
 *   date: '2024-01-15',
 *   status: 'completed',
 *   completedAt: '2024-01-15T13:45:00Z',
 *   dataValue: 35,
 *   notes: 'Ran 5K today!',
 *   createdAt: '2024-01-15T13:45:00Z'
 * };
 * ```
 */
export interface HabitLog {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Reference to the parent Habit */
  habitId: string;
  /** Date this log applies to in YYYY-MM-DD format (UTC) */
  date: string;
  /** Completion status for this day */
  status: HabitStatus;
  /** ISO 8601 timestamp when marked complete (UTC). Only set when status is 'completed'. */
  completedAt?: string;
  /** Numeric value recorded for data-tracking habits */
  dataValue?: number;
  /** Reason provided when skipping. Required when status is 'skipped'. */
  skipReason?: string;
  /** Optional user notes about this completion */
  notes?: string;
  /** ISO 8601 timestamp when log was created (UTC) */
  createdAt: string;
}

/**
 * Global application settings.
 *
 * @example
 * ```typescript
 * const settings: AppSettings = {
 *   blockedWebsites: ['reddit.com', 'twitter.com', 'youtube.com'],
 *   timezone: 'America/New_York'
 * };
 * ```
 */
export interface AppSettings {
  /** List of domains to block when any habit is overdue */
  blockedWebsites: string[];
  /** User's timezone identifier (IANA format, e.g., "America/New_York") */
  timezone?: string;
}

/**
 * Request body for creating a new habit.
 *
 * Only `name` is required for quick-add functionality.
 * Other fields can be configured later via UpdateHabitRequest.
 *
 * @example
 * ```typescript
 * // Quick add - minimal
 * const quickAdd: CreateHabitRequest = { name: 'Meditate' };
 *
 * // Full creation
 * const full: CreateHabitRequest = {
 *   name: 'Exercise',
 *   description: 'Morning workout',
 *   deadlineLocal: '09:00',
 *   timezoneOffset: -300,
 *   dataTracking: true,
 *   dataUnit: 'minutes',
 *   activeDays: [1, 2, 3, 4, 5]
 * };
 * ```
 */
export interface CreateHabitRequest {
  /** Display name for the habit (required) */
  name: string;
  /** Optional description */
  description?: string;
  /** Deadline in HH:MM format (user's local time). Blocking starts when overdue. */
  deadlineLocal?: string;
  /** Timezone offset in minutes from UTC. Defaults to 0. */
  timezoneOffset?: number;
  /** Enable numeric data entry on completion */
  dataTracking?: boolean;
  /** Unit label for data tracking */
  dataUnit?: string;
  /** Days of week when active. 0=Sun through 6=Sat. */
  activeDays?: number[];
}

/**
 * Request body for updating an existing habit.
 *
 * All fields are optional - only provided fields are updated.
 */
export interface UpdateHabitRequest {
  /** New display name */
  name?: string;
  /** New description */
  description?: string;
  /** New deadline in HH:MM format (local time). Blocking starts when overdue. */
  deadlineLocal?: string;
  /** New timezone offset in minutes from UTC */
  timezoneOffset?: number;
  /** Enable/disable data tracking */
  dataTracking?: boolean;
  /** New unit label for data tracking */
  dataUnit?: string;
  /** New active days. 0=Sun through 6=Sat. */
  activeDays?: number[];
  /** Set habit active/inactive */
  isActive?: boolean;
}

/**
 * Request body for marking a habit as completed.
 *
 * @example
 * ```typescript
 * // Simple completion
 * const simple: CompleteHabitRequest = {};
 *
 * // With data tracking
 * const withData: CompleteHabitRequest = {
 *   dataValue: 45,
 *   notes: 'Great workout!'
 * };
 * ```
 */
export interface CompleteHabitRequest {
  /** Optional notes about this completion */
  notes?: string;
  /** Numeric value to record. Required if habit has dataTracking enabled. */
  dataValue?: number;
}

/**
 * Request body for skipping a habit.
 *
 * @example
 * ```typescript
 * const skip: SkipHabitRequest = {
 *   skipReason: 'Feeling sick today',
 *   notes: 'Will resume tomorrow'
 * };
 * ```
 */
export interface SkipHabitRequest {
  /** Reason for skipping (required) */
  skipReason: string;
  /** Optional additional notes */
  notes?: string;
}

/**
 * Request body for updating a habit log's data value.
 */
export interface UpdateHabitLogRequest {
  /** New numeric value to record */
  dataValue: number;
}

/**
 * Current status of the blocking daemon.
 *
 * @example
 * ```typescript
 * const status: DaemonStatus = {
 *   isRunning: true,
 *   lastCheck: '2024-01-15T14:30:00Z',
 *   blockedDomains: ['reddit.com', 'twitter.com'],
 *   activeHabits: ['habit-123', 'habit-456']
 * };
 * ```
 */
export interface DaemonStatus {
  /** Whether the daemon process is running */
  isRunning: boolean;
  /** ISO 8601 timestamp of last habit check */
  lastCheck?: string;
  /** Domains currently being blocked in /etc/hosts */
  blockedDomains: string[];
  /** IDs of habits currently triggering blocking (overdue) */
  activeHabits: string[];
}

/**
 * Standard API response wrapper.
 *
 * @typeParam T - Type of the data payload on success
 *
 * @example
 * ```typescript
 * // Success response
 * const success: ApiResponse<Habit> = {
 *   success: true,
 *   data: { id: '123', name: 'Exercise', ... }
 * };
 *
 * // Error response
 * const error: ApiResponse<Habit> = {
 *   success: false,
 *   error: 'Habit not found'
 * };
 * ```
 */
export interface ApiResponse<T> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response payload on success */
  data?: T;
  /** Error message on failure */
  error?: string;
}

/**
 * Single day entry for calendar view.
 *
 * Used to display habit completion history in a monthly calendar format.
 */
export interface CalendarDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Completion status for this day, if any */
  status?: HabitStatus;
  /** Recorded data value for data-tracking habits */
  dataValue?: number;
}

/**
 * Data point for graph visualization.
 *
 * Used to chart data-tracking habit values over time.
 */
export interface GraphDataPoint {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Recorded numeric value */
  value: number;
}

/**
 * Shared types for the Habit Tracker application.
 * @packageDocumentation
 */

/**
 * Status of a habit for a given day.
 * - `completed` - User marked the habit as done
 * - `skipped` - User intentionally skipped (requires reason)
 * - `missed` - Deadline passed without completion (set by daemon)
 */
export type HabitStatus = 'completed' | 'skipped' | 'missed';

/**
 * Represents a daily habit with optional deadline-based website blocking.
 *
 * **Blocking logic**: When ANY habit with a deadline becomes overdue, ALL
 * configured websites are blocked. Blocking continues until ALL overdue
 * habits are completed or skipped. Habits without deadlines never trigger blocking.
 */
export interface Habit {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name shown in the checklist */
  name: string;
  /** Optional longer description */
  description?: string;
  /** Deadline in HH:MM format (UTC). Blocking starts when current time exceeds this. */
  deadlineUtc?: string;
  /** Deadline in HH:MM format (user's local timezone). Computed from deadlineUtc. */
  deadlineLocal?: string;
  /** Timezone offset in minutes from UTC (e.g., -300 for EST) */
  timezoneOffset: number;
  /** When true, prompts for numeric data entry on completion */
  dataTracking: boolean;
  /** Unit label for data tracking (e.g., "minutes", "pages") */
  dataUnit?: string;
  /** Days of week when active. 0=Sun, 6=Sat. Undefined = every day. */
  activeDays?: number[];
  /** ISO 8601 timestamp when created (UTC) */
  createdAt: string;
  /** Whether habit appears in daily checklist */
  isActive: boolean;
}

/** Record of a habit's status for a specific day. One log per habit per day. */
export interface HabitLog {
  id: string;
  habitId: string;
  /** Date in YYYY-MM-DD format (UTC) */
  date: string;
  status: HabitStatus;
  /** Set when status is 'completed' */
  completedAt?: string;
  /** Numeric value for data-tracking habits */
  dataValue?: number;
  /** Required when status is 'skipped' */
  skipReason?: string;
  notes?: string;
  createdAt: string;
}

/** Global application settings. */
export interface AppSettings {
  /** Domains to block when any habit is overdue */
  blockedWebsites: string[];
  /** IANA timezone identifier (e.g., "America/New_York") */
  timezone?: string;
}

/** Request body for creating a new habit. Only `name` is required. */
export interface CreateHabitRequest {
  name: string;
  description?: string;
  /** Deadline in HH:MM format (local time) */
  deadlineLocal?: string;
  timezoneOffset?: number;
  dataTracking?: boolean;
  dataUnit?: string;
  /** Days of week when active. 0=Sun, 6=Sat. */
  activeDays?: number[];
}

/** Request body for updating a habit. All fields optional - only provided fields are updated. */
export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  deadlineLocal?: string;
  timezoneOffset?: number;
  dataTracking?: boolean;
  dataUnit?: string;
  activeDays?: number[];
  isActive?: boolean;
}

/** Request body for marking a habit as completed. */
export interface CompleteHabitRequest {
  notes?: string;
  /** Required if habit has dataTracking enabled */
  dataValue?: number;
}

/** Request body for skipping a habit. */
export interface SkipHabitRequest {
  /** Required reason for skipping */
  skipReason: string;
  notes?: string;
}

/** Request body for updating a habit log's data value. */
export interface UpdateHabitLogRequest {
  dataValue: number;
}

/** Current status of the blocking daemon. */
export interface DaemonStatus {
  isRunning: boolean;
  lastCheck?: string;
  /** Domains currently blocked in /etc/hosts */
  blockedDomains: string[];
  /** Habit IDs currently triggering blocking (overdue) */
  activeHabits: string[];
}

/** Standard API response wrapper. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Single day entry for calendar view. */
export interface CalendarDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  status?: HabitStatus;
  dataValue?: number;
}

/** Data point for graph visualization. */
export interface GraphDataPoint {
  date: string;
  value: number;
}

/**
 * Shared types for the Habit Tracker application v2
 */

export type HabitStatus = 'completed' | 'skipped' | 'missed';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  startTimeUtc?: string; // HH:MM format in UTC - when blocking starts
  startTimeLocal?: string; // HH:MM format in user's local timezone (computed)
  deadlineUtc?: string; // HH:MM format in UTC - when habit should be done
  deadlineLocal?: string; // HH:MM format in user's local timezone (computed)
  timezoneOffset: number; // minutes from UTC
  dataTracking: boolean; // enable numeric input on completion
  dataUnit?: string; // e.g., "lbs", "minutes", "calories"
  activeDays?: number[]; // 0=Sun, 1=Mon, ... 6=Sat, null = every day
  createdAt: string; // ISO timestamp in UTC
  isActive: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD in UTC
  status: HabitStatus;
  completedAt?: string; // ISO timestamp in UTC
  dataValue?: number; // numeric value for data-tracking habits
  skipReason?: string; // required when status is 'skipped'
  notes?: string;
  createdAt: string; // ISO timestamp in UTC
}

export interface AppSettings {
  blockedWebsites: string[];
  timezone?: string;
}

export interface CreateHabitRequest {
  name: string; // Only required field for quick add
  description?: string;
  startTimeLocal?: string; // HH:MM in user's local time
  deadlineLocal?: string; // HH:MM in user's local time
  timezoneOffset?: number; // minutes from UTC, defaults to 0
  dataTracking?: boolean;
  dataUnit?: string;
  activeDays?: number[];
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  startTimeLocal?: string; // When blocking starts
  deadlineLocal?: string; // When habit should be done
  timezoneOffset?: number;
  dataTracking?: boolean;
  dataUnit?: string;
  activeDays?: number[];
  isActive?: boolean;
}

export interface CompleteHabitRequest {
  notes?: string;
  dataValue?: number; // Required if habit.dataTracking = true
}

export interface SkipHabitRequest {
  skipReason: string; // required
  notes?: string;
}

export interface DaemonStatus {
  isRunning: boolean;
  lastCheck?: string; // ISO timestamp
  blockedDomains: string[]; // currently blocked domains
  activeHabits: string[]; // habit IDs currently triggering blocking
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  status?: HabitStatus;
  dataValue?: number;
}

export interface GraphDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

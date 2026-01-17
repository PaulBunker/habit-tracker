/**
 * Shared types for the Habit Tracker application
 */

export type HabitStatus = 'completed' | 'skipped' | 'missed';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  deadlineUtc: string; // HH:MM format in UTC
  deadlineLocal: string; // HH:MM format in user's local timezone (computed)
  timezoneOffset: number; // minutes from UTC
  blockedWebsites: string[]; // array of domains to block
  createdAt: string; // ISO timestamp in UTC
  isActive: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD in UTC
  status: HabitStatus;
  completedAt?: string; // ISO timestamp in UTC
  skipReason?: string; // required when status is 'skipped'
  notes?: string;
  createdAt: string; // ISO timestamp in UTC
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  deadlineLocal: string; // HH:MM in user's local time
  timezoneOffset: number; // minutes from UTC
  blockedWebsites: string[];
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  deadlineLocal?: string;
  timezoneOffset?: number;
  blockedWebsites?: string[];
  isActive?: boolean;
}

export interface CompleteHabitRequest {
  notes?: string;
}

export interface SkipHabitRequest {
  skipReason: string; // required
  notes?: string;
}

export interface DaemonStatus {
  isRunning: boolean;
  lastCheck?: string; // ISO timestamp
  blockedDomains: string[]; // currently blocked domains
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

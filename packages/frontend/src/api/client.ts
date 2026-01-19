/**
 * Frontend API client for the Habit Tracker backend.
 *
 * This module provides typed HTTP clients for all backend endpoints,
 * organized by domain: habits, settings, and status/daemon control.
 *
 * All methods return `ApiResponse<T>` which includes a `success` boolean
 * and either `data` (on success) or `error` (on failure).
 *
 * @packageDocumentation
 */

import type {
  Habit,
  HabitLog,
  CreateHabitRequest,
  UpdateHabitRequest,
  CompleteHabitRequest,
  SkipHabitRequest,
  DaemonStatus,
  ApiResponse,
  AppSettings,
  CalendarDay,
  GraphDataPoint,
} from '@habit-tracker/shared';

const API_BASE_URL = '/api';

/**
 * Internal helper to make API requests with consistent headers and error handling.
 *
 * @typeParam T - Expected type of the response data
 * @param endpoint - API endpoint path (e.g., '/habits')
 * @param options - Optional fetch configuration (method, body, headers)
 * @returns Promise resolving to the API response wrapper
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  return data;
}

/**
 * API client for habit-related operations.
 *
 * Provides CRUD operations for habits, completion/skip actions,
 * and data retrieval for calendar and graph views.
 *
 * @example
 * ```typescript
 * // List all habits
 * const response = await habitsApi.getAll();
 * if (response.success) {
 *   console.log(response.data);
 * }
 *
 * // Create a new habit
 * const result = await habitsApi.create({ name: 'Exercise' });
 * ```
 */
export const habitsApi = {
  /**
   * Fetches all habits.
   *
   * @returns Promise with array of all habits (active and inactive)
   */
  async getAll(): Promise<ApiResponse<Habit[]>> {
    return fetchApi<Habit[]>('/habits');
  },

  /**
   * Fetches a single habit by ID.
   *
   * @param id - The habit's UUID
   * @returns Promise with the habit or error if not found
   */
  async getById(id: string): Promise<ApiResponse<Habit>> {
    return fetchApi<Habit>(`/habits/${id}`);
  },

  /**
   * Creates a new habit.
   *
   * @param data - Habit creation data (name required, other fields optional)
   * @returns Promise with the created habit
   */
  async create(data: CreateHabitRequest): Promise<ApiResponse<Habit>> {
    return fetchApi<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing habit.
   *
   * @param id - The habit's UUID
   * @param data - Fields to update (all optional)
   * @returns Promise with the updated habit
   */
  async update(id: string, data: UpdateHabitRequest): Promise<ApiResponse<Habit>> {
    return fetchApi<Habit>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a habit and all its logs.
   *
   * @param id - The habit's UUID
   * @returns Promise indicating success or failure
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/habits/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Marks a habit as completed for today.
   *
   * Creates a HabitLog with status 'completed'. If the habit has
   * data tracking enabled, include dataValue in the request.
   *
   * @param id - The habit's UUID
   * @param data - Optional notes and data value
   * @returns Promise with the created HabitLog
   */
  async complete(id: string, data: CompleteHabitRequest): Promise<ApiResponse<HabitLog>> {
    return fetchApi<HabitLog>(`/habits/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Skips a habit for today with a reason.
   *
   * Creates a HabitLog with status 'skipped'. Skipping removes
   * the habit from blocking consideration for today.
   *
   * @param id - The habit's UUID
   * @param data - Skip reason (required) and optional notes
   * @returns Promise with the created HabitLog
   */
  async skip(id: string, data: SkipHabitRequest): Promise<ApiResponse<HabitLog>> {
    return fetchApi<HabitLog>(`/habits/${id}/skip`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Fetches all completion logs for a habit.
   *
   * @param id - The habit's UUID
   * @returns Promise with array of HabitLogs ordered by date
   */
  async getLogs(id: string): Promise<ApiResponse<HabitLog[]>> {
    return fetchApi<HabitLog[]>(`/habits/${id}/logs`);
  },

  /**
   * Fetches calendar view data for a habit.
   *
   * Returns daily status entries for displaying in a calendar.
   * Each day shows whether the habit was completed, skipped, or missed.
   *
   * @param id - The habit's UUID
   * @param start - Optional start date (YYYY-MM-DD) for filtering
   * @param end - Optional end date (YYYY-MM-DD) for filtering
   * @returns Promise with array of CalendarDay entries
   */
  async getCalendar(id: string, start?: string, end?: string): Promise<ApiResponse<CalendarDay[]>> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<CalendarDay[]>(`/habits/${id}/calendar${query}`);
  },

  /**
   * Fetches graph data for a data-tracking habit.
   *
   * Returns numeric values recorded for each completion, suitable
   * for charting progress over time.
   *
   * @param id - The habit's UUID
   * @param start - Optional start date (YYYY-MM-DD) for filtering
   * @param end - Optional end date (YYYY-MM-DD) for filtering
   * @returns Promise with data unit and array of GraphDataPoints
   */
  async getGraph(id: string, start?: string, end?: string): Promise<ApiResponse<{ unit?: string; points: GraphDataPoint[] }>> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ unit?: string; points: GraphDataPoint[] }>(`/habits/${id}/graph${query}`);
  },

  /**
   * Updates the data value for a specific habit log.
   *
   * Use this to correct a previously recorded data value without
   * creating a new log entry.
   *
   * @param habitId - The habit's UUID
   * @param date - The log date in YYYY-MM-DD format
   * @param dataValue - The new numeric value to record
   * @returns Promise with the updated HabitLog
   */
  async updateLogDataValue(habitId: string, date: string, dataValue: number): Promise<ApiResponse<HabitLog>> {
    return fetchApi<HabitLog>(`/habits/${habitId}/logs/date/${date}`, {
      method: 'PATCH',
      body: JSON.stringify({ dataValue }),
    });
  },
};

/**
 * API client for application settings.
 *
 * Manages global settings including the list of websites to block
 * when habits are overdue.
 *
 * @example
 * ```typescript
 * // Get current settings
 * const response = await settingsApi.get();
 *
 * // Add a website to block
 * await settingsApi.addBlockedWebsite('reddit.com');
 * ```
 */
export const settingsApi = {
  /**
   * Fetches current application settings.
   *
   * @returns Promise with AppSettings (blockedWebsites array, timezone)
   */
  async get(): Promise<ApiResponse<AppSettings>> {
    return fetchApi<AppSettings>('/settings');
  },

  /**
   * Updates application settings.
   *
   * @param data - Partial settings to update
   * @returns Promise with the updated AppSettings
   */
  async update(data: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
    return fetchApi<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Adds a website to the blocked list.
   *
   * When ANY habit with a deadline becomes overdue, ALL websites in the
   * blocked list are blocked simultaneously (via /etc/hosts). Blocking
   * continues until ALL overdue habits are completed or skipped.
   *
   * @param website - Domain to block (e.g., 'reddit.com')
   * @returns Promise with the updated blockedWebsites array
   */
  async addBlockedWebsite(website: string): Promise<ApiResponse<{ blockedWebsites: string[] }>> {
    return fetchApi<{ blockedWebsites: string[] }>('/settings/blocked-websites', {
      method: 'POST',
      body: JSON.stringify({ website }),
    });
  },

  /**
   * Removes a website from the blocked list.
   *
   * @param website - Domain to unblock (e.g., 'reddit.com')
   * @returns Promise with the updated blockedWebsites array
   */
  async removeBlockedWebsite(website: string): Promise<ApiResponse<{ blockedWebsites: string[] }>> {
    return fetchApi<{ blockedWebsites: string[] }>('/settings/blocked-websites', {
      method: 'DELETE',
      body: JSON.stringify({ website }),
    });
  },
};

/**
 * API client for daemon status and control.
 *
 * Provides methods to check daemon health, trigger synchronization,
 * and perform emergency resets.
 *
 * @example
 * ```typescript
 * // Check if daemon is running
 * const status = await statusApi.getStatus();
 * if (status.data?.isRunning) {
 *   console.log('Daemon healthy');
 * }
 *
 * // Emergency unblock all websites
 * await statusApi.resetHosts();
 * ```
 */
export const statusApi = {
  /**
   * Fetches current daemon status.
   *
   * @returns Promise with DaemonStatus (isRunning, blockedDomains, etc.)
   */
  async getStatus(): Promise<ApiResponse<DaemonStatus>> {
    return fetchApi<DaemonStatus>('/status');
  },

  /**
   * Triggers the daemon to sync its blocking state.
   *
   * Use this to force an immediate re-evaluation of which habits
   * are overdue and update /etc/hosts accordingly.
   *
   * @returns Promise indicating success or failure
   */
  async triggerSync(): Promise<ApiResponse<void>> {
    return fetchApi<void>('/daemon/sync', {
      method: 'POST',
    });
  },

  /**
   * Emergency reset: unblocks all websites immediately.
   *
   * Removes all habit-tracker entries from /etc/hosts. Use this
   * when the user needs immediate access to blocked websites.
   *
   * **Warning**: Websites remain unblocked until the next daemon
   * check cycle or until triggerSync() is called.
   *
   * @returns Promise with success message
   */
  async resetHosts(): Promise<ApiResponse<{ message: string }>> {
    return fetchApi<{ message: string }>('/daemon/reset', {
      method: 'POST',
    });
  },
};

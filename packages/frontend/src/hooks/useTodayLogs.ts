/**
 * React hook for fetching today's habit logs.
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback } from 'react';
import type { HabitLog } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

/**
 * Hook for fetching today's completion logs for multiple habits.
 *
 * Fetches logs in parallel for all provided habit IDs and returns a map
 * of habit ID to today's log (if one exists). Automatically refetches
 * when the habit IDs change.
 *
 * @param habitIds - Array of habit UUIDs to fetch logs for
 * @returns Object containing logs map, loading state, error message, and refresh function
 *
 * @example
 * ```tsx
 * function DailyView() {
 *   const { habits } = useHabits();
 *   const habitIds = habits.map(h => h.id);
 *   const { logs, loading, error, refresh } = useTodayLogs(habitIds);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return habits.map(habit => (
 *     <ChecklistItem
 *       key={habit.id}
 *       habit={habit}
 *       todayLog={logs[habit.id]}
 *       onUpdate={refresh}
 *       onOpenSettings={(h) => console.log('Settings for:', h.name)}
 *     />
 *   ));
 * }
 * ```
 */
export function useTodayLogs(habitIds: string[]) {
  const [logs, setLogs] = useState<Record<string, HabitLog | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (habitIds.length === 0) {
      setLogs({});
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const logsMap: Record<string, HabitLog | undefined> = {};

      // Fetch logs for each habit in parallel
      await Promise.all(
        habitIds.map(async (habitId) => {
          const response = await habitsApi.getLogs(habitId);
          if (response.success && response.data) {
            // Find today's log
            const todayLog = response.data.find((log) => log.date === today);
            logsMap[habitId] = todayLog;
          }
        })
      );

      setLogs(logsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch today\'s logs');
    } finally {
      setLoading(false);
    }
  }, [habitIds.join(',')]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const refresh = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refresh };
}

import { useState, useEffect, useCallback } from 'react';
import type { HabitLog } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

export function useTodayLogs(habitIds: string[]) {
  const [logs, setLogs] = useState<Record<string, HabitLog | undefined>>({});
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (habitIds.length === 0) {
      setLogs({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
    } catch {
      // Error handling
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

  return { logs, loading, refresh };
}

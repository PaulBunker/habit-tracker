/**
 * React hooks for habit data management.
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback } from 'react';
import type { Habit } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

/**
 * Hook for fetching and managing the habits list.
 *
 * Provides habits data, loading state, error handling, and a refresh function.
 * Automatically fetches habits on mount.
 *
 * @returns Object containing habits array, loading state, error message, and refresh function
 *
 * @example
 * ```tsx
 * function HabitsList() {
 *   const { habits, loading, error, refresh } = useHabits();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <>
 *       <button onClick={refresh}>Refresh</button>
 *       {habits.map(h => <HabitItem key={h.id} habit={h} />)}
 *     </>
 *   );
 * }
 * ```
 */
export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await habitsApi.getAll();
      if (response.success && response.data) {
        setHabits(response.data);
      } else {
        setError(response.error || 'Failed to fetch habits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const refresh = useCallback(() => {
    fetchHabits();
  }, [fetchHabits]);

  return { habits, loading, error, refresh };
}

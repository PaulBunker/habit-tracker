/**
 * Daily checklist component displaying habits grouped by status.
 *
 * @packageDocumentation
 */

import type { Habit, HabitLog } from '@habit-tracker/shared';
import { HabitItem } from './HabitItem';

/**
 * Props for the DailyChecklist component.
 */
interface DailyChecklistProps {
  /** Array of all habits to display */
  habits: Habit[];
  /** Map of habit ID to today's log entry */
  todayLogs: Record<string, HabitLog | undefined>;
  /** Callback when any habit status changes */
  onUpdate: () => void;
  /** Callback when changes are saved (habit created/updated/deleted) */
  onSave: () => void;
  /** ID of the currently selected/expanded habit */
  selectedHabitId: string | null;
  /** Callback to select/expand a habit */
  onSelectHabit: (habitId: string | null) => void;
  /** Callback to close the modal */
  onCloseHabit: () => void;
}

/**
 * Renders the daily habit checklist with habits grouped by completion status.
 *
 * Filters habits to only show those active on the current day of the week,
 * then splits them into "To Do" (pending/missed) and "Done" (completed/skipped)
 * sections. Shows empty states when no habits exist or none are scheduled.
 */
export function DailyChecklist({
  habits,
  todayLogs,
  onUpdate,
  onSave,
  selectedHabitId,
  onSelectHabit,
  onCloseHabit,
}: DailyChecklistProps): JSX.Element | null {
  // Check if habit is active today based on activeDays
  const isActiveToday = (habit: Habit): boolean => {
    if (!habit.activeDays || habit.activeDays.length === 0) {
      return true; // Active every day
    }
    const today = new Date().getDay(); // 0 = Sunday
    return habit.activeDays.includes(today);
  };

  // Filter to only habits active today
  const activeHabits = habits.filter(isActiveToday);

  // Separate completed and pending habits
  const pendingHabits = activeHabits.filter((habit) => {
    const log = todayLogs[habit.id];
    return !log || log.status === 'missed';
  });

  const completedHabits = activeHabits.filter((habit) => {
    const log = todayLogs[habit.id];
    return log && (log.status === 'completed' || log.status === 'skipped');
  });

  // Find the expanded habit (if any)
  const expandedHabit = selectedHabitId
    ? habits.find((h) => h.id === selectedHabitId)
    : null;

  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <p>No habits yet. Add your first habit above!</p>
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return (
      <div className="empty-state">
        <p>No habits scheduled for today.</p>
      </div>
    );
  }

  return (
    <div className="daily-checklist">
      {pendingHabits.length > 0 && (
        <div className="checklist-section">
          <h3 className="checklist-section-title">To Do</h3>
          <div className="checklist-items">
            {pendingHabits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                todayLog={todayLogs[habit.id]}
                isExpanded={habit.id === selectedHabitId}
                onExpand={() => onSelectHabit(habit.id)}
                onCollapse={onCloseHabit}
                onUpdate={onUpdate}
                onSave={() => {
                  onSelectHabit(null);
                  onSave();
                }}
              />
            ))}
          </div>
        </div>
      )}

      {completedHabits.length > 0 && (
        <div className="checklist-section">
          <h3 className="checklist-section-title">Done</h3>
          <div className="checklist-items">
            {completedHabits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                todayLog={todayLogs[habit.id]}
                isExpanded={habit.id === selectedHabitId}
                onExpand={() => onSelectHabit(habit.id)}
                onCollapse={onCloseHabit}
                onUpdate={onUpdate}
                onSave={() => {
                  onSelectHabit(null);
                  onSave();
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Render expanded habit modal if selected habit is not in active habits */}
      {expandedHabit && !activeHabits.find((h) => h.id === expandedHabit.id) && (
        <HabitItem
          habit={expandedHabit}
          todayLog={todayLogs[expandedHabit.id]}
          isExpanded={true}
          onExpand={() => {}}
          onCollapse={onCloseHabit}
          onUpdate={onUpdate}
          onSave={() => {
            onSelectHabit(null);
            onSave();
          }}
        />
      )}
    </div>
  );
}

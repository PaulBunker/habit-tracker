import type { Habit, HabitLog } from '@habit-tracker/shared';
import { ChecklistItem } from './ChecklistItem';

interface DailyChecklistProps {
  habits: Habit[];
  todayLogs: Record<string, HabitLog | undefined>;
  onUpdate: () => void;
  onOpenSettings: (habit: Habit) => void;
}

export function DailyChecklist({ habits, todayLogs, onUpdate, onOpenSettings }: DailyChecklistProps) {
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
              <ChecklistItem
                key={habit.id}
                habit={habit}
                todayLog={todayLogs[habit.id]}
                onUpdate={onUpdate}
                onOpenSettings={onOpenSettings}
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
              <ChecklistItem
                key={habit.id}
                habit={habit}
                todayLog={todayLogs[habit.id]}
                onUpdate={onUpdate}
                onOpenSettings={onOpenSettings}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

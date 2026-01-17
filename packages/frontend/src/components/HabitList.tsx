import type { Habit } from '@habit-tracker/shared';
import { HabitCard } from './HabitCard';

interface HabitListProps {
  habits: Habit[];
  onUpdate: () => void;
}

export function HabitList({ habits, onUpdate }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <p>No habits yet. Create your first habit to get started!</p>
      </div>
    );
  }

  return (
    <div className="habit-list">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

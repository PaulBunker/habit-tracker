import type { Habit } from '@habit-tracker/shared';

interface DashboardStatsProps {
  habits: Habit[];
}

export function DashboardStats({ habits }: DashboardStatsProps) {
  const activeHabits = habits.filter((h) => h.isActive);
  const totalBlockedSites = new Set(habits.flatMap((h) => h.blockedWebsites)).size;

  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <div className="stat-value">{activeHabits.length}</div>
        <div className="stat-label">Active Habits</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{habits.length}</div>
        <div className="stat-label">Total Habits</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{totalBlockedSites}</div>
        <div className="stat-label">Blocked Sites</div>
      </div>
    </div>
  );
}

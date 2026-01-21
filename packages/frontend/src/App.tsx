import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { Flipper } from 'react-flip-toolkit';
import type { Habit } from '@habit-tracker/shared';
import { QuickAddHabit } from './components/QuickAddHabit';
import { DailyChecklist } from './components/DailyChecklist';
import { HabitSettingsPanel } from './components/HabitSettingsPanel';
import { EmergencyResetButton } from './components/EmergencyResetButton';
import { GlobalSettings } from './pages/GlobalSettings';
import { Playground } from './pages/Playground';
import { useHabits } from './hooks/useHabits';
import { useTodayLogs } from './hooks/useTodayLogs';
import './App.css';

function HomePage() {
  const { habits, loading, error, refresh: refreshHabits } = useHabits();
  const { logs: todayLogs, refresh: refreshLogs } = useTodayLogs(habits.map((h) => h.id));
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Derive selected habit from ID
  const selectedHabit = useMemo(() => {
    if (!selectedHabitId) return null;
    return habits.find((h) => h.id === selectedHabitId) || null;
  }, [selectedHabitId, habits]);

  const handleUpdate = useCallback(() => {
    refreshHabits();
    refreshLogs();
  }, [refreshHabits, refreshLogs]);

  const handleOpenSettings = (habit: Habit) => {
    setSelectedHabitId(habit.id);
  };

  const handleCloseSettings = () => {
    setSelectedHabitId(null);
  };

  const handleSettingsSaved = () => {
    setSelectedHabitId(null);
    handleUpdate();
  };

  // Calculate today's date for display
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Calculate progress
  const activeHabits = habits.filter((habit) => {
    if (!habit.activeDays || habit.activeDays.length === 0) return true;
    return habit.activeDays.includes(today.getDay());
  });
  const completedCount = activeHabits.filter((habit) => {
    const log = todayLogs[habit.id];
    return log && (log.status === 'completed' || log.status === 'skipped');
  }).length;
  const totalCount = activeHabits.length;

  return (
    <Flipper
      flipKey={selectedHabitId || 'closed'}
      decisionData={{ selectedHabitId }}
      spring={{ stiffness: 300, damping: 30 }}
      staggerConfig={{
        default: {
          speed: 0.3,
        },
      }}
    >
      <div className="app">
        <header className="app-header">
          <h1>Daily Habits</h1>
          <p className="date">{dateString}</p>
          {totalCount > 0 && (
            <div className="progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {completedCount} of {totalCount} complete
              </span>
            </div>
          )}
        </header>

        <main className="app-main">
          <QuickAddHabit onSuccess={handleUpdate} />

          {loading && <div className="loading">Loading habits...</div>}
          {error && <div className="error">Error: {error}</div>}
          {!loading && !error && (
            <DailyChecklist
              habits={habits}
              todayLogs={todayLogs}
              onUpdate={handleUpdate}
              onOpenSettings={handleOpenSettings}
              selectedHabitId={selectedHabitId}
            />
          )}
        </main>

        <footer className="app-footer">
          <EmergencyResetButton />
          <Link to="/settings" className="settings-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M16.5 10C16.5 10.34 16.47 10.67 16.43 11L18.19 12.38C18.35 12.51 18.4 12.73 18.29 12.92L16.59 15.58C16.48 15.77 16.27 15.84 16.07 15.77L13.98 14.95C13.48 15.31 12.93 15.61 12.33 15.82L12.02 18.04C11.99 18.25 11.81 18.4 11.59 18.4H8.19C7.97 18.4 7.79 18.25 7.76 18.04L7.45 15.82C6.85 15.61 6.3 15.31 5.8 14.95L3.71 15.77C3.51 15.84 3.3 15.77 3.19 15.58L1.49 12.92C1.38 12.73 1.43 12.51 1.59 12.38L3.35 11C3.31 10.67 3.28 10.34 3.28 10C3.28 9.66 3.31 9.33 3.35 9L1.59 7.62C1.43 7.49 1.38 7.27 1.49 7.08L3.19 4.42C3.3 4.23 3.51 4.16 3.71 4.23L5.8 5.05C6.3 4.69 6.85 4.39 7.45 4.18L7.76 1.96C7.79 1.75 7.97 1.6 8.19 1.6H11.59C11.81 1.6 11.99 1.75 12.02 1.96L12.33 4.18C12.93 4.39 13.48 4.69 13.98 5.05L16.07 4.23C16.27 4.16 16.48 4.23 16.59 4.42L18.29 7.08C18.4 7.27 18.35 7.49 18.19 7.62L16.43 9C16.47 9.33 16.5 9.66 16.5 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Global Settings
          </Link>
        </footer>

        {selectedHabit && (
          <HabitSettingsPanel
            habit={selectedHabit}
            onClose={handleCloseSettings}
            onSave={handleSettingsSaved}
          />
        )}
      </div>
    </Flipper>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<GlobalSettings />} />
        <Route path="/playground" element={<Playground />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

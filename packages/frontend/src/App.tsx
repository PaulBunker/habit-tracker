import { useState } from 'react';
import { HabitList } from './components/HabitList';
import { HabitForm } from './components/HabitForm';
import { DashboardStats } from './components/DashboardStats';
import { useHabits } from './hooks/useHabits';
import './App.css';

function App() {
  const { habits, loading, error, refresh } = useHabits();
  const [showForm, setShowForm] = useState(false);

  const handleHabitCreated = () => {
    setShowForm(false);
    refresh();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Habit Tracker</h1>
        <p className="subtitle">Stay accountable with website blocking</p>
      </header>

      <main className="app-main">
        <DashboardStats habits={habits} />

        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create New Habit'}
          </button>
        </div>

        {showForm && (
          <div className="form-container">
            <HabitForm onSuccess={handleHabitCreated} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {loading && <div className="loading">Loading habits...</div>}
        {error && <div className="error">Error: {error}</div>}
        {!loading && !error && <HabitList habits={habits} onUpdate={refresh} />}
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';
import type { Habit } from '@habit-tracker/shared';
import { CheckInModal } from './CheckInModal';
import { habitsApi } from '../api/client';

interface HabitCardProps {
  habit: Habit;
  onUpdate: () => void;
}

export function HabitCard({ habit, onUpdate }: HabitCardProps) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      await habitsApi.delete(habit.id);
      onUpdate();
    } catch (error) {
      alert('Failed to delete habit');
    } finally {
      setDeleting(false);
    }
  };

  const handleCheckInSuccess = () => {
    setShowCheckIn(false);
    onUpdate();
  };

  return (
    <div className="habit-card">
      <div className="habit-header">
        <h3>{habit.name}</h3>
        <span className="deadline">Deadline: {habit.deadlineLocal}</span>
      </div>

      {habit.description && <p className="description">{habit.description}</p>}

      <div className="blocked-websites">
        <strong>Blocked websites:</strong>{' '}
        {habit.blockedWebsites.length > 0 ? (
          <span>{habit.blockedWebsites.join(', ')}</span>
        ) : (
          <span className="muted">None</span>
        )}
      </div>

      <div className="habit-actions">
        <button className="btn btn-success" onClick={() => setShowCheckIn(true)}>
          Check In
        </button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {showCheckIn && (
        <CheckInModal habit={habit} onClose={() => setShowCheckIn(false)} onSuccess={handleCheckInSuccess} />
      )}
    </div>
  );
}

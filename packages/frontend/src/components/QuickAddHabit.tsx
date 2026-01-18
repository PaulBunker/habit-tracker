import { useState } from 'react';
import { getTimezoneOffset } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

interface QuickAddHabitProps {
  onSuccess: () => void;
}

export function QuickAddHabit({ onSuccess }: QuickAddHabitProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await habitsApi.create({
        name: trimmedName,
        timezoneOffset: getTimezoneOffset(),
      });

      if (response.success) {
        setName('');
        onSuccess();
      } else {
        setError(response.error || 'Failed to create habit');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="quick-add" onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add a new habit..."
        disabled={submitting}
        maxLength={100}
        autoFocus
      />
      <button type="submit" disabled={submitting || !name.trim()}>
        {submitting ? '...' : '+'}
      </button>
      {error && <span className="quick-add-error">{error}</span>}
    </form>
  );
}

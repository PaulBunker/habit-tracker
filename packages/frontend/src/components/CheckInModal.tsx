import { useState } from 'react';
import type { Habit } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

interface CheckInModalProps {
  habit: Habit;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckInModal({ habit, onClose, onSuccess }: CheckInModalProps) {
  const [mode, setMode] = useState<'complete' | 'skip'>('complete');
  const [notes, setNotes] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'skip' && !skipReason.trim()) {
      setError('Skip reason is required');
      return;
    }

    try {
      setSubmitting(true);

      if (mode === 'complete') {
        const response = await habitsApi.complete(habit.id, {
          notes: notes.trim() || undefined,
        });

        if (!response.success) {
          setError(response.error || 'Failed to complete habit');
          return;
        }
      } else {
        const response = await habitsApi.skip(habit.id, {
          skipReason: skipReason.trim(),
          notes: notes.trim() || undefined,
        });

        if (!response.success) {
          setError(response.error || 'Failed to skip habit');
          return;
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Check In: {habit.name}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="mode-selector">
            <button
              type="button"
              className={`mode-btn ${mode === 'complete' ? 'active' : ''}`}
              onClick={() => setMode('complete')}
            >
              Complete
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'skip' ? 'active' : ''}`}
              onClick={() => setMode('skip')}
            >
              Skip
            </button>
          </div>

          {mode === 'skip' && (
            <div className="form-group">
              <label htmlFor="skipReason">Skip Reason *</label>
              <input
                type="text"
                id="skipReason"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Why are you skipping this habit?"
                maxLength={500}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'complete' ? 'Mark Complete' : 'Mark Skipped'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

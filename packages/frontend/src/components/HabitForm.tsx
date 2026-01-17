import { useState } from 'react';
import { getTimezoneOffset, isValidDomain } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

interface HabitFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function HabitForm({ onSuccess, onCancel }: HabitFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineLocal, setDeadlineLocal] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddWebsite = () => {
    const website = websiteInput.trim().toLowerCase();

    if (!website) {
      return;
    }

    if (!isValidDomain(website)) {
      setError('Invalid domain format');
      return;
    }

    if (blockedWebsites.includes(website)) {
      setError('Website already added');
      return;
    }

    setBlockedWebsites([...blockedWebsites, website]);
    setWebsiteInput('');
    setError('');
  };

  const handleRemoveWebsite = (website: string) => {
    setBlockedWebsites(blockedWebsites.filter((w) => w !== website));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    if (!deadlineLocal) {
      setError('Deadline is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await habitsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        deadlineLocal,
        timezoneOffset: getTimezoneOffset(),
        blockedWebsites,
      });

      if (response.success) {
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
    <form className="habit-form" onSubmit={handleSubmit}>
      <h2>Create New Habit</h2>

      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Habit Name *</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning Exercise"
          maxLength={100}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="deadline">Daily Deadline (Local Time) *</label>
        <input
          type="time"
          id="deadline"
          value={deadlineLocal}
          onChange={(e) => setDeadlineLocal(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="website">Blocked Websites</label>
        <div className="website-input">
          <input
            type="text"
            id="website"
            value={websiteInput}
            onChange={(e) => setWebsiteInput(e.target.value)}
            placeholder="e.g., reddit.com"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddWebsite();
              }
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={handleAddWebsite}>
            Add
          </button>
        </div>

        {blockedWebsites.length > 0 && (
          <div className="website-list">
            {blockedWebsites.map((website) => (
              <div key={website} className="website-tag">
                {website}
                <button type="button" onClick={() => handleRemoveWebsite(website)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Habit'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

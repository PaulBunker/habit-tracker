import { useState } from 'react';
import type { Habit } from '@habit-tracker/shared';
import { getTimezoneOffset } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';
import { CalendarView } from './CalendarView';
import { GraphView } from './GraphView';

interface HabitSettingsPanelProps {
  habit: Habit;
  onClose: () => void;
  onSave: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitSettingsPanel({ habit, onClose, onSave }: HabitSettingsPanelProps) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [startTimeLocal, setStartTimeLocal] = useState(habit.startTimeLocal || '');
  const [deadlineLocal, setDeadlineLocal] = useState(habit.deadlineLocal || '');
  const [dataTracking, setDataTracking] = useState(habit.dataTracking);
  const [dataUnit, setDataUnit] = useState(habit.dataUnit || '');
  const [activeDays, setActiveDays] = useState<number[]>(habit.activeDays || []);
  const [allDays, setAllDays] = useState(!habit.activeDays || habit.activeDays.length === 0);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const toggleDay = (day: number) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day].sort());
    }
    setAllDays(false);
  };

  const handleAllDaysChange = (checked: boolean) => {
    setAllDays(checked);
    if (checked) {
      setActiveDays([]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await habitsApi.update(habit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        startTimeLocal: startTimeLocal || undefined,
        deadlineLocal: deadlineLocal || undefined,
        timezoneOffset: getTimezoneOffset(),
        dataTracking,
        dataUnit: dataTracking ? dataUnit || undefined : undefined,
        activeDays: allDays ? undefined : (activeDays.length > 0 ? activeDays : undefined),
      });

      if (response.success) {
        onSave();
      } else {
        setError(response.error || 'Failed to save habit');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      await habitsApi.delete(habit.id);
      onSave();
    } catch {
      setError('Failed to delete habit');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Habit Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="view-buttons">
          <button className="btn btn-secondary" onClick={() => setShowCalendar(true)}>
            View Calendar
          </button>
          {habit.dataTracking && (
            <button className="btn btn-secondary" onClick={() => setShowGraph(true)}>
              View Graph
            </button>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="settings-form">
          <div className="form-group">
            <label htmlFor="settings-name">Name</label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="settings-description">Description</label>
            <textarea
              id="settings-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="settings-start">Start Time</label>
              <input
                id="settings-start"
                type="time"
                value={startTimeLocal}
                onChange={(e) => setStartTimeLocal(e.target.value)}
              />
              <small>When blocking starts</small>
            </div>

            <div className="form-group">
              <label htmlFor="settings-deadline">Deadline</label>
              <input
                id="settings-deadline"
                type="time"
                value={deadlineLocal}
                onChange={(e) => setDeadlineLocal(e.target.value)}
              />
              <small>When habit should be done</small>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={dataTracking}
                onChange={(e) => setDataTracking(e.target.checked)}
              />
              <span>Track data</span>
            </label>
            {dataTracking && (
              <input
                type="text"
                value={dataUnit}
                onChange={(e) => setDataUnit(e.target.value)}
                placeholder="Unit (e.g., lbs, minutes)"
                maxLength={20}
                className="unit-input"
              />
            )}
          </div>

          <div className="form-group">
            <label>Active Days</label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allDays}
                onChange={(e) => handleAllDaysChange(e.target.checked)}
              />
              <span>Every day</span>
            </label>
            {!allDays && (
              <div className="days-selector">
                {DAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    className={`day-btn ${activeDays.includes(index) ? 'active' : ''}`}
                    onClick={() => toggleDay(index)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Habit'}
          </button>
          <div className="settings-actions-right">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {showCalendar && (
        <CalendarView habit={habit} onClose={() => setShowCalendar(false)} />
      )}

      {showGraph && habit.dataTracking && (
        <GraphView habit={habit} onClose={() => setShowGraph(false)} />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Flipped, spring } from 'react-flip-toolkit';
import type { Habit } from '@habit-tracker/shared';
import { getTimezoneOffset } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';
import { CalendarView } from './CalendarView';
import { GraphView } from './GraphView';

const onOverlayAppear = (el: HTMLElement): void => {
  el.style.opacity = '0';
  spring({
    config: { stiffness: 200, damping: 25 },
    values: { opacity: [0, 1] },
    onUpdate: (val) => {
      el.style.opacity = String((val as { opacity: number }).opacity);
    },
  });
};


const onContentAppear = (el: HTMLElement, index: number): void => {
  el.style.opacity = '0';
  setTimeout(() => {
    spring({
      config: { stiffness: 300, damping: 20 },
      values: { opacity: [0, 1] },
      onUpdate: (val) => {
        el.style.opacity = String((val as { opacity: number }).opacity);
      },
    });
  }, index * 80);
};

const onContentExit = (el: HTMLElement, index: number, removeElement: () => void): void => {
  setTimeout(() => {
    spring({
      config: { stiffness: 300, damping: 20 },
      values: { opacity: [1, 0] },
      onUpdate: (val) => {
        el.style.opacity = String((val as { opacity: number }).opacity);
      },
      onComplete: removeElement,
    });
  }, index * 50);
};


interface HabitSettingsPanelProps {
  habit: Habit;
  onClose: () => void;
  onSave: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitSettingsPanel({ habit, onClose, onSave }: HabitSettingsPanelProps) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
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
    <Flipped flipId="settings-overlay" onAppear={onOverlayAppear}>
      <div className="modal-overlay" onClick={onClose}>
        <Flipped flipId={`habit-${habit.id}`}>
          <div className="modal settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{habit.name}</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <Flipped inverseFlipId={`habit-${habit.id}`} scale>
              <div className="modal-content">
                <Flipped flipId={`settings-view-btns-${habit.id}`} stagger onAppear={onContentAppear} onExit={onContentExit}>
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
                </Flipped>

                {error && <div className="error">{error}</div>}

                <div className="settings-form">
                  <Flipped flipId={`settings-name-${habit.id}`} stagger onAppear={onContentAppear} onExit={onContentExit}>
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
                  </Flipped>

                  <Flipped flipId={`settings-desc-${habit.id}`} stagger onAppear={onContentAppear} onExit={onContentExit}>
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
                  </Flipped>

                  <Flipped flipId={`settings-deadline-${habit.id}`} stagger onAppear={onContentAppear} onExit={onContentExit}>
                    <div className="form-group">
                      <label htmlFor="settings-deadline">Deadline</label>
                      <input
                        id="settings-deadline"
                        type="time"
                        value={deadlineLocal}
                        onChange={(e) => setDeadlineLocal(e.target.value)}
                      />
                      <small>Blocking starts when overdue</small>
                    </div>
                  </Flipped>

                  <Flipped flipId={`settings-tracking-${habit.id}`} stagger onAppear={onContentAppear} onExit={onContentExit}>
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
                  </Flipped>

                  <Flipped flipId={`settings-days-${habit.id}`} stagger onAppear={onContentAppear} onExit={onContentExit}>
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
                  </Flipped>
                </div>

                <Flipped flipId={`settings-actions-${habit.id}`} stagger onAppear={onContentAppear} onExit={onContentExit}>
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
                </Flipped>
              </div>
            </Flipped>
          </div>
        </Flipped>

        {showCalendar && (
          <CalendarView habit={habit} onClose={() => setShowCalendar(false)} />
        )}

        {showGraph && habit.dataTracking && (
          <GraphView habit={habit} onClose={() => setShowGraph(false)} />
        )}
      </div>
    </Flipped>
  );
}

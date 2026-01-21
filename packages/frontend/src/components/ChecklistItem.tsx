/**
 * Individual habit item component for the daily checklist.
 *
 * @packageDocumentation
 */

import { useState } from 'react';
import { Flipped } from 'react-flip-toolkit';
import type { Habit, HabitLog } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

/**
 * Props for the ChecklistItem component.
 */
interface ChecklistItemProps {
  /** The habit to display */
  habit: Habit;
  /** Today's log entry for this habit (if one exists) */
  todayLog?: HabitLog;
  /** Callback when the habit status changes (completed/skipped) */
  onUpdate: () => void;
  /** Callback to open the settings panel for this habit */
  onOpenSettings: (habit: Habit) => void;
  /** Whether this item is currently selected (for FLIP animation) */
  isSelected?: boolean;
  /** Flip ID for inverse scale (passed from parent Flipped wrapper) */
  flipId?: string;
}

/**
 * Renders a single habit item in the daily checklist.
 *
 * Displays the habit name, deadline, completion status, and data value (if applicable).
 * Handles checkbox interaction for completing habits, including showing a data input
 * modal for habits with data tracking enabled.
 *
 * @param props - Component props
 * @returns The rendered checklist item
 *
 * @example
 * ```tsx
 * <ChecklistItem
 *   habit={habit}
 *   todayLog={logs[habit.id]}
 *   onUpdate={() => refetchLogs()}
 *   onOpenSettings={(h) => setSelectedHabit(h)}
 * />
 * ```
 */
export function ChecklistItem({ habit, todayLog, onUpdate, onOpenSettings, isSelected, flipId }: ChecklistItemProps) {
  const [dataValue, setDataValue] = useState('');
  const [showDataInput, setShowDataInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isCompleted = todayLog?.status === 'completed';
  const isSkipped = todayLog?.status === 'skipped';
  const isMissed = todayLog?.status === 'missed';
  const isDone = isCompleted || isSkipped;

  const handleCheckboxChange = async () => {
    if (isDone) {
      return; // Already done today
    }

    // If data tracking is enabled, show the input instead
    if (habit.dataTracking) {
      setShowDataInput(true);
      return;
    }

    // Otherwise complete immediately
    await completeHabit();
  };

  const completeHabit = async (value?: number) => {
    try {
      setSubmitting(true);
      const response = await habitsApi.complete(habit.id, {
        dataValue: value,
      });

      if (response.success) {
        setShowDataInput(false);
        setDataValue('');
        onUpdate();
      }
    } catch {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };

  const handleDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(dataValue);
    if (isNaN(value)) {
      return;
    }
    await completeHabit(value);
  };

  const getTimeDisplay = () => {
    if (habit.deadlineLocal) {
      return `by ${habit.deadlineLocal}`;
    }
    return '';
  };

  const getStatusClass = () => {
    if (isCompleted) return 'checklist-item--completed';
    if (isSkipped) return 'checklist-item--skipped';
    if (isMissed) return 'checklist-item--missed';
    return '';
  };

  const handleItemClick = (e: React.MouseEvent) => {
    // Don't open settings if clicking on checkbox
    if ((e.target as HTMLElement).closest('.checklist-checkbox')) {
      return;
    }
    onOpenSettings(habit);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenSettings(habit);
    }
  };

  // When selected, render a ghost placeholder to maintain layout
  if (isSelected) {
    return <div className={`checklist-item checklist-item--ghost ${getStatusClass()}`} />;
  }

  return (
    <div
      className={`checklist-item ${getStatusClass()}`}
      onClick={handleItemClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${habit.name}`}
    >
      {flipId ? (
        <Flipped inverseFlipId={flipId} scale>
          <div className="checklist-item__inner">
            <label
              className="checklist-checkbox"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={handleCheckboxChange}
                disabled={isDone || submitting}
              />
              <span className="checkmark" />
            </label>

            <div className="checklist-content">
              <span className={`checklist-name ${isDone ? 'done' : ''}`}>
                {habit.name}
              </span>
              {habit.dataTracking && habit.dataUnit && (
                <span className="checklist-unit">({habit.dataUnit})</span>
              )}
              {getTimeDisplay() && (
                <span className="checklist-time">{getTimeDisplay()}</span>
              )}
              {todayLog?.dataValue !== undefined && (
                <span className="checklist-value">{todayLog.dataValue} {habit.dataUnit}</span>
              )}
              {isMissed && <span className="checklist-status">missed</span>}
              {isSkipped && <span className="checklist-status">skipped</span>}
            </div>
          </div>
        </Flipped>
      ) : (
        <>
          <label
            className="checklist-checkbox"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isDone}
              onChange={handleCheckboxChange}
              disabled={isDone || submitting}
            />
            <span className="checkmark" />
          </label>

          <div className="checklist-content">
            <span className={`checklist-name ${isDone ? 'done' : ''}`}>
              {habit.name}
            </span>
            {habit.dataTracking && habit.dataUnit && (
              <span className="checklist-unit">({habit.dataUnit})</span>
            )}
            {getTimeDisplay() && (
              <span className="checklist-time">{getTimeDisplay()}</span>
            )}
            {todayLog?.dataValue !== undefined && (
              <span className="checklist-value">{todayLog.dataValue} {habit.dataUnit}</span>
            )}
            {isMissed && <span className="checklist-status">missed</span>}
            {isSkipped && <span className="checklist-status">skipped</span>}
          </div>
        </>
      )}

      {showDataInput && (
        <div className="data-input-overlay" onClick={() => setShowDataInput(false)}>
          <form className="data-input-form" onClick={(e) => e.stopPropagation()} onSubmit={handleDataSubmit}>
            <label>
              Enter {habit.dataUnit || 'value'}:
            </label>
            <input
              type="number"
              step="any"
              value={dataValue}
              onChange={(e) => setDataValue(e.target.value)}
              placeholder={`Enter ${habit.dataUnit || 'value'}`}
              autoFocus
            />
            <div className="data-input-actions">
              <button type="submit" disabled={submitting || !dataValue}>
                {submitting ? '...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowDataInput(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

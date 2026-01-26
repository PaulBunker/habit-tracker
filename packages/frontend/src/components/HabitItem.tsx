/**
 * Unified habit item component that handles both card and modal views.
 *
 * Uses GSAP Flip plugin for smooth card-to-modal morphing animations.
 *
 * @packageDocumentation
 */

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/dist/Flip';
import { useGSAP } from '@gsap/react';
import type { Habit, HabitLog } from '@habit-tracker/shared';
import { getTimezoneOffset } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';
import { CalendarView } from './CalendarView';
import { GraphView } from './GraphView';

/** Props for the HabitItem component */
interface HabitItemProps {
  /** The habit to display */
  habit: Habit;
  /** Today's log entry for this habit (if one exists) */
  todayLog?: HabitLog;
  /** Whether this item is expanded (showing modal view) */
  isExpanded: boolean;
  /** Callback to expand this item (open modal) */
  onExpand: () => void;
  /** Callback to collapse this item (close modal) */
  onCollapse: () => void;
  /** Callback when the habit status changes (completed/skipped) */
  onUpdate: () => void;
  /** Callback when changes are saved successfully */
  onSave: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Renders a habit item that switches between card and modal views.
 *
 * In card view: displays habit name, deadline, completion status
 * In modal view: displays full settings form
 */
export function HabitItem({
  habit,
  todayLog,
  isExpanded,
  onExpand,
  onCollapse,
  onUpdate,
  onSave,
}: HabitItemProps): JSX.Element {
  // Animation refs
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const titleRectRef = useRef<DOMRect | null>(null);  // Store card title's absolute position
  const isAnimatingRef = useRef(false);

  // Get contextSafe for event handlers
  const { contextSafe } = useGSAP();

  // Form state (only used when expanded)
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [deadlineLocal, setDeadlineLocal] = useState(habit.deadlineLocal || '');
  const [isDataTracking, setIsDataTracking] = useState(habit.dataTracking);
  const [dataUnit, setDataUnit] = useState(habit.dataUnit || '');
  const [activeDays, setActiveDays] = useState<number[]>(habit.activeDays || []);
  const [isAllDays, setIsAllDays] = useState(!habit.activeDays || habit.activeDays.length === 0);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [shouldShowCalendar, setShouldShowCalendar] = useState(false);
  const [shouldShowGraph, setShouldShowGraph] = useState(false);

  // Card-specific state (data input overlay)
  const [dataValue, setDataValue] = useState('');
  const [shouldShowDataInput, setShouldShowDataInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived status
  const isCompleted = todayLog?.status === 'completed';
  const isSkipped = todayLog?.status === 'skipped';
  const isMissed = todayLog?.status === 'missed';
  const isDone = isCompleted || isSkipped;

  // Reset form state when habit prop changes
  useEffect(() => {
    setName(habit.name);
    setDescription(habit.description || '');
    setDeadlineLocal(habit.deadlineLocal || '');
    setIsDataTracking(habit.dataTracking);
    setDataUnit(habit.dataUnit || '');
    setActiveDays(habit.activeDays || []);
    setIsAllDays(!habit.activeDays || habit.activeDays.length === 0);
    setError('');
  }, [habit]);

  // Handle FLIP animation for OPENING only (closing is handled in handleModalClose)
  useLayoutEffect(() => {
    // Only handle opening animations
    if (!isExpanded || !flipStateRef.current || isAnimatingRef.current) return;

    const state = flipStateRef.current;
    const titleRect = titleRectRef.current;
    flipStateRef.current = null;
    titleRectRef.current = null;
    isAnimatingRef.current = true;

    const modal = modalRef.current;
    if (!modal) {
      isAnimatingRef.current = false;
      return;
    }

    // Hide modal content initially
    const content = modal.querySelectorAll('.view-buttons, .settings-form, .settings-actions');
    gsap.set(content, { opacity: 0, y: 10 });

    // Get the modal title element
    const titleEl = modal.querySelector('[data-flip-id^="title-"]') as HTMLElement;

    // Animate title INDEPENDENTLY from container using captured absolute position
    if (titleEl && titleRect) {
      const modalTitleRect = titleEl.getBoundingClientRect();

      // Calculate the offset from card title position to modal title position
      const deltaX = titleRect.left - modalTitleRect.left;
      const deltaY = titleRect.top - modalTitleRect.top;
      const scaleX = titleRect.width / modalTitleRect.width;
      const scaleY = titleRect.height / modalTitleRect.height;

      console.log('[FLIP Title] Opening');
      console.log('[FLIP Title] Card rect:', { left: titleRect.left, top: titleRect.top, width: titleRect.width, height: titleRect.height });
      console.log('[FLIP Title] Modal rect:', { left: modalTitleRect.left, top: modalTitleRect.top, width: modalTitleRect.width, height: modalTitleRect.height });
      console.log('[FLIP Title] Delta:', { deltaX, deltaY, scaleX, scaleY });

      // Animate title from card position to modal position
      gsap.fromTo(
        titleEl,
        {
          x: deltaX,
          y: deltaY,
          scaleX: scaleX,
          scaleY: scaleY,
          transformOrigin: 'top left',
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.4,
          ease: 'power2.out',
        }
      );
    }

    // Animate container with FLIP
    Flip.from(state, {
      duration: 0.4,
      ease: 'power2.out',
      absolute: true,
      scale: true,
      targets: modal,
      onComplete: () => {
        isAnimatingRef.current = false;
        // Stagger in remaining modal content after morph completes
        if (modalRef.current) {
          gsap.to(modalRef.current.querySelectorAll('.view-buttons, .settings-form, .settings-actions'), {
            opacity: 1,
            y: 0,
            stagger: 0.05,
            duration: 0.2,
            ease: 'power2.out',
          });
        }
      },
    });
  }, [isExpanded]);

  // Day toggle for active days
  const toggleDay = (day: number): void => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day].sort());
    }
    setIsAllDays(false);
  };

  const handleAllDaysChange = (checked: boolean): void => {
    setIsAllDays(checked);
    if (checked) {
      setActiveDays([]);
    }
  };

  // Save habit settings
  const handleSave = async (): Promise<void> => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const response = await habitsApi.update(habit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        deadlineLocal: deadlineLocal || undefined,
        timezoneOffset: getTimezoneOffset(),
        dataTracking: isDataTracking,
        dataUnit: isDataTracking ? dataUnit || undefined : undefined,
        activeDays: isAllDays ? undefined : (activeDays.length > 0 ? activeDays : undefined),
      });

      if (response.success) {
        onSave();
      } else {
        setError(response.error || 'Failed to save habit');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete habit
  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await habitsApi.delete(habit.id);
      onSave();
    } catch {
      setError('Failed to delete habit');
    } finally {
      setIsDeleting(false);
    }
  };

  // Checkbox handling for card view
  const handleCheckboxChange = async (): Promise<void> => {
    if (isDone) {
      return;
    }

    if (habit.dataTracking) {
      setShouldShowDataInput(true);
      return;
    }

    await completeHabit();
  };

  const completeHabit = async (value?: number): Promise<void> => {
    try {
      setIsSubmitting(true);
      const response = await habitsApi.complete(habit.id, {
        dataValue: value,
      });

      if (response.success) {
        setShouldShowDataInput(false);
        setDataValue('');
        onUpdate();
      }
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDataSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const value = parseFloat(dataValue);
    if (isNaN(value)) {
      return;
    }
    await completeHabit(value);
  };

  // Helper functions
  const getTimeDisplay = (): string => {
    if (habit.deadlineLocal) {
      return `by ${habit.deadlineLocal}`;
    }
    return '';
  };

  const getStatusClass = (): string => {
    if (isCompleted) return 'checklist-item--completed';
    if (isSkipped) return 'checklist-item--skipped';
    if (isMissed) return 'checklist-item--missed';
    return '';
  };

  // Capture card state and trigger expand animation
  const handleCardClick = contextSafe((e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('.checklist-checkbox')) {
      return;
    }
    if (cardRef.current && !isAnimatingRef.current) {
      // Capture card container state for FLIP
      flipStateRef.current = Flip.getState(cardRef.current);

      // Capture title's absolute screen position for independent animation
      const titleEl = cardRef.current.querySelector('[data-flip-id^="title-"]') as HTMLElement;
      if (titleEl) {
        titleRectRef.current = titleEl.getBoundingClientRect();
      }
    }
    onExpand();
  });

  const handleCardKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (cardRef.current && !isAnimatingRef.current) {
        flipStateRef.current = Flip.getState(cardRef.current);
        const titleEl = cardRef.current.querySelector('[data-flip-id^="title-"]') as HTMLElement;
        if (titleEl) {
          titleRectRef.current = titleEl.getBoundingClientRect();
        }
      }
      onExpand();
    }
  };

  // Animate modal closing, then trigger collapse
  const handleModalClose = contextSafe((): void => {
    if (modalRef.current && !isAnimatingRef.current) {
      isAnimatingRef.current = true;

      // Animate modal shrinking/fading, then collapse
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
          onCollapse();
        },
      });

      // Fade out content first
      tl.to(modalRef.current.querySelectorAll('.view-buttons, .settings-form, .settings-actions'), {
        opacity: 0,
        y: -10,
        stagger: 0.02,
        duration: 0.15,
        ease: 'power2.in',
      });

      // Then shrink and fade the modal container
      tl.to(modalRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      }, '-=0.1');

      // Also fade the backdrop
      const backdrop = document.querySelector('.modal-overlay-backdrop');
      if (backdrop) {
        tl.to(backdrop, {
          opacity: 0,
          duration: 0.2,
        }, '<');
      }
    } else {
      onCollapse();
    }
  });

  // Render card view
  if (!isExpanded) {
    return (
      <div
        ref={cardRef}
        data-flip-id={`habit-${habit.id}`}
        className={`checklist-item ${getStatusClass()}`}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Edit ${habit.name}`}
      >
        <label
          className="checklist-checkbox"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isDone}
            onChange={handleCheckboxChange}
            disabled={isDone || isSubmitting}
          />
          <span className="checkmark" />
        </label>

        <div className="checklist-content">
          <span
            data-flip-id={`title-${habit.id}`}
            className={`checklist-name ${isDone ? 'done' : ''}`}
          >
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

        {shouldShowDataInput && (
          <div className="data-input-overlay" onClick={() => setShouldShowDataInput(false)}>
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
                <button type="submit" disabled={isSubmitting || !dataValue}>
                  {isSubmitting ? '...' : 'Save'}
                </button>
                <button type="button" onClick={() => setShouldShowDataInput(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Render modal view
  return (
    <>
      {/* Ghost placeholder - maintains list space when modal is open */}
      <div className="checklist-item checklist-item--ghost" />

      {/* Backdrop - separate from modal for FLIP to work */}
      <div className="modal-overlay-backdrop" onClick={handleModalClose} />

      {/* Modal panel - positioned fixed, not inside flex container */}
      <div
        ref={modalRef}
        data-flip-id={`habit-${habit.id}`}
        className="modal settings-panel modal--flip"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="modal-header">
            <h2 data-flip-id={`title-${habit.id}`}>{habit.name}</h2>
            <button className="close-btn" onClick={handleModalClose}>×</button>
          </div>

          <div className="view-buttons">
            <button className="btn btn-secondary" onClick={() => setShouldShowCalendar(true)}>
              View Calendar
            </button>
            {habit.dataTracking && (
              <button className="btn btn-secondary" onClick={() => setShouldShowGraph(true)}>
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

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isDataTracking}
                  onChange={(e) => setIsDataTracking(e.target.checked)}
                />
                <span>Track data</span>
              </label>
              {isDataTracking && (
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
                  checked={isAllDays}
                  onChange={(e) => handleAllDaysChange(e.target.checked)}
                />
                <span>Every day</span>
              </label>
              {!isAllDays && (
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
            <button className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Habit'}
            </button>
            <div className="settings-actions-right">
              <button className="btn btn-secondary" onClick={handleModalClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

      {/* Calendar/Graph modals */}
      {shouldShowCalendar && (
        <CalendarView habit={habit} onClose={() => setShouldShowCalendar(false)} />
      )}
      {shouldShowGraph && habit.dataTracking && (
        <GraphView habit={habit} onClose={() => setShouldShowGraph(false)} />
      )}
    </>
  );
}

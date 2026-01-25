import { useState, useEffect, useRef, useCallback } from 'react';
import { statusApi } from '../api/client';
import type { BypassState } from '@habit-tracker/shared';

const DEFAULT_DURATION = 30;
const DURATION_OPTIONS = [15, 30, 60, 120];

export function EmergencyResetButton(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [bypassState, setBypassState] = useState<BypassState | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
  const [displayMinutes, setDisplayMinutes] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const messageTimeoutRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Fetch bypass status from server
  const fetchBypassStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await statusApi.getBypassStatus();
      if (response.success && response.data) {
        setBypassState(response.data);
        if (response.data.isActive) {
          setDisplayMinutes(Math.floor(response.data.remainingMinutes));
          setDisplaySeconds(Math.floor((response.data.remainingMinutes % 1) * 60));
        }
      }
    } catch {
      // Silently ignore fetch errors
    }
  }, []);

  // Initial fetch and periodic polling
  useEffect(() => {
    fetchBypassStatus();
    pollIntervalRef.current = window.setInterval(fetchBypassStatus, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchBypassStatus]);

  // Countdown timer when bypass is active
  useEffect(() => {
    if (bypassState?.isActive) {
      countdownIntervalRef.current = window.setInterval(() => {
        setDisplaySeconds((prev) => {
          if (prev <= 0) {
            setDisplayMinutes((m) => {
              if (m <= 0) {
                // Bypass expired, refresh status
                fetchBypassStatus();
                return 0;
              }
              return m - 1;
            });
            return 59;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [bypassState?.isActive, fetchBypassStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const showMessage = (text: string, isError: boolean): void => {
    setMessage({ text, isError });
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = window.setTimeout(() => setMessage(null), 3000);
  };

  const handleActivateBypass = async (): Promise<void> => {
    const confirmed = window.confirm(
      `Activate emergency bypass for ${selectedDuration} minutes?\n\nWebsites will remain unblocked during this period, even if habits become overdue.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await statusApi.activateBypass(selectedDuration);
      if (response.success && response.data) {
        setBypassState(response.data.bypass);
        setDisplayMinutes(Math.floor(response.data.bypass.remainingMinutes));
        setDisplaySeconds(Math.floor((response.data.bypass.remainingMinutes % 1) * 60));
        showMessage(response.data.message, false);
      } else {
        showMessage(response.error || 'Failed to activate bypass', true);
      }
    } catch {
      showMessage('An unexpected error occurred', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBypass = async (): Promise<void> => {
    const confirmed = window.confirm(
      'Cancel bypass?\n\nNormal blocking will resume immediately if any habits are overdue.'
    );
    if (!confirmed) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await statusApi.cancelBypass();
      if (response.success) {
        setBypassState({ isActive: false, bypassUntil: null, remainingMinutes: 0 });
        showMessage('Bypass cancelled', false);
      } else {
        showMessage(response.error || 'Failed to cancel bypass', true);
      }
    } catch {
      showMessage('An unexpected error occurred', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Render active bypass state with countdown
  if (bypassState?.isActive) {
    return (
      <div className="emergency-reset emergency-reset--active">
        <div className="bypass-countdown">
          <span className="bypass-label">Bypass Active</span>
          <span className="bypass-timer">
            {displayMinutes}:{displaySeconds.toString().padStart(2, '0')}
          </span>
          <span className="bypass-remaining">remaining</span>
        </div>
        <button
          className="emergency-reset-button emergency-reset-button--cancel"
          onClick={handleCancelBypass}
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Bypass'}
        </button>
        {message && (
          <span className={`emergency-reset-message ${message.isError ? 'error' : 'success'}`}>
            {message.text}
          </span>
        )}
      </div>
    );
  }

  // Render bypass activation UI
  return (
    <div className="emergency-reset">
      <div className="bypass-controls">
        <select
          className="bypass-duration-select"
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(Number(e.target.value))}
          disabled={isLoading}
          aria-label="Bypass duration"
        >
          {DURATION_OPTIONS.map((duration) => (
            <option key={duration} value={duration}>
              {duration} min
            </option>
          ))}
        </select>
        <button
          className="emergency-reset-button"
          onClick={handleActivateBypass}
          disabled={isLoading}
          aria-label={isLoading ? 'Activating...' : 'Emergency Bypass'}
        >
          {isLoading ? 'Activating...' : 'Emergency Bypass'}
        </button>
      </div>
      {message && (
        <span className={`emergency-reset-message ${message.isError ? 'error' : 'success'}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}

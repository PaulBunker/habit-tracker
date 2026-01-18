import { useState, useEffect, useRef } from 'react';
import { statusApi } from '../api/client';

export function EmergencyResetButton(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleReset = async (): Promise<void> => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all blocked websites? This will immediately unblock all sites.'
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await statusApi.resetHosts();

      if (response.success) {
        setMessage({ text: response.data?.message || 'Reset successful', isError: false });
      } else {
        setMessage({ text: response.error || 'Reset failed', isError: true });
      }
    } catch {
      setMessage({ text: 'An unexpected error occurred', isError: true });
    } finally {
      setIsLoading(false);
    }

    // Auto-clear message after 3 seconds
    timeoutRef.current = window.setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return (
    <div className="emergency-reset">
      <button
        className="emergency-reset-button"
        onClick={handleReset}
        disabled={isLoading}
        aria-label={isLoading ? 'Resetting...' : 'Reset Blocks'}
      >
        {isLoading ? 'Resetting...' : 'Reset Blocks'}
      </button>
      {message && (
        <span className={`emergency-reset-message ${message.isError ? 'error' : 'success'}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}

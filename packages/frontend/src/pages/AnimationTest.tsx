import { useState, useRef, useCallback } from 'react';

/**
 * Progress bar animation test component.
 * Animates from 0% to 100% over 1000ms with linear timing.
 * Used to verify capture scripts produce deterministic results.
 */
export function AnimationTest() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const DURATION = 1000; // 1 second animation

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const newProgress = Math.min(elapsed / DURATION, 1);

    setProgress(newProgress);

    if (elapsed < DURATION) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
      setProgress(1); // Ensure we end at exactly 100%
    }
  }, []);

  const handleStart = useCallback(() => {
    // Reset state
    setProgress(0);
    setIsAnimating(true);
    startTimeRef.current = 0;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Start new animation
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const handleReset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
    setProgress(0);
    startTimeRef.current = 0;
  }, []);

  const percentageDisplay = Math.round(progress * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1 style={{ color: '#fff', marginBottom: '40px' }}>Animation Test</h1>

      {/* Progress bar container */}
      <div
        data-testid="progress-container"
        style={{
          width: '400px',
          height: '40px',
          backgroundColor: '#4a4a6a',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #6a6a8a',
        }}
      >
        {/* Progress bar fill */}
        <div
          data-testid="progress-bar"
          data-progress={progress}
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: '#4a90d9',
            transition: 'none', // No CSS transition - we control via JS
            borderRadius: progress >= 1 ? '6px' : '6px 0 0 6px',
          }}
        />
      </div>

      {/* Progress percentage display */}
      <div
        data-testid="progress-text"
        style={{
          color: '#fff',
          fontSize: '24px',
          marginTop: '20px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {percentageDisplay}%
      </div>

      {/* Controls */}
      <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
        <button
          id="start-button"
          data-testid="start-button"
          onClick={handleStart}
          disabled={isAnimating}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            backgroundColor: isAnimating ? '#3a3a5a' : '#4a90d9',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isAnimating ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isAnimating ? 'Animating...' : 'Start'}
        </button>

        <button
          id="reset-button"
          data-testid="reset-button"
          onClick={handleReset}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            backgroundColor: '#6a4a4a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Reset
        </button>
      </div>

      {/* Animation info */}
      <div
        style={{
          marginTop: '40px',
          color: '#8a8aaa',
          fontSize: '14px',
          textAlign: 'center',
        }}
      >
        <p>Duration: {DURATION}ms | Timing: linear</p>
        <p>Expected: Frame N at (N × 100)ms should show ~(N × 10)% progress</p>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, RefObject } from 'react';
import { Flipper, Flipped, spring } from 'react-flip-toolkit';
import './Playground.css';

const CONTENT_ITEM_COUNT = 5; // Total number of content items

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

/**
 * Creates an onExit handler that tracks completions and calls onAllComplete when done.
 * Uses a closure to share state across all exit animations.
 */
function createContentExitHandler(onAllComplete: () => void): (
  el: HTMLElement,
  index: number,
  removeElement: () => void
) => void {
  let pendingExits = 0;

  return (el: HTMLElement, index: number, removeElement: () => void): void => {
    pendingExits++;
    // Reverse the index so last item (bottom) exits first
    const reverseIndex = CONTENT_ITEM_COUNT - 1 - index;

    setTimeout(() => {
      spring({
        config: { stiffness: 400, damping: 25 },
        values: { opacity: [1, 0] },
        onUpdate: (val) => {
          el.style.opacity = String((val as { opacity: number }).opacity);
        },
        onComplete: () => {
          removeElement();
          pendingExits--;
          if (pendingExits === 0) {
            onAllComplete();
          }
        },
      });
    }, reverseIndex * 50);
  };
}

// Step 6: Modal component with dynamic flipId (like HabitSettingsPanel)
interface PlaygroundModalProps {
  habitId: string;
  onClose: () => void;
  smallTitleRef: RefObject<HTMLDivElement>;
  largeTitleRef: RefObject<HTMLDivElement>;
  onSpringUpdate: (springValue: number) => void;
  morphComplete: boolean;
  onContentExit: (el: HTMLElement, index: number, removeElement: () => void) => void;
}

function PlaygroundModal({
  habitId,
  onClose,
  smallTitleRef,
  largeTitleRef,
  onSpringUpdate,
  morphComplete,
  onContentExit,
}: PlaygroundModalProps) {
  return (
    <Flipped flipId="settings-overlay">
      <div className="modal-overlay" onClick={onClose}>
        <Flipped
          flipId={`habit-${habitId}`}
          onSpringUpdate={onSpringUpdate}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <Flipped inverseFlipId={`habit-${habitId}`} scale>
              <div className="modal__inner">
                <div className="title-container">
                  <div
                    ref={smallTitleRef}
                    className="card__title--small"
                    style={{ opacity: 0 }}
                  >
                    My Habit
                  </div>
                  <div
                    ref={largeTitleRef}
                    className="card__title--large"
                    style={{ opacity: 1 }}
                  >
                    My Habit
                  </div>
                </div>
                {morphComplete && (
                  <>
                    <Flipped flipId="modal-box-1" stagger onAppear={onContentAppear} onExit={onContentExit}>
                      <div className="content-box">Settings Option 1</div>
                    </Flipped>
                    <Flipped flipId="modal-box-2" stagger onAppear={onContentAppear} onExit={onContentExit}>
                      <div className="content-box">Settings Option 2</div>
                    </Flipped>
                    <Flipped flipId="modal-box-3" stagger onAppear={onContentAppear} onExit={onContentExit}>
                      <div className="content-box">Settings Option 3</div>
                    </Flipped>
                    <Flipped flipId="modal-box-4" stagger onAppear={onContentAppear} onExit={onContentExit}>
                      <div className="content-box">Settings Option 4</div>
                    </Flipped>
                    <Flipped flipId="modal-btn" stagger onAppear={onContentAppear} onExit={onContentExit}>
                      <button onClick={onClose}>Close</button>
                    </Flipped>
                  </>
                )}
              </div>
            </Flipped>
          </div>
        </Flipped>
      </div>
    </Flipped>
  );
}

// Step 5: Parent has Flipper, state, refs, and callback (like App.tsx)
export function Playground() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [morphComplete, setMorphComplete] = useState(false);

  // Refs defined in parent (like App.tsx)
  const smallTitleRef = useRef<HTMLDivElement>(null);
  const largeTitleRef = useRef<HTMLDivElement>(null);
  const isOpeningRef = useRef(true);

  // Track if we've already triggered morph complete to avoid re-triggering
  const morphCompleteTriggeredRef = useRef(false);

  // Create exit handler that triggers morph-back when all content exits complete
  const onContentExitHandler = useRef(
    createContentExitHandler(() => {
      isOpeningRef.current = false;
      setSelectedId(null);
    })
  ).current;

  // Callback defined in parent (like App.tsx)
  const handleSpringUpdate = useCallback((springValue: number) => {
    const largeOpacity = isOpeningRef.current ? springValue : 1 - springValue;
    const smallOpacity = isOpeningRef.current ? 1 - springValue : springValue;

    if (smallTitleRef.current) {
      smallTitleRef.current.style.opacity = String(smallOpacity);
    }
    if (largeTitleRef.current) {
      largeTitleRef.current.style.opacity = String(largeOpacity);
    }

    // Force final values and trigger content when animation is nearly complete
    if (springValue > 0.95) {
      if (smallTitleRef.current) {
        smallTitleRef.current.style.opacity = isOpeningRef.current ? '0' : '1';
      }
      if (largeTitleRef.current) {
        largeTitleRef.current.style.opacity = isOpeningRef.current ? '1' : '0';
      }

      // Trigger content appearance when opening and morph is nearly done
      if (isOpeningRef.current && !morphCompleteTriggeredRef.current) {
        morphCompleteTriggeredRef.current = true;
        setMorphComplete(true);
      }
    }
  }, []);

  const handleOpen = (): void => {
    isOpeningRef.current = true;
    morphCompleteTriggeredRef.current = false;
    setMorphComplete(false);
    setSelectedId('abc123'); // Simulate a habit ID like the real site
  };

  const handleClose = (): void => {
    if (morphComplete) {
      // Hide content - triggers onExit animations
      // The morph-back is triggered by onContentExitHandler when all exits complete
      setMorphComplete(false);
    } else {
      // Content hasn't appeared yet, trigger morph-back immediately
      isOpeningRef.current = false;
      setSelectedId(null);
    }
  };

  return (
    <Flipper
      flipKey={`${selectedId || 'closed'}-${morphComplete}`}
      spring={{ stiffness: 300, damping: 30 }}
    >
      <div className="playground">
        <h1>FLIP Animation Playground</h1>
        <p>Step 6: Dynamic flipId using habit-$&#123;id&#125; (like real site)</p>

        {/* Card in parent (like HabitCard rendered in App.tsx via DailyChecklist) */}
        {!selectedId && (
          <Flipped flipId="habit-abc123">
            <div className="card" onClick={handleOpen}>
              <Flipped inverseFlipId="habit-abc123" scale>
                <div className="card__inner">
                  <div className="title-container">
                    <div
                      ref={smallTitleRef}
                      className="card__title--small"
                      style={{ opacity: 1 }}
                    >
                      My Habit
                    </div>
                    <div
                      ref={largeTitleRef}
                      className="card__title--large"
                      style={{ opacity: 0 }}
                    >
                      My Habit
                    </div>
                  </div>
                  <p>Click to expand</p>
                </div>
              </Flipped>
            </div>
          </Flipped>
        )}

        {/* Modal as separate component (like HabitSettingsPanel) */}
        {selectedId && (
          <PlaygroundModal
            habitId={selectedId}
            onClose={handleClose}
            smallTitleRef={smallTitleRef}
            largeTitleRef={largeTitleRef}
            onSpringUpdate={handleSpringUpdate}
            morphComplete={morphComplete}
            onContentExit={onContentExitHandler}
          />
        )}
      </div>
    </Flipper>
  );
}

/**
 * Source: https://gsap.com/resources/React/
 * Description: Official useGSAP hook examples from GSAP React documentation
 *
 * These examples demonstrate:
 * - Basic animation with scope
 * - Context-safe event handlers
 * - Manual event listener cleanup
 */

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Example 1: Basic animation with scoped selectors
// From: https://gsap.com/resources/React/
function BasicAnimation() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to('.box', { x: 360 });
    },
    { scope: container }
  );

  return (
    <div ref={container}>
      <div className="box">Animated Box</div>
    </div>
  );
}

// Example 2: Context-safe click handling
// From: https://gsap.com/resources/React/
function ContextSafeClick() {
  const container = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: container });

  const onClickGood = contextSafe(() => {
    gsap.to('.good', { rotation: 180 });
  });

  return (
    <div ref={container}>
      <button onClick={onClickGood} className="good">
        Click to Rotate
      </button>
    </div>
  );
}

// Example 3: Manual event listeners with cleanup
// From: https://gsap.com/resources/React/
function ManualEventListeners() {
  const container = useRef<HTMLDivElement>(null);
  const goodRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (context, contextSafe) => {
      gsap.to(goodRef.current, { x: 100 });

      const onClickGood = contextSafe(() => {
        gsap.to(goodRef.current, { rotation: 180 });
      });

      goodRef.current?.addEventListener('click', onClickGood);

      return () => {
        goodRef.current?.removeEventListener('click', onClickGood);
      };
    },
    { scope: container }
  );

  return (
    <div ref={container}>
      <div ref={goodRef} className="box">
        Click me
      </div>
    </div>
  );
}

export { BasicAnimation, ContextSafeClick, ManualEventListeners };

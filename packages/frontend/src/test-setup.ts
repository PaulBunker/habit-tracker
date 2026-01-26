import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock GSAP - not fully compatible with JSDOM
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    to: vi.fn(() => ({ kill: vi.fn() })),
    from: vi.fn(() => ({ kill: vi.fn() })),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
    killTweensOf: vi.fn(),
  },
}));

vi.mock('gsap/dist/Flip', () => ({
  Flip: {
    getState: vi.fn(() => ({})),
    from: vi.fn(() => ({ kill: vi.fn() })),
    to: vi.fn(() => ({ kill: vi.fn() })),
  },
}));

vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn((callback) => {
    // Return contextSafe function that just executes the callback
    return {
      contextSafe: (fn: () => void) => fn,
    };
  }),
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

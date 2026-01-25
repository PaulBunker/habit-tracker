/**
 * Daemon state persistence manager.
 *
 * Manages persistent state for the daemon, including bypass mode.
 * State is stored in ~/.habit-tracker/daemon-state.json.
 *
 * @packageDocumentation
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { BypassState } from '@habit-tracker/shared';
import { log } from './hosts-manager';

const STATE_DIR = path.join(os.homedir(), '.habit-tracker');
const STATE_FILE_PATH = path.join(STATE_DIR, 'daemon-state.json');

/** Internal daemon state structure */
interface DaemonState {
  /** ISO 8601 timestamp when bypass expires, null if not active */
  bypassUntil: string | null;
}

const DEFAULT_STATE: DaemonState = {
  bypassUntil: null,
};

/**
 * Ensure state directory exists
 */
function ensureStateDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

/**
 * Load daemon state from disk.
 * Returns default state if file doesn't exist or is corrupted.
 */
export function loadState(): DaemonState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const content = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content) as DaemonState;
      // Validate structure
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          bypassUntil: typeof parsed.bypassUntil === 'string' ? parsed.bypassUntil : null,
        };
      }
    }
  } catch (error) {
    log(`Error loading daemon state: ${error}`, 'error');
  }
  return { ...DEFAULT_STATE };
}

/**
 * Save daemon state to disk.
 */
export function saveState(state: DaemonState): void {
  try {
    ensureStateDir();
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    log(`Error saving daemon state: ${error}`, 'error');
  }
}

/**
 * Check if bypass is currently active.
 * Returns true if bypassUntil is set and in the future.
 */
export function isBypassActive(): boolean {
  const state = loadState();
  if (!state.bypassUntil) {
    return false;
  }
  return new Date(state.bypassUntil).getTime() > Date.now();
}

/**
 * Get bypass state with computed fields.
 * Returns a BypassState object suitable for API responses.
 */
export function getBypassState(): BypassState {
  const state = loadState();

  if (!state.bypassUntil) {
    return { bypassUntil: null, remainingMinutes: 0, isActive: false };
  }

  const expiresAt = new Date(state.bypassUntil).getTime();
  const now = Date.now();
  const remainingMs = Math.max(0, expiresAt - now);
  const remainingMinutes = remainingMs / (1000 * 60);
  const isActive = remainingMs > 0;

  // If expired, return inactive state
  if (!isActive) {
    return { bypassUntil: null, remainingMinutes: 0, isActive: false };
  }

  return {
    bypassUntil: state.bypassUntil,
    remainingMinutes,
    isActive,
  };
}

/**
 * Activate bypass for specified duration.
 * Clears hosts immediately and persists state.
 *
 * @param durationMinutes - Duration in minutes (1-120)
 * @returns The new bypass state
 */
export function activateBypass(durationMinutes: number): BypassState {
  const bypassUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  saveState({ bypassUntil });
  log(`Bypass activated for ${durationMinutes} minutes until ${bypassUntil}`);
  return getBypassState();
}

/**
 * Cancel any active bypass.
 * Normal blocking will resume on next check.
 */
export function cancelBypass(): void {
  saveState({ bypassUntil: null });
  log('Bypass cancelled');
}

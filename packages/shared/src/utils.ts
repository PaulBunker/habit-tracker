/**
 * Shared utility functions for the Habit Tracker application.
 *
 * This module provides timezone conversion, date formatting, and validation
 * helpers used across frontend, backend, and daemon packages.
 *
 * @packageDocumentation
 */

/**
 * Converts a local time to UTC given the user's timezone offset.
 *
 * Used when storing habit deadlines. The user enters time in their local
 * timezone, which is converted to UTC for storage and daemon comparison.
 *
 * @param localTime - Time in HH:MM format (24-hour, local timezone)
 * @param timezoneOffsetMinutes - Offset from UTC in minutes (e.g., -300 for EST, +60 for CET)
 * @returns Time in HH:MM format (24-hour, UTC)
 *
 * @example
 * ```typescript
 * // Convert 9:00 AM EST to UTC
 * const utcTime = localTimeToUtc('09:00', -300);
 * console.log(utcTime); // '14:00'
 *
 * // Convert 18:30 CET to UTC
 * const utcTime2 = localTimeToUtc('18:30', 60);
 * console.log(utcTime2); // '17:30'
 * ```
 */
export function localTimeToUtc(localTime: string, timezoneOffsetMinutes: number): string {
  const [hours, minutes] = localTime.split(':').map(Number);
  const localMinutes = hours * 60 + minutes;
  const utcMinutes = (localMinutes - timezoneOffsetMinutes + 1440) % 1440;
  const utcHours = Math.floor(utcMinutes / 60);
  const utcMins = utcMinutes % 60;
  return `${utcHours.toString().padStart(2, '0')}:${utcMins.toString().padStart(2, '0')}`;
}

/**
 * Converts a UTC time to local time given the user's timezone offset.
 *
 * Used when displaying habit deadlines. Stored UTC times are converted
 * to the user's local timezone for display.
 *
 * @param utcTime - Time in HH:MM format (24-hour, UTC)
 * @param timezoneOffsetMinutes - Offset from UTC in minutes (e.g., -300 for EST, +60 for CET)
 * @returns Time in HH:MM format (24-hour, local timezone)
 *
 * @example
 * ```typescript
 * // Convert 14:00 UTC to EST
 * const localTime = utcTimeToLocal('14:00', -300);
 * console.log(localTime); // '09:00'
 *
 * // Convert 17:30 UTC to CET
 * const localTime2 = utcTimeToLocal('17:30', 60);
 * console.log(localTime2); // '18:30'
 * ```
 */
export function utcTimeToLocal(utcTime: string, timezoneOffsetMinutes: number): string {
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcMinutes = hours * 60 + minutes;
  const localMinutes = (utcMinutes + timezoneOffsetMinutes + 1440) % 1440;
  const localHours = Math.floor(localMinutes / 60);
  const localMins = localMinutes % 60;
  return `${localHours.toString().padStart(2, '0')}:${localMins.toString().padStart(2, '0')}`;
}

/**
 * Validates that a string is a properly formatted domain name.
 *
 * Used when adding websites to the blocked list. Ensures the domain
 * follows standard DNS naming conventions (alphanumeric with hyphens,
 * dot-separated labels, valid TLD).
 *
 * @param domain - The domain string to validate (e.g., "reddit.com")
 * @returns `true` if the domain format is valid, `false` otherwise
 *
 * @example
 * ```typescript
 * isValidDomain('reddit.com');     // true
 * isValidDomain('sub.example.org'); // true
 * isValidDomain('my-site.co.uk');   // true
 * isValidDomain('invalid');         // false (no TLD)
 * isValidDomain('http://site.com'); // false (includes protocol)
 * isValidDomain('');                // false (empty)
 * ```
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
}

/**
 * Gets the current date in YYYY-MM-DD format (UTC).
 *
 * Used for creating habit logs and determining which habits are
 * active for "today". Always uses UTC to ensure consistency across
 * timezones.
 *
 * @returns Current UTC date as a string in YYYY-MM-DD format
 *
 * @example
 * ```typescript
 * const today = getCurrentDateUtc();
 * console.log(today); // '2024-01-15'
 * ```
 */
export function getCurrentDateUtc(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Gets the current time in HH:MM format (UTC).
 *
 * Used by the daemon to compare against habit deadlines. When the
 * current UTC time exceeds a habit's deadline UTC, blocking is triggered.
 *
 * @returns Current UTC time as a string in HH:MM format (24-hour)
 *
 * @example
 * ```typescript
 * const now = getCurrentTimeUtc();
 * console.log(now); // '14:30'
 * ```
 */
export function getCurrentTimeUtc(): string {
  const now = new Date();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Gets the user's current timezone offset in minutes from UTC.
 *
 * Used in the browser to detect the user's timezone when creating
 * or editing habits. The offset is stored with the habit to enable
 * accurate deadline comparisons.
 *
 * **Note**: Returns the offset as minutes to ADD to UTC to get local time.
 * This is the opposite sign of JavaScript's `Date.getTimezoneOffset()`.
 *
 * @returns Timezone offset in minutes (positive = east of UTC, negative = west)
 *
 * @example
 * ```typescript
 * // In EST (UTC-5)
 * const offset = getTimezoneOffset();
 * console.log(offset); // -300
 *
 * // In CET (UTC+1)
 * const offset = getTimezoneOffset();
 * console.log(offset); // 60
 * ```
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset();
}

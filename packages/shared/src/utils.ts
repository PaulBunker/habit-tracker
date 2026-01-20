/**
 * Shared utility functions for the Habit Tracker application.
 * @packageDocumentation
 */

/**
 * Converts a local time to UTC given the user's timezone offset.
 *
 * @param localTime - Time in HH:MM format (24-hour, local timezone)
 * @param timezoneOffsetMinutes - Offset from UTC in minutes (e.g., -300 for EST)
 * @returns Time in HH:MM format (24-hour, UTC)
 *
 * @example
 * localTimeToUtc('09:00', -300) // '14:00' (EST to UTC)
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
 * @param utcTime - Time in HH:MM format (24-hour, UTC)
 * @param timezoneOffsetMinutes - Offset from UTC in minutes (e.g., -300 for EST)
 * @returns Time in HH:MM format (24-hour, local timezone)
 *
 * @example
 * utcTimeToLocal('14:00', -300) // '09:00' (UTC to EST)
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
 * @param domain - Domain to validate (e.g., "reddit.com")
 * @returns `true` if valid domain format
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
}

/** Returns current UTC date as YYYY-MM-DD string. */
export function getCurrentDateUtc(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/** Returns current UTC time as HH:MM string (24-hour). */
export function getCurrentTimeUtc(): string {
  const now = new Date();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Returns user's timezone offset in minutes from UTC.
 * Positive = east of UTC, negative = west (opposite of JS getTimezoneOffset).
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset();
}

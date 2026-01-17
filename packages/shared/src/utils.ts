/**
 * Shared utility functions
 */

/**
 * Convert local time (HH:MM) to UTC given timezone offset
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
 * Convert UTC time (HH:MM) to local given timezone offset
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
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
}

/**
 * Get current date in YYYY-MM-DD format (UTC)
 */
export function getCurrentDateUtc(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM format (UTC)
 */
export function getCurrentTimeUtc(): string {
  const now = new Date();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get user's timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset();
}

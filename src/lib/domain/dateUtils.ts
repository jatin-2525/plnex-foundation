/**
 * PLnEX Canonical Date & Timezone Utilities
 * Standardizes project reporting dates, Indian Standard Time (IST), and dynamic formatting.
 */

export const PROJECT_TIMEZONE = 'Asia/Kolkata';
export const PROJECT_TIMEZONE_CODE = 'IST'; // UTC+05:30

/**
 * Authoritative Canonical Project Cutoff Date & Time
 * (All verified actuals, S-curves, and DPR logs are anchored to this reporting cutoff)
 */
export const PROJECT_REPORT_DATE = '2026-09-18T17:30:00+05:30';

export interface DateFormatOptions {
  includeDayOfWeek?: boolean;
  includeTime?: boolean;
  includeTimezone?: boolean;
  includeUtcEquivalent?: boolean;
}

/**
 * Formats a project timestamp into consistent canonical IST format.
 * Automatically computes correct day-of-week without manual hardcoding.
 *
 * Example:
 * formatProjectDateTime('2026-09-18T17:30:00+05:30') => "18 Sep 2026, 17:30 IST"
 * with includeDayOfWeek => "Friday, 18 Sep 2026, 17:30 IST"
 */
export function formatProjectDateTime(
  dateInput: string | Date | number = PROJECT_REPORT_DATE,
  options: DateFormatOptions = { includeTime: true, includeTimezone: true }
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const dayOfWeek = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      weekday: 'long',
    }).format(d);

    const day = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      day: 'numeric',
    }).format(d);

    const month = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      month: 'short',
    }).format(d);

    const year = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      year: 'numeric',
    }).format(d);

    const hours = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      hour: '2-digit',
      hour12: false,
    }).format(d).padStart(2, '0');

    const minutes = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      minute: '2-digit',
    }).format(d).padStart(2, '0');

    let result = '';
    if (options.includeDayOfWeek) {
      result += `${dayOfWeek}, `;
    }

    result += `${day} ${month} ${year}`;

    if (options.includeTime) {
      result += `, ${hours}:${minutes}`;
      if (options.includeTimezone) {
        result += ` ${PROJECT_TIMEZONE_CODE}`;
      }
    }

    if (options.includeUtcEquivalent) {
      const utcHours = d.getUTCHours().toString().padStart(2, '0');
      const utcMinutes = d.getUTCMinutes().toString().padStart(2, '0');
      result += ` (${utcHours}:${utcMinutes} UTC)`;
    }

    return result;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format date only (e.g., "18 Sep 2026" or "Friday, 18 Sep 2026")
 */
export function formatProjectDate(
  dateInput: string | Date | number = PROJECT_REPORT_DATE,
  includeDayOfWeek: boolean = false
): string {
  return formatProjectDateTime(dateInput, {
    includeDayOfWeek,
    includeTime: false,
    includeTimezone: false,
  });
}

/**
 * Format time only (e.g., "17:30 IST")
 */
export function formatProjectTime(
  dateInput: string | Date | number = PROJECT_REPORT_DATE,
  includeTimezone: boolean = true
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const hours = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      hour: '2-digit',
      hour12: false,
    }).format(d).padStart(2, '0');

    const minutes = new Intl.DateTimeFormat('en-IN', {
      timeZone: PROJECT_TIMEZONE,
      minute: '2-digit',
    }).format(d).padStart(2, '0');

    return includeTimezone ? `${hours}:${minutes} ${PROJECT_TIMEZONE_CODE}` : `${hours}:${minutes}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Produce a safe, non-misleading "Last updated" string anchored to the authoritative report date
 * e.g., "Last updated: 18 Sep 2026, 17:30 IST"
 */
export function getAuthoritativeLastUpdatedText(): string {
  return `Last updated: ${formatProjectDateTime(PROJECT_REPORT_DATE)}`;
}

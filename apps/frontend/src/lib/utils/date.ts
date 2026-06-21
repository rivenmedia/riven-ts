/**
 * Date utility functions using @internationalized/date for consistent date handling
 */
import {
  CalendarDate,
  type DateValue,
  ZonedDateTime,
  getLocalTimeZone,
  now,
  parseDate,
  parseZonedDateTime,
  today,
} from "@internationalized/date";
import { DateTime, Settings } from "luxon";

declare module "luxon" {
  export interface TSSettings {
    throwOnInvalid: true;
  }
}

Settings.throwOnInvalid = true;

/**
 * Parse an ISO date string to CalendarDate
 * @param dateString ISO date string (e.g., "2024-01-20", "2024-01-20T00:00:00", or "2024-01-20 00:00:00")
 * @returns CalendarDate or null if invalid
 */
export function parseISODate(
  dateString: string | null | undefined,
): CalendarDate | null {
  if (!dateString) {
    return null;
  }

  try {
    // Extract just the date part - handle both "T" separator and space separator
    // Also handle formats like "2011-10-28 00:00:00" from backend
    const datePart = dateString.split(/[T\s]/)[0];

    if (!datePart) {
      return null;
    }

    return parseDate(datePart);
  } catch {
    return null;
  }
}

/**
 * Parse an ISO datetime string to ZonedDateTime
 * @param dateString ISO datetime string
 * @returns ZonedDateTime or null if invalid
 */
export function parseISODateTime(
  dateString: string | null | undefined,
): ZonedDateTime | null {
  if (!dateString) return null;
  try {
    return parseZonedDateTime(dateString);
  } catch {
    return null;
  }
}

/**
 * Get the current date in the local timezone
 */
export function getToday(): CalendarDate {
  return today(getLocalTimeZone());
}

/**
 * Get the current date and time in the local timezone
 */
export function getNow(): ZonedDateTime {
  return now(getLocalTimeZone());
}

/**
 * Convert a DateValue to an ISO date string (YYYY-MM-DD)
 */
export function toISODate(date: DateValue): string {
  return `${date.year.toString().padStart(4, "0")}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
}

/**
 * Get the year from an ISO date string
 */
export function getYearFromISO(
  dateString: string | null | undefined,
): number | null {
  const date = parseISODate(dateString);
  return date ? date.year : null;
}

/**
 * Get the season and year from an ISO date string
 */
export function getSeasonAndYear(
  dateString: string | null | undefined,
): string {
  if (!dateString) return "TBA";

  const date = parseISODate(dateString);
  if (!date) return "TBA";

  const month = date.month;
  const year = date.year;

  let season: string;
  if (month >= 3 && month <= 5) {
    season = "Spring";
  } else if (month >= 6 && month <= 8) {
    season = "Summer";
  } else if (month >= 9 && month <= 11) {
    season = "Fall";
  } else {
    season = "Winter";
  }

  return `${season} ${year.toString()}`;
}

/**
 * Format a date to a localized string
 * @param dateString ISO date string
 * @param locale Locale string (defaults to "en-US")
 * @param options Intl.DateTimeFormatOptions
 */
export function formatDate(
  dateString: string | null | undefined,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string | null {
  if (!dateString) return null;

  const date = parseISODate(dateString);
  if (!date) return null;

  // Convert CalendarDate to a native Date for formatting
  const nativeDate = DateTime.fromObject({
    year: date.year,
    month: date.month,
    day: date.day,
  });

  return nativeDate.toLocaleString(options, { locale });
}

/**
 * Format a datetime to a localized string
 */
export function formatDateTime(
  dateString: string | null | undefined,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  },
): string | null {
  if (!dateString) {
    return null;
  }

  const date = parseISODateTime(dateString);

  if (!date) {
    return null;
  }

  // Convert ZonedDateTime to a native Date for formatting
  const nativeDate = date.toDate();

  return nativeDate.toLocaleDateString(locale, options);
}

/**
 * Calculate age from a birthday (and optional death date)
 */
export function calculateAge(
  birthday: string | null | undefined,
  deathday: string | null | undefined = null,
): number | null {
  if (!birthday) return null;

  const birthDate = parseISODate(birthday);
  if (!birthDate) return null;

  const endDate = deathday ? parseISODate(deathday) : getToday();
  if (!endDate) return null;

  let age = endDate.year - birthDate.year;

  // Adjust if birthday hasn't occurred yet this year
  if (
    endDate.month < birthDate.month ||
    (endDate.month === birthDate.month && endDate.day < birthDate.day)
  ) {
    age--;
  }

  return age;
}

/**
 * Check if a date's day and month match today's day and month
 */
export function isDayAndMonthToday(
  dateString: string | null | undefined,
): boolean {
  if (!dateString) return false;

  const date = parseISODate(dateString);
  if (!date) return false;

  const todayDate = getToday();
  return date.month === todayDate.month && date.day === todayDate.day;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: CalendarDate, date2: CalendarDate): boolean {
  return (
    date1.year === date2.year &&
    date1.month === date2.month &&
    date1.day === date2.day
  );
}

/**
 * Check if two dates have the same month and day
 */
export function isSameDayAndMonth(
  date1: CalendarDate,
  date2: CalendarDate,
): boolean {
  return date1.month === date2.month && date1.day === date2.day;
}

/**
 * Get the last Monday before or on a given date
 */
export function getLastMonday(date: CalendarDate): CalendarDate {
  // Convert to native Date for day-of-week calculation
  const nativeDate = DateTime.fromObject({
    year: date.year,
    month: date.month,
    day: date.day,
  });
  const dayOfWeek = nativeDate.weekday % 7; // Convert Luxon's format (1 = Monday, 7 = Sunday) to JS' format (0 = Sunday, 6 = Saturday)
  const diff = (dayOfWeek + 6) % 7; // Days since Monday

  // Subtract days to get to Monday
  const mondayNative = nativeDate.minus({ days: diff });

  return new CalendarDate(
    mondayNative.year,
    mondayNative.month,
    mondayNative.day,
  );
}

/**
 * Add days to a date
 */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  const nativeDate = DateTime.fromObject({
    year: date.year,
    month: date.month,
    day: date.day,
  }).plus({ days });

  return new CalendarDate(nativeDate.year, nativeDate.month, nativeDate.day);
}

interface CalendarData {
  max: number;
  calendar: ({ date: string; value: number } | undefined)[][];
}

/**
 * Generate calendar data for a year (for heatmap visualization)
 */
export function getCalendar(
  data: Record<string, number>,
  year: number,
): CalendarData {
  const base = getLastMonday(new CalendarDate(year, 1, 1));

  const out: CalendarData = {
    max: 0,
    calendar: [],
  };

  out.calendar = Array.from({ length: 7 }, (_, i) => {
    const start = addDays(base, i);
    return Array.from({ length: 53 }, (_, j) => {
      const day = addDays(start, j * 7);
      if (day.year === year) {
        const date = toISODate(day);
        const value = data[date] ?? 0;

        if (value > out.max) {
          out.max = value;
        }

        return { date, value };
      }
      return undefined;
    });
  });

  return out;
}

/**
 * Get the first day of a month
 */
export function getFirstDayOfMonth(year: number, month: number): CalendarDate {
  return new CalendarDate(year, month, 1);
}

/**
 * Get the last day of a month
 */
export function getLastDayOfMonth(year: number, month: number): CalendarDate {
  // Get the first day of next month, then go back one day
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const firstOfNext = new CalendarDate(nextYear, nextMonth, 1);

  const nativeDate = DateTime.fromObject({
    year: firstOfNext.year,
    month: firstOfNext.month,
    day: firstOfNext.day,
  }).minus({ days: 1 });

  return new CalendarDate(nativeDate.year, nativeDate.month, nativeDate.day);
}

/**
 * Get the day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: CalendarDate): number {
  const nativeDate = DateTime.fromObject({
    year: date.year,
    month: date.month,
    day: date.day,
  });

  // Convert Luxon's format (1 = Monday, 7 = Sunday) to JS' format (0 = Sunday, 6 = Saturday)
  return nativeDate.weekday % 7;
}

/**
 * Compare two date strings by their timestamp
 * Returns negative if a is before b, positive if a is after b, 0 if equal
 */
export function compareDateStrings(
  dateA: string | null | undefined,
  dateB: string | null | undefined,
): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  const a = parseISODate(dateA);
  const b = parseISODate(dateB);

  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // Compare year, then month, then day
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/**
 * Get timestamp in milliseconds (for cache operations, etc.)
 * This returns the current time as milliseconds since epoch
 */
export function getTimestamp(): number {
  return DateTime.now().toMillis();
}

/**
 * Convert DateValue to milliseconds since epoch
 */
export function dateToTimestamp(date: DateValue): number {
  const nativeDate = DateTime.fromObject({
    year: date.year,
    month: date.month,
    day: date.day,
  });

  return nativeDate.toMillis();
}

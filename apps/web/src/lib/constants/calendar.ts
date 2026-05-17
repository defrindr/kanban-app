/**
 * Calendar and date related constants
 */

export const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DATE_FORMAT_OPTIONS = {
  MONTH_YEAR: { month: 'long' as const, year: 'numeric' as const },
} as const;

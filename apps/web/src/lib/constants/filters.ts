/**
 * Card filtering constants
 */

export const DUE_DATE_FILTERS = {
  OVERDUE: 'overdue',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export type DueDateFilter = (typeof DUE_DATE_FILTERS)[keyof typeof DUE_DATE_FILTERS];

export const DUE_DATE_FILTER_OPTIONS: DueDateFilter[] = [
  DUE_DATE_FILTERS.OVERDUE,
  DUE_DATE_FILTERS.TODAY,
  DUE_DATE_FILTERS.WEEK,
  DUE_DATE_FILTERS.MONTH,
];

export const OVERDUE_INDICATOR_CONFIG = {
  bg: 'bg-red-50 dark:bg-red-900/20',
  text: 'text-red-700 dark:text-red-400',
  label: 'Overdue',
};

export const DUE_DATE_WARNING_THRESHOLD = 3; // days

export interface DueDateRange {
  min: Date;
  max: Date;
}

export function getDueDateRange(filter: DueDateFilter): DueDateRange | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filter) {
    case DUE_DATE_FILTERS.OVERDUE:
      return {
        min: new Date(0),
        max: new Date(today.getTime() - 1),
      };
    case DUE_DATE_FILTERS.TODAY:
      return {
        min: today,
        max: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case DUE_DATE_FILTERS.WEEK:
      return {
        min: today,
        max: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
      };
    case DUE_DATE_FILTERS.MONTH:
      return {
        min: today,
        max: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000 - 1),
      };
    default:
      return null;
  }
}

export function isOverdue(dueDate: Date): boolean {
  const now = new Date();
  return dueDate < now;
}

export function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isWarningThreshold(dueDate: Date): boolean {
  const daysLeft = getDaysUntilDue(dueDate);
  return daysLeft > 0 && daysLeft <= DUE_DATE_WARNING_THRESHOLD;
}

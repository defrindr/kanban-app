/**
 * Card status and progress constants
 */

export const CARD_STATUSES = {
  TODO: 'to do',
  IN_PROGRESS: 'in progress',
  DONE: 'done',
} as const

export type CardStatus = typeof CARD_STATUSES[keyof typeof CARD_STATUSES]

export interface StatusConfig {
  bg: string
  text: string
  icon: string
}

export const STATUS_CONFIG: Record<CardStatus, StatusConfig> = {
  [CARD_STATUSES.TODO]: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    icon: '◯',
  },
  [CARD_STATUSES.IN_PROGRESS]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '◐',
  },
  [CARD_STATUSES.DONE]: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    icon: '✓',
  },
}

export const STATUS_ICONS = {
  [CARD_STATUSES.TODO]: 'M9 12l2 2 4-4',
  [CARD_STATUSES.IN_PROGRESS]: 'M13 10V3L4 14h7v7l9-11h-7z',
  [CARD_STATUSES.DONE]: 'M5 13l4 4L19 7',
} as const

export function getStatusConfig(status: string | undefined): StatusConfig {
  return STATUS_CONFIG[status as CardStatus] || STATUS_CONFIG[CARD_STATUSES.TODO]
}

export function getStatusIcon(status: string | undefined): string {
  return STATUS_ICONS[status as CardStatus] || STATUS_ICONS[CARD_STATUSES.DONE]
}

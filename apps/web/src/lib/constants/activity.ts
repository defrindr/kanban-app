/**
 * Activity and audit trail constants
 */

export const ENTITY_TYPES = {
  BOARD: 'BOARD',
  LIST: 'LIST',
  CARD: 'CARD',
  COMMENT: 'COMMENT',
} as const

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES]

export const ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MOVE: 'MOVE',
} as const

export type Action = typeof ACTIONS[keyof typeof ACTIONS]

export const ACTION_COLORS: Record<Action, string> = {
  [ACTIONS.CREATE]: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  [ACTIONS.UPDATE]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  [ACTIONS.DELETE]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  [ACTIONS.MOVE]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
}

export const ACTIVITY_EXPORT = {
  HEADERS: ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Board ID'] as const,
  FORMATS: {
    JSON: 'application/json',
    CSV: 'text/csv',
  },
  DATE_FORMAT: 'yyyy-MM-dd',
} as const

export const ACTIVITY_FILTERS = {
  ENTITY_TYPE_OPTIONS: ['', ...Object.values(ENTITY_TYPES)] as const,
  ACTION_OPTIONS: ['', ...Object.values(ACTIONS)] as const,
}

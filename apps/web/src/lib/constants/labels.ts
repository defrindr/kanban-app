/**
 * Label color mapping constants
 */

import type { Label } from '@/features/kanban/types/kanban'

export const LABEL_COLOR_CLASSES: Record<Label['color'], string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

export function getLabelColorClass(color: Label['color']): string {
  return LABEL_COLOR_CLASSES[color] || LABEL_COLOR_CLASSES.gray
}

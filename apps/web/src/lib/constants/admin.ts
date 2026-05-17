/**
 * Admin dashboard constants
 */

export const ADMIN_STATS_KEYS = {
  USERS: 'users',
  BOARDS: 'boards',
  LISTS: 'lists',
  CARDS: 'cards',
  COMMENTS: 'comments',
} as const;

export type AdminStatKey = (typeof ADMIN_STATS_KEYS)[keyof typeof ADMIN_STATS_KEYS];

export interface AdminStatConfig {
  key: AdminStatKey;
  label: string;
  color: string;
  icon: string;
}

export const ADMIN_STAT_CARDS: AdminStatConfig[] = [
  {
    key: ADMIN_STATS_KEYS.USERS,
    label: 'Total Users',
    color: 'bg-blue-500',
    icon: 'Users',
  },
  {
    key: ADMIN_STATS_KEYS.BOARDS,
    label: 'Total Boards',
    color: 'bg-purple-500',
    icon: 'Layout',
  },
  {
    key: ADMIN_STATS_KEYS.LISTS,
    label: 'Total Lists',
    color: 'bg-green-500',
    icon: 'List',
  },
  {
    key: ADMIN_STATS_KEYS.CARDS,
    label: 'Total Cards',
    color: 'bg-orange-500',
    icon: 'Columns3',
  },
  {
    key: ADMIN_STATS_KEYS.COMMENTS,
    label: 'Total Comments',
    color: 'bg-pink-500',
    icon: 'MessageSquareText',
  },
];

export const ADMIN_PAGINATION = {
  DEFAULT_LIMIT: 20,
  DEFAULT_PAGE: 1 as number, // Cast to number to allow flexible type inference
} as const;

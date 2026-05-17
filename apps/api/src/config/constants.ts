// Pagination limits
export const PAGINATION = {
  MIN_PAGE: 1,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  SEARCH_DEFAULT_LIMIT: 20,
  SEARCH_MAX_LIMIT: 50,
} as const;

// Field length constraints
export const FIELD_LENGTHS = {
  NAME_MIN: 1,
  NAME_MAX: 100,
  TITLE_MIN: 1,
  TITLE_MAX: 100,
  CARD_TITLE_MIN: 1,
  CARD_TITLE_MAX: 200,
  DESCRIPTION_MAX: 500,
  CARD_DESCRIPTION_MAX: 2000,
  COMMENT_MIN: 1,
  COMMENT_MAX: 2000,
  LABEL_NAME_MIN: 1,
  LABEL_NAME_MAX: 50,
  SEARCH_QUERY_MIN: 1,
  SEARCH_QUERY_MAX: 200,
} as const;

// Analytics
export const ANALYTICS = {
  DAYS_LOOKBACK: 30,
  TOP_CONTRIBUTORS_LIMIT: 5,
  TOP_BOARDS_LIMIT: 5,
  TOP_BOARDS_USAGE_LIMIT: 10,
} as const;

// Cache TTL (seconds)
export const CACHE_TTL = {
  BOARDS: 60,
  CARDS: 45,
  COMMENTS: 30,
  ACTIVITIES: 20,
  SEARCH: 30,
} as const;

// Role types
export const BOARD_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

// Activity action types
export const ACTIVITY_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MOVE: 'MOVE',
} as const;

// Entity types
export const ENTITY_TYPES = {
  BOARD: 'BOARD',
  LIST: 'LIST',
  CARD: 'CARD',
  COMMENT: 'COMMENT',
  MEMBER: 'MEMBER',
} as const;

// Search types
export const SEARCH_TYPES = {
  ALL: 'all',
  BOARDS: 'boards',
  CARDS: 'cards',
  LISTS: 'lists',
  COMMENTS: 'comments',
} as const;

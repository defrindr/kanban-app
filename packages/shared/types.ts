export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  lists: List[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  labels: string[];
  assignees: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  boardId: string;
  userId: string;
  action: 'created' | 'moved' | 'updated' | 'deleted' | 'commented';
  entityType: 'board' | 'list' | 'card' | 'comment';
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER';
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// WebSocket Events
export interface WSEvents {
  'board:join': (boardId: string) => void;
  'board:leave': (boardId: string) => void;
  'board:update': (board: Board) => void;
  'list:create': (list: List) => void;
  'list:update': (list: List) => void;
  'list:delete': (listId: string) => void;
  'card:create': (card: Card) => void;
  'card:update': (card: Card) => void;
  'card:move': (card: Card, fromListId: string, toListId: string, newPosition: number) => void;
  'card:delete': (cardId: string) => void;
  'comment:add': (comment: Comment) => void;
  'user:presence': (boardId: string, users: User[]) => void;
}

// API Types
export interface CreateBoardDTO {
  name: string;
  description?: string;
}

export interface CreateListDTO {
  boardId: string;
  title: string;
}

export interface CreateCardDTO {
  listId: string;
  title: string;
  description?: string;
}

export interface MoveCardDTO {
  cardId: string;
  fromListId: string;
  toListId: string;
  newPosition: number;
}

export interface UpdateCardDTO {
  title?: string;
  description?: string;
  labels?: string[];
  assignees?: string[];
}

// API Response Envelope
export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    took_ms?: number;
  };
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
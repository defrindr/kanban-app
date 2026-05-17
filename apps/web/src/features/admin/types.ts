export type AdminStats = {
  users: number
  boards: number
  lists: number
  cards: number
  comments: number
}

export type AdminUser = {
  id: string
  email: string
  name: string
  avatar: string | null
  role: string
  createdAt: string
}

export type AdminBoard = {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  _count: { lists: number; members: number }
}

export type AdminActivity = {
  id: string
  boardId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata: unknown
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
}

export type PaginatedResponse<T> = {
  data?: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

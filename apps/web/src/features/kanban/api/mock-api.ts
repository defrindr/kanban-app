import { apiClient } from '@/shared/api/client'
import type { Board, Card, Comment, List, Label, Activity, Notification, BoardMember, ChecklistItem, Attachment } from '../types/kanban'

const HEX_COLOR_MAP: Record<string, string> = {
  '#3B82F6': 'blue', '#EF4444': 'red', '#8B5CF6': 'purple',
  '#10B981': 'green', '#F97316': 'orange', '#6B7280': 'gray',
}

const NAME_COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', red: '#EF4444', purple: '#8B5CF6',
  green: '#10B981', orange: '#F97316', gray: '#6B7280',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function transformCard(c: any): Card {
  return {
    id: c.id,
    listId: c.listId,
    title: c.title,
    description: c.description || '',
    position: c.position,
    labels: (c.cardLabels || []).map((cl: any) => ({
      id: cl.id,
      name: cl.name,
      color: (HEX_COLOR_MAP[cl.color] || 'gray') as Label['color'],
    })),
    assignees: (c.cardAssignees || []).map((ca: any) => {
      const u = ca.user || {}
      return { id: u.id, name: u.name, email: u.email || '', avatar: u.avatar || getInitials(u.name), role: u.role || 'MEMBER' }
    }),
    comments: (c.comments || []).map((cm: any) => ({
      id: cm.id,
      cardId: cm.cardId,
      userId: cm.user?.id || cm.userId,
      userName: cm.user?.name || '',
      userAvatar: cm.user?.avatar || getInitials(cm.user?.name || ''),
      content: cm.content,
      createdAt: cm.createdAt,
    })),
    checklist: c.checklist || [],
    attachments: c.attachments || [],
    startDate: c.startDate || undefined,
    dueDate: c.dueDate || undefined,
    coverColor: c.coverColor || undefined,
    archived: c.archived || false,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    listName: c.list?.title,
    boardId: c.list?.boardId,
  }
}

function transformList(l: any): List {
  return {
    id: l.id,
    boardId: l.boardId,
    title: l.title,
    position: l.position,
    cards: (l.cards || []).map(transformCard),
  }
}

function transformBoard(b: any): Board {
  return {
    id: b.id,
    name: b.name,
    description: b.description || '',
    ownerId: b.ownerId,
    lists: (b.lists || []).map(transformList),
    members: (b.members || []).map((m: any) => {
      const u = m.user || {}
      return { id: u.id, name: u.name, email: u.email || '', avatar: u.avatar || getInitials(u.name), role: u.role || 'MEMBER' }
    }),
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }
}

const actionMap: Record<string, string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  MOVE: 'moved',
}

export function transformActivity(a: any): Activity {
  return {
    id: a.id,
    boardId: a.boardId,
    userId: a.user?.id || a.userId,
    userName: a.user?.name || '',
    userAvatar: a.user?.avatar || '',
    action: actionMap[a.action] || a.action.toLowerCase(),
    entityType: a.entityType.toLowerCase(),
    entityId: a.entityId,
    entityName: a.metadata?.entityName,
    fromListId: a.metadata?.fromListId,
    toListId: a.metadata?.toListId,
    fromListTitle: a.metadata?.fromListTitle,
    toListTitle: a.metadata?.toListTitle,
    content: a.metadata?.content,
    createdAt: a.createdAt,
  }
}

function transformNotification(n: any): Notification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt,
  }
}

export async function fetchBoards(): Promise<{ ok: true; data: Board[] }> {
  const res = await apiClient<any[]>('/api/boards')
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data.map(transformBoard) }
}

export async function fetchBoard(boardId: string): Promise<{ ok: true; data: Board } | { ok: false; error: { code: string; message: string } }> {
  const [boardRes, cardsRes] = await Promise.all([
    apiClient<any>(`/api/boards/${boardId}`),
    apiClient<any[]>(`/api/cards/search?boardId=${boardId}&page=1&limit=100`),
  ])
  if (!boardRes.ok) return { ok: false, error: boardRes.error }

  const board = transformBoard(boardRes.data)
  if (cardsRes.ok) {
    const cards = cardsRes.data.map(transformCard)
    board.lists = board.lists.map((l) => ({
      ...l,
      cards: cards.filter((c) => c.listId === l.id).sort((a, b) => a.position - b.position),
    }))
  }
  return { ok: true, data: board }
}

export async function createBoard(name: string, description?: string, template?: string): Promise<{ ok: true; data: Board }> {
  const res = await apiClient<any>('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
  if (!res.ok) return { ok: true, data: { id: '', name, description, ownerId: '', lists: [], members: [], createdAt: '', updatedAt: '' } }

  const board = transformBoard(res.data)

  if (template && template !== 'Blank') {
    const templateLists: string[] = template === 'Product Roadmap'
      ? ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
      : template === 'Sprint Board'
      ? ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
      : template === 'Project Tracker'
      ? ['Backlog', 'To Do', 'In Progress', 'Testing', 'Done']
      : template === 'Bug Tracker'
      ? ['Reported', 'Triaged', 'In Progress', 'Fixed', 'Verified']
      : []

    for (let i = 0; i < templateLists.length; i++) {
      if (i >= board.lists.length) {
        const listRes = await apiClient<any>('/api/lists', {
          method: 'POST',
          body: JSON.stringify({ boardId: board.id, title: templateLists[i], position: i + 1 }),
        })
        if (listRes.ok) board.lists.push(transformList(listRes.data))
      } else {
        board.lists[i].title = templateLists[i]
      }
    }
  }

  return { ok: true, data: board }
}

export async function updateBoard(boardId: string, data: { name?: string; description?: string }): Promise<{ ok: true; data: Board } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/boards/${boardId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true, data: transformBoard(res.data) }
}

export async function createList(boardId: string, title: string): Promise<{ ok: true; data: List }> {
  const res = await apiClient<any>('/api/lists', {
    method: 'POST',
    body: JSON.stringify({ boardId, title, position: Date.now() }),
  })
  if (!res.ok) return { ok: true, data: { id: `list-${Date.now()}`, boardId, title, position: Date.now(), cards: [] } }
  return { ok: true, data: transformList(res.data) }
}

export async function updateList(listId: string, data: { title?: string; position?: number }): Promise<{ ok: true; data: List } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/lists/${listId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) return { ok: false, error: res.error }
  const b = await fetchBoard(res.data.boardId)
  if (!b.ok) return { ok: true, data: { id: listId, boardId: '', title: '', position: data.position || 0, cards: [] } as List }
  const list = b.data.lists.find((l) => l.id === listId)
  return { ok: true, data: list || { id: listId, boardId: '', title: '', position: data.position || 0, cards: [] } as List }
}

export async function deleteList(listId: string): Promise<{ ok: true }> {
  await apiClient(`/api/lists/${listId}`, { method: 'DELETE' })
  return { ok: true }
}

export async function createCard(listId: string, title: string, description?: string): Promise<{ ok: true; data: Card }> {
  const res = await apiClient<any>('/api/cards', {
    method: 'POST',
    body: JSON.stringify({ listId, title, description, position: Date.now() }),
  })
  if (!res.ok) return { ok: true, data: { id: `card-${Date.now()}`, listId, title, description, position: Date.now(), labels: [], assignees: [], comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }
  return { ok: true, data: transformCard(res.data) }
}

export async function updateCard(cardId: string, data: { title?: string; description?: string; startDate?: string | null; dueDate?: string | null; coverColor?: string | null; archived?: boolean; checklist?: any; attachments?: any }): Promise<{ ok: true; data: Card } | { ok: false; error: { code: string; message: string } }> {
  const body: Record<string, unknown> = { ...data }
  if (data.coverColor === '' || data.coverColor === undefined) body.coverColor = null
  const res = await apiClient<any>(`/api/cards/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true, data: transformCard(res.data) }
}

export async function deleteCard(cardId: string): Promise<{ ok: true }> {
  await apiClient(`/api/cards/${cardId}`, { method: 'DELETE' })
  return { ok: true }
}

export async function toggleLabel(cardId: string, label: Label, add: boolean): Promise<{ ok: true }> {
  if (add) {
    await apiClient(`/api/cards/${cardId}/labels`, {
      method: 'POST',
      body: JSON.stringify({ name: label.name, color: NAME_COLOR_MAP[label.color] || '#3B82F6' }),
    })
  } else {
    await apiClient(`/api/cards/${cardId}/labels/${label.id}`, { method: 'DELETE' })
  }
  return { ok: true }
}

export async function moveCard(cardId: string, fromListId: string, toListId: string, newPosition: number): Promise<{ ok: true; data: { id: string; listId: string; position: number; updatedAt: string } }> {
  await apiClient('/api/cards/move', {
    method: 'POST',
    body: JSON.stringify({ cardId, fromListId, toListId, newPosition }),
  })
  return { ok: true, data: { id: cardId, listId: toListId, position: newPosition, updatedAt: new Date().toISOString() } }
}

export async function addComment(cardId: string, content: string): Promise<{ ok: true; data: Comment }> {
  const res = await apiClient<any>(`/api/cards/${cardId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ cardId, content }),
  })
  if (!res.ok) {
    return {
      ok: true,
      data: {
        id: `comment-${Date.now()}`, cardId, userId: '', userName: '', userAvatar: '',
        content, createdAt: new Date().toISOString(),
      },
    }
  }
  const data = res.data
  return {
    ok: true,
    data: {
      id: data.id,
      cardId: data.cardId,
      userId: data.user?.id || data.userId,
      userName: data.user?.name || '',
      userAvatar: data.user?.avatar || '',
      content: data.content,
      createdAt: data.createdAt,
    },
  }
}

export async function addCardAssignee(cardId: string, member: BoardMember): Promise<{ ok: true }> {
  await apiClient(`/api/cards/${cardId}/assignees`, {
    method: 'POST',
    body: JSON.stringify({ userId: member.id }),
  })
  return { ok: true }
}

export async function removeCardAssignee(cardId: string, memberId: string): Promise<{ ok: true }> {
  await apiClient(`/api/cards/${cardId}/assignees/${memberId}`, { method: 'DELETE' })
  return { ok: true }
}

export async function addBoardMember(boardId: string, member: BoardMember): Promise<{ ok: true; data: Board } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/boards/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify({ name: member.name, email: member.email }),
  })
  if (!res.ok) return { ok: false, error: res.error }
  const board = await fetchBoard(boardId)
  return board
}

export async function removeBoardMember(boardId: string, memberId: string): Promise<{ ok: true; data: Board } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/boards/${boardId}/members/${memberId}`, { method: 'DELETE' })
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true, data: transformBoard(res.data) }
}

export async function deleteBoard(boardId: string): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> {
  return apiClient(`/api/boards/${boardId}`, { method: 'DELETE' })
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem('kanban-token') } catch { return null }
}

export async function uploadAttachment(cardId: string, file: File): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: { code: string; message: string } }> {
  const fd = new FormData()
  fd.append('file', file)
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}/api/cards/${cardId}/attachments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) return { ok: false, error: json?.error || { code: 'HTTP_ERROR', message: 'Upload failed' } }
  return { ok: true, data: json.data }
}

export async function fetchActivities(boardId: string): Promise<{ ok: true; data: Activity[] }> {
  const res = await apiClient<any[]>(`/api/boards/${boardId}/activities`)
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data.map(transformActivity) }
}

export async function fetchMyTasks(assigneeId: string): Promise<{ ok: true; data: Card[] }> {
  const res = await apiClient<any[]>(`/api/cards/search?assigneeId=${assigneeId}&limit=100`)
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data.map(transformCard) }
}

export async function fetchNotifications(): Promise<{ ok: true; data: Notification[] }> {
  const res = await apiClient<Notification[]>('/api/notifications')
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
}

export async function markAllNotificationsAsRead(): Promise<{ ok: true }> {
  const res = await apiClient('/api/notifications/read-all', { method: 'PUT' })
  if (!res.ok) return { ok: true }
  return { ok: true }
}

// Comment functions
export async function updateComment(commentId: string, content: string): Promise<{ ok: true; data: Comment } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
  if (!res.ok) return { ok: false, error: res.error }
  const data = res.data
  return {
    ok: true,
    data: {
      id: data.id,
      cardId: data.cardId,
      userId: data.user?.id || data.userId,
      userName: data.user?.name || '',
      userAvatar: data.user?.avatar || '',
      content: data.content,
      createdAt: data.createdAt,
    },
  }
}

export async function deleteComment(commentId: string): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> {
  return apiClient(`/api/comments/${commentId}`, { method: 'DELETE' })
}

export async function getCommentsByCard(cardId: string, page: number = 1, limit: number = 50): Promise<{ ok: true; data: Comment[] }> {
  const res = await apiClient<any[]>(`/api/comments/card/${cardId}?page=${page}&limit=${limit}`)
  if (!res.ok) return { ok: true, data: [] }
  return {
    ok: true,
    data: (res.data || []).map((cm: any) => ({
      id: cm.id,
      cardId: cm.cardId,
      userId: cm.user?.id || cm.userId,
      userName: cm.user?.name || '',
      userAvatar: cm.user?.avatar || getInitials(cm.user?.name || ''),
      content: cm.content,
      createdAt: cm.createdAt,
    })),
  }
}

// Attachment functions
export async function deleteAttachment(cardId: string, attachmentId: string): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> {
  return apiClient(`/api/cards/${cardId}/attachments/${attachmentId}`, { method: 'DELETE' })
}

// Board member functions
export async function getBoardMembers(boardId: string): Promise<{ ok: true; data: BoardMember[] }> {
  const res = await apiClient<any[]>(`/api/boards/${boardId}/members`)
  if (!res.ok) return { ok: true, data: [] }
  return {
    ok: true,
    data: (res.data || []).map((m: any) => {
      const u = m.user || {}
      return { id: u.id, name: u.name, email: u.email || '', avatar: u.avatar || getInitials(u.name), role: u.role || 'MEMBER' }
    }),
  }
}

export async function updateMemberRole(boardId: string, memberId: string, role: 'MEMBER' | 'ADMIN'): Promise<{ ok: true; data: BoardMember } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/boards/${boardId}/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
  if (!res.ok) return { ok: false, error: res.error }
  const u = res.data.user || {}
  return {
    ok: true,
    data: { id: u.id, name: u.name, email: u.email || '', avatar: u.avatar || getInitials(u.name), role: u.role || 'MEMBER' },
  }
}

// Advanced search functions
export async function searchCards(filters: {
  boardId?: string
  listId?: string
  labels?: string[]
  assigneeId?: string
  archived?: boolean
  dueBefore?: string
  dueAfter?: string
  page?: number
  limit?: number
}): Promise<{ ok: true; data: Card[] }> {
  const params = new URLSearchParams()
  if (filters.boardId) params.append('boardId', filters.boardId)
  if (filters.listId) params.append('listId', filters.listId)
  if (filters.labels?.length) params.append('labels', filters.labels.join(','))
  if (filters.assigneeId) params.append('assigneeId', filters.assigneeId)
  if (filters.archived !== undefined) params.append('archived', String(filters.archived))
  if (filters.dueBefore) params.append('dueBefore', filters.dueBefore)
  if (filters.dueAfter) params.append('dueAfter', filters.dueAfter)
  params.append('page', String(filters.page || 1))
  params.append('limit', String(filters.limit || 100))

  const res = await apiClient<any[]>(`/api/cards/search?${params}`)
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data.map(transformCard) }
}

export async function getListCards(listId: string, page: number = 1, limit: number = 50): Promise<{ ok: true; data: Card[] }> {
  const res = await apiClient<any[]>(`/api/lists/${listId}/cards?page=${page}&limit=${limit}`)
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data.map(transformCard) }
}

export async function searchGlobally(query: string, type?: 'board' | 'list' | 'card' | 'comment', page: number = 1, limit: number = 50): Promise<{ ok: true; data: any[] }> {
  const params = new URLSearchParams()
  params.append('q', query)
  if (type) params.append('type', type)
  params.append('page', String(page))
  params.append('limit', String(limit))

  const res = await apiClient<any[]>(`/api/boards/search?${params}`)
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data }
}

// Webhook functions
export async function getWebhooks(boardId: string): Promise<{ ok: true; data: any[] }> {
  const res = await apiClient<any[]>(`/api/boards/${boardId}/webhooks`)
  if (!res.ok) return { ok: true, data: [] }
  return { ok: true, data: res.data }
}

export async function createWebhook(boardId: string, url: string, events: string[]): Promise<{ ok: true; data: any } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/boards/${boardId}/webhooks`, {
    method: 'POST',
    body: JSON.stringify({ url, events }),
  })
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true, data: res.data }
}

export async function updateWebhook(boardId: string, webhookId: string, data: { url?: string; events?: string[]; active?: boolean }): Promise<{ ok: true; data: any } | { ok: false; error: { code: string; message: string } }> {
  const res = await apiClient<any>(`/api/boards/${boardId}/webhooks/${webhookId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true, data: res.data }
}

export async function deleteWebhook(boardId: string, webhookId: string): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> {
  return apiClient(`/api/boards/${boardId}/webhooks/${webhookId}`, { method: 'DELETE' })
}

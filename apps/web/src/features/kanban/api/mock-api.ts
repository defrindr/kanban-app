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
      return { id: u.id, name: u.name, email: u.email || '', avatar: u.avatar || getInitials(u.name) }
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
      return { id: u.id, name: u.name, email: u.email || '', avatar: u.avatar || getInitials(u.name) }
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

export async function updateCard(cardId: string, data: { title?: string; description?: string; dueDate?: string | null; coverColor?: string | null; archived?: boolean }): Promise<{ ok: true; data: Card } | { ok: false; error: { code: string; message: string } }> {
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

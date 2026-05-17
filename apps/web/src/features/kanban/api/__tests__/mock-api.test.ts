import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchBoards, fetchBoard, createBoard, updateBoard, deleteBoard,
  createList, updateList, deleteList,
  createCard, updateCard, deleteCard, moveCard,
  addComment, toggleLabel,
  addCardAssignee, removeCardAssignee,
  addBoardMember, removeBoardMember,
  uploadAttachment, fetchActivities, fetchNotifications,
} from '../mock-api'
import type { Label, BoardMember } from '../../types/kanban'

const mockApiClient = vi.fn()
vi.mock('@/shared/api/client', () => ({ apiClient: (...args: unknown[]) => mockApiClient(...args) }))

beforeEach(() => {
  vi.clearAllMocks()
})

const BASE_CARD = {
  id: 'c1', listId: 'l1', title: 'Task', description: 'desc',
  position: 1, labels: [], assignees: [], comments: [],
  checklist: [], attachments: [], cardLabels: [], cardAssignees: [],
  archived: false, dueDate: null, coverColor: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
}

const BASE_LIST = {
  id: 'l1', boardId: 'b1', title: 'To Do', position: 1, cards: [],
}

const BASE_BOARD = {
  id: 'b1', name: 'Test Board', description: '', ownerId: 'u1',
  lists: [], members: [{ user: { id: 'u1', name: 'John', email: 'john@test.com' } }],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
}

describe('mock-api', () => {
  describe('fetchBoards', () => {
    it('transforms and returns boards', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: [BASE_BOARD] })
      const result = await fetchBoards()
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data[0].name).toBe('Test Board')
    })

    it('returns empty array on error', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'ERROR', message: 'fail' } })
      const result = await fetchBoards()
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toEqual([])
    })
  })

  describe('fetchBoard', () => {
    it('fetches board and cards', async () => {
      mockApiClient
        .mockResolvedValueOnce({ ok: true, data: BASE_BOARD })
        .mockResolvedValueOnce({ ok: true, data: [] })
      const result = await fetchBoard('b1')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.id).toBe('b1')
    })

    it('returns error when board fails', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'NOT_FOUND', message: 'not found' } })
      const result = await fetchBoard('b1')
      expect(result.ok).toBe(false)
    })
  })

  describe('createBoard', () => {
    it('creates a board without template', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: BASE_BOARD })
      const result = await createBoard('Test Board', 'desc')
      expect(result.ok).toBe(true)
    })

    it('creates a board with template lists', async () => {
      mockApiClient
        .mockResolvedValueOnce({ ok: true, data: { ...BASE_BOARD, lists: [] } })
        .mockResolvedValue({ ok: true, data: BASE_LIST })
      const result = await createBoard('Sprint', '', 'Sprint Board')
      expect(result.ok).toBe(true)
    })

    it('returns fallback on api error', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'ERR', message: 'fail' } })
      const result = await createBoard('Test', '')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.name).toBe('Test')
    })
  })

  describe('updateBoard', () => {
    it('updates board', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: BASE_BOARD })
      const result = await updateBoard('b1', { name: 'New Name' })
      expect(result.ok).toBe(true)
    })

    it('returns error on fail', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'NOT_FOUND', message: 'no' } })
      const result = await updateBoard('b1', { name: 'x' })
      expect(result.ok).toBe(false)
    })
  })

  describe('deleteBoard', () => {
    it('deletes board', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const result = await deleteBoard('b1')
      expect(result.ok).toBe(true)
    })
  })

  describe('list operations', () => {
    it('creates list', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: BASE_LIST })
      const result = await createList('b1', 'To Do')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.title).toBe('To Do')
    })

    it('returns fallback on list create error', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'ERR', message: 'fail' } })
      const result = await createList('b1', 'To Do')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.title).toBe('To Do')
    })

    it('updates list', async () => {
      mockApiClient
        .mockResolvedValueOnce({ ok: true, data: BASE_LIST })
        .mockResolvedValueOnce({ ok: true, data: BASE_BOARD })
        .mockResolvedValueOnce({ ok: true, data: [] })
      const result = await updateList('l1', { title: 'Done' })
      expect(result.ok).toBe(true)
    })

    it('deletes list', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const result = await deleteList('l1')
      expect(result.ok).toBe(true)
    })
  })

  describe('card operations', () => {
    it('creates card', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: { ...BASE_CARD, title: 'New Card' } })
      const result = await createCard('l1', 'New Card')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.title).toBe('New Card')
    })

    it('returns fallback on card create error', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'ERR', message: 'fail' } })
      const result = await createCard('l1', 'New Card')
      expect(result.ok).toBe(true)
    })

    it('updates card', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: { ...BASE_CARD, title: 'Updated' } })
      const result = await updateCard('c1', { title: 'Updated' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.title).toBe('Updated')
    })

    it('deletes card', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const result = await deleteCard('c1')
      expect(result.ok).toBe(true)
    })

    it('moves card', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const result = await moveCard('c1', 'l1', 'l2', 2)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.listId).toBe('l2')
    })
  })

  describe('comment and label operations', () => {
    it('adds comment', async () => {
      mockApiClient.mockResolvedValueOnce({
        ok: true, data: { id: 'cm1', cardId: 'c1', content: 'Nice', userId: 'u1', user: { name: 'John' }, createdAt: '2026-01-01T00:00:00Z' },
      })
      const result = await addComment('c1', 'Nice')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.content).toBe('Nice')
    })

    it('returns fallback comment on error', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'ERR', message: 'fail' } })
      const result = await addComment('c1', 'Nice')
      expect(result.ok).toBe(true)
    })

    it('adds label', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const label: Label = { id: 'lb1', name: 'Bug', color: 'red' }
      const result = await toggleLabel('c1', label, true)
      expect(result.ok).toBe(true)
    })

    it('removes label', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const label: Label = { id: 'lb1', name: 'Bug', color: 'red' }
      const result = await toggleLabel('c1', label, false)
      expect(result.ok).toBe(true)
    })
  })

  describe('assignee operations', () => {
    it('adds card assignee', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const member: BoardMember = { id: 'u2', name: 'Jane', email: 'j@t.com', role: 'MEMBER', avatar: '' }
      const result = await addCardAssignee('c1', member)
      expect(result.ok).toBe(true)
    })

    it('removes card assignee', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: {} })
      const result = await removeCardAssignee('c1', 'u2')
      expect(result.ok).toBe(true)
    })
  })

  describe('board member operations', () => {
    it('adds board member', async () => {
      mockApiClient
        .mockResolvedValueOnce({ ok: true, data: {} })
        .mockResolvedValueOnce({ ok: true, data: BASE_BOARD })
        .mockResolvedValueOnce({ ok: true, data: [] })
      const member: BoardMember = { id: 'u2', name: 'Jane', email: 'j@t.com', role: 'MEMBER', avatar: '' }
      const result = await addBoardMember('b1', member)
      expect(result.ok).toBe(true)
    })

    it('removes board member', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: BASE_BOARD })
      const result = await removeBoardMember('b1', 'u2')
      expect(result.ok).toBe(true)
    })
  })

  describe('upload and activity', () => {
    it('uploads attachment', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true, json: () => Promise.resolve({ data: { id: 'att1' } }),
      })
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      localStorage.setItem('kanban-token', 'tok')
      const result = await uploadAttachment('c1', file)
      expect(result.ok).toBe(true)
      localStorage.removeItem('kanban-token')
    })

    it('fetches activities', async () => {
      mockApiClient.mockResolvedValueOnce({
        ok: true, data: [{ id: 'a1', boardId: 'b1', userId: 'u1', action: 'created', entityType: 'card', entityId: 'c1', createdAt: '2026-01-01T00:00:00Z' }],
      })
      const result = await fetchActivities('b1')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toHaveLength(1)
    })

    it('returns empty activities on error', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: false, error: { code: 'ERR', message: 'fail' } })
      const result = await fetchActivities('b1')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toEqual([])
    })

    it('fetchNotifications returns notifications from api', async () => {
      mockApiClient.mockResolvedValueOnce({ ok: true, data: [] })
      const result = await fetchNotifications()
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toEqual([])
    })
  })
})

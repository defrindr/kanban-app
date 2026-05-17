import { describe, it, expect } from 'vitest'
import {
  fetchBoards,
  fetchBoard,
  createBoard,
  createCard,
  addComment,
  fetchActivities,
  fetchNotifications,
} from '../index'

describe('kanban-api', () => {
  describe('fetchBoards', () => {
    it('returns list of boards', async () => {
      const res = await fetchBoards()
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(Array.isArray(res.data)).toBe(true)
        expect(res.data.length).toBeGreaterThan(0)
        expect(res.data[0]).toHaveProperty('id')
        expect(res.data[0]).toHaveProperty('name')
        expect(res.data[0]).toHaveProperty('lists')
      }
    })
  })

  describe('fetchBoard', () => {
    it('returns board by id', async () => {
      const res = await fetchBoard('board-1')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.id).toBe('board-1')
        expect(res.data.name).toBe('Product Roadmap')
      }
    })

    it('returns error for nonexistent board', async () => {
      const res = await fetchBoard('nonexistent')
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('createBoard', () => {
    it('creates a new board', async () => {
      const res = await createBoard('Test Board', 'A test board')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.name).toBe('Test Board')
        expect(res.data.description).toBe('A test board')
        expect(res.data.id).toContain('board-')
        expect(res.data.lists).toHaveLength(3)
      }
    })

    it('creates board without description', async () => {
      const res = await createBoard('Minimal Board')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.name).toBe('Minimal Board')
        expect(res.data.description).toBeUndefined()
      }
    })
  })

  describe('createCard', () => {
    it('creates a card in the given list', async () => {
      const res = await createCard('list-1', 'New Task')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.title).toBe('New Task')
        expect(res.data.listId).toBe('list-1')
        expect(res.data.comments).toEqual([])
        expect(res.data.labels).toEqual([])
      }
    })

    it('creates card with description', async () => {
      const res = await createCard('list-1', 'Task', 'Details here')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.title).toBe('Task')
        expect(res.data.description).toBe('Details here')
      }
    })
  })

  describe('addComment', () => {
    it('adds a comment to a card', async () => {
      const res = await addComment('card-1', 'Nice work!')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.content).toBe('Nice work!')
        expect(res.data.cardId).toBe('card-1')
        expect(res.data.userName).toBe('John Doe')
      }
    })
  })

  describe('fetchActivities', () => {
    it('returns activities for a board', async () => {
      const res = await fetchActivities('board-1')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(Array.isArray(res.data)).toBe(true)
        expect(res.data.length).toBeGreaterThan(0)
        expect(res.data[0]).toHaveProperty('action')
      }
    })

    it('returns empty array for board with no activities', async () => {
      const res = await fetchActivities('board-999')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data).toEqual([])
      }
    })
  })

  describe('fetchNotifications', () => {
    it('returns notifications', async () => {
      const res = await fetchNotifications()
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(Array.isArray(res.data)).toBe(true)
        expect(res.data.length).toBeGreaterThan(0)
        expect(res.data[0]).toHaveProperty('message')
      }
    })
  })
})

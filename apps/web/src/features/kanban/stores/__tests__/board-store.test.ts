import { describe, it, expect, beforeEach } from 'vitest'
import { useBoardStore } from '../board-store'
import type { Board, List, Card, Comment, Activity, Notification, Label, ChecklistItem, BoardMember } from '../../types/kanban'

function makeBoard(overrides?: Partial<Board>): Board {
  return {
    id: 'b1', name: 'Test Board', description: '', ownerId: 'u1',
    lists: [], members: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeList(overrides?: Partial<List>): List {
  return {
    id: 'l1', boardId: 'b1', title: 'To Do', position: 1, cards: [],
    ...overrides,
  }
}

function makeCard(overrides?: Partial<Card>): Card {
  return {
    id: 'c1', listId: 'l1', title: 'Task 1', description: '', position: 1,
    labels: [], assignees: [], comments: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeComment(overrides?: Partial<Comment>): Comment {
  return {
    id: 'cm1', cardId: 'c1', userId: 'u1', userName: 'John', userAvatar: '',
    content: 'Hello', createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeMember(overrides?: Partial<BoardMember>): BoardMember {
  return { id: 'u2', name: 'Jane', email: 'jane@test.com', avatar: '', ...overrides }
}

function makeActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: 'a1', boardId: 'b1', userId: 'u1', userName: 'John', userAvatar: '',
    action: 'created', entityType: 'card', entityId: 'c1', createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeNotification(overrides?: Partial<Notification>): Notification {
  return {
    id: 'n1', userId: 'u1', type: 'mention', message: 'You were mentioned',
    read: false, createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  useBoardStore.setState({
    boards: [], currentBoard: null, activities: [], notifications: [],
    loading: false, error: null,
  })
})

describe('BoardStore', () => {
  describe('board operations', () => {
    it('sets boards', () => {
      const boards = [makeBoard({ id: 'b1' }), makeBoard({ id: 'b2' })]
      useBoardStore.getState().setBoards(boards)
      expect(useBoardStore.getState().boards).toHaveLength(2)
    })

    it('sets current board', () => {
      const board = makeBoard()
      useBoardStore.getState().setCurrentBoard(board)
      expect(useBoardStore.getState().currentBoard?.id).toBe('b1')
    })

    it('adds a board', () => {
      useBoardStore.getState().addBoard(makeBoard())
      expect(useBoardStore.getState().boards).toHaveLength(1)
    })

    it('updates a board in list and current', () => {
      useBoardStore.getState().setBoards([makeBoard()])
      useBoardStore.getState().setCurrentBoard(makeBoard())
      useBoardStore.getState().updateBoard(makeBoard({ name: 'Updated' }))
      expect(useBoardStore.getState().boards[0].name).toBe('Updated')
      expect(useBoardStore.getState().currentBoard?.name).toBe('Updated')
    })

    it('removes a board', () => {
      useBoardStore.getState().setBoards([makeBoard()])
      useBoardStore.getState().setCurrentBoard(makeBoard())
      useBoardStore.getState().removeBoard('b1')
      expect(useBoardStore.getState().boards).toHaveLength(0)
      expect(useBoardStore.getState().currentBoard).toBeNull()
    })
  })

  describe('list operations', () => {
    it('adds list to current board', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard())
      useBoardStore.getState().addList(makeList())
      expect(useBoardStore.getState().currentBoard?.lists).toHaveLength(1)
    })

    it('updates a list', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList()] }))
      useBoardStore.getState().updateList(makeList({ title: 'Done' }))
      expect(useBoardStore.getState().currentBoard?.lists[0].title).toBe('Done')
    })

    it('removes a list', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList()] }))
      useBoardStore.getState().removeList('l1')
      expect(useBoardStore.getState().currentBoard?.lists).toHaveLength(0)
    })
  })

  describe('card operations', () => {
    it('adds a card', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList()] }))
      useBoardStore.getState().addCard(makeCard())
      expect(useBoardStore.getState().currentBoard?.lists[0].cards).toHaveLength(1)
    })

    it('updates a card', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard()] })] }))
      useBoardStore.getState().updateCard(makeCard({ title: 'Updated Task' }))
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].title).toBe('Updated Task')
    })

    it('moves a card between lists', () => {
      const c1 = makeCard()
      useBoardStore.getState().setCurrentBoard(makeBoard({
        lists: [makeList({ id: 'l1', cards: [c1] }), makeList({ id: 'l2', cards: [] })],
      }))
      useBoardStore.getState().moveCard(c1, 'l1', 'l2', 1)
      const state = useBoardStore.getState()
      expect(state.currentBoard?.lists.find(l => l.id === 'l1')?.cards).toHaveLength(0)
      expect(state.currentBoard?.lists.find(l => l.id === 'l2')?.cards).toHaveLength(1)
      expect(state.currentBoard?.lists.find(l => l.id === 'l2')?.cards[0].listId).toBe('l2')
    })

    it('removes a card', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard()] })] }))
      useBoardStore.getState().removeCard('c1')
      expect(useBoardStore.getState().currentBoard?.lists[0].cards).toHaveLength(0)
    })

    it('does nothing when no current board', () => {
      useBoardStore.getState().addCard(makeCard())
      expect(useBoardStore.getState().currentBoard).toBeNull()
    })
  })

  describe('comment operations', () => {
    it('adds a comment to a card', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard()] })] }))
      useBoardStore.getState().addComment('c1', makeComment())
      const card = useBoardStore.getState().currentBoard?.lists[0].cards[0]
      expect(card?.comments).toHaveLength(1)
      expect(card?.comments[0].content).toBe('Hello')
    })
  })

  describe('label operations', () => {
    it('toggles a label on', () => {
      const label: Label = { id: 'lb1', name: 'Bug', color: 'red' }
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard()] })] }))
      useBoardStore.getState().toggleLabel('c1', label)
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].labels).toHaveLength(1)
    })

    it('toggles a label off', () => {
      const label: Label = { id: 'lb1', name: 'Bug', color: 'red' }
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard({ labels: [label] })] })] }))
      useBoardStore.getState().toggleLabel('c1', label)
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].labels).toHaveLength(0)
    })
  })

  describe('checklist operations', () => {
    it('adds a checklist item', () => {
      const item: ChecklistItem = { id: 'ch1', text: 'Do something', done: false }
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard()] })] }))
      useBoardStore.getState().addChecklistItem('c1', item)
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].checklist).toHaveLength(1)
    })

    it('toggles checklist item', () => {
      const item: ChecklistItem = { id: 'ch1', text: 'Do something', done: false }
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard({ checklist: [item] })] })] }))
      useBoardStore.getState().toggleChecklistItem('c1', 'ch1', true)
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].checklist?.[0].done).toBe(true)
    })
  })

  describe('assignee operations', () => {
    it('adds an assignee', () => {
      const member = makeMember()
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard()] })] }))
      useBoardStore.getState().addAssignee('c1', member)
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].assignees).toHaveLength(1)
    })

    it('removes an assignee', () => {
      const member = makeMember()
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard({ assignees: [member] })] })] }))
      useBoardStore.getState().removeAssignee('c1', 'u2')
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].assignees).toHaveLength(0)
    })

    it('does not duplicate assignee', () => {
      const member = makeMember()
      useBoardStore.getState().setCurrentBoard(makeBoard({ lists: [makeList({ cards: [makeCard({ assignees: [member] })] })] }))
      useBoardStore.getState().addAssignee('c1', member)
      expect(useBoardStore.getState().currentBoard?.lists[0].cards[0].assignees).toHaveLength(1)
    })
  })

  describe('board member operations', () => {
    it('adds board member', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ members: [] }))
      useBoardStore.getState().addBoardMember(makeMember())
      expect(useBoardStore.getState().currentBoard?.members).toHaveLength(1)
    })

    it('removes board member', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ members: [makeMember()] }))
      useBoardStore.getState().removeBoardMember('u2')
      expect(useBoardStore.getState().currentBoard?.members).toHaveLength(0)
    })

    it('does not duplicate board member', () => {
      useBoardStore.getState().setCurrentBoard(makeBoard({ members: [makeMember()] }))
      useBoardStore.getState().addBoardMember(makeMember())
      expect(useBoardStore.getState().currentBoard?.members).toHaveLength(1)
    })
  })

  describe('activity and notification operations', () => {
    it('adds an activity', () => {
      useBoardStore.getState().addActivity(makeActivity())
      expect(useBoardStore.getState().activities).toHaveLength(1)
    })

    it('prepends activities', () => {
      useBoardStore.getState().addActivity(makeActivity())
      useBoardStore.getState().addActivity(makeActivity({ id: 'a2' }))
      expect(useBoardStore.getState().activities[0].id).toBe('a2')
    })

    it('marks notification as read', () => {
      useBoardStore.getState().setNotifications([makeNotification()])
      useBoardStore.getState().markNotificationRead('n1')
      expect(useBoardStore.getState().notifications[0].read).toBe(true)
    })
  })

  describe('loading and error', () => {
    it('sets loading state', () => {
      useBoardStore.getState().setLoading(true)
      expect(useBoardStore.getState().loading).toBe(true)
    })

    it('sets error state', () => {
      useBoardStore.getState().setError('Something broke')
      expect(useBoardStore.getState().error).toBe('Something broke')
    })
  })
})

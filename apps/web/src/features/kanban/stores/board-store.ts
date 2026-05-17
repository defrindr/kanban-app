import { create } from 'zustand'
import type { Board, List, Card, Comment, Activity, Notification, Label, ChecklistItem, BoardMember } from '../types/kanban'

interface BoardStore {
  boards: Board[]
  currentBoard: Board | null
  activities: Activity[]
  notifications: Notification[]
  loading: boolean
  error: string | null

  setBoards: (boards: Board[]) => void
  setCurrentBoard: (board: Board | null) => void
  setActivities: (activities: Activity[]) => void
  setNotifications: (notifications: Notification[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  addBoard: (board: Board) => void
  updateBoard: (board: Board) => void
  removeBoard: (boardId: string) => void

  addList: (list: List) => void
  updateList: (list: List) => void
  removeList: (listId: string) => void

  addCard: (card: Card) => void
  updateCard: (card: Card) => void
  moveCard: (card: Card, fromListId: string, toListId: string, newPosition: number) => void
  removeCard: (cardId: string) => void

  addComment: (cardId: string, comment: Comment) => void
  addActivity: (activity: Activity) => void
  markNotificationRead: (notificationId: string) => void

  toggleLabel: (cardId: string, label: Label) => void
  addChecklistItem: (cardId: string, item: ChecklistItem) => void
  toggleChecklistItem: (cardId: string, itemId: string, done: boolean) => void
  addAssignee: (cardId: string, member: BoardMember) => void
  removeAssignee: (cardId: string, memberId: string) => void
  addBoardMember: (member: BoardMember) => void
  removeBoardMember: (memberId: string) => void
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boards: [],
  currentBoard: null,
  activities: [],
  notifications: [],
  loading: false,
  error: null,

  setBoards: (boards) => set({ boards }),
  setCurrentBoard: (board) => set({ currentBoard: board }),
  setActivities: (activities) => set({ activities }),
  setNotifications: (notifications) => set({ notifications }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addBoard: (board) => set((s) => ({ boards: [...s.boards, board] })),
  updateBoard: (board) => set((s) => ({
    boards: s.boards.map((b) => b.id === board.id ? board : b),
    currentBoard: s.currentBoard?.id === board.id ? board : s.currentBoard,
  })),
  removeBoard: (boardId) => set((s) => ({
    boards: s.boards.filter((b) => b.id !== boardId),
    currentBoard: s.currentBoard?.id === boardId ? null : s.currentBoard,
  })),

  addList: (list) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: [...s.currentBoard.lists, list] } }
  }),
  updateList: (list) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => l.id === list.id ? { ...l, ...list } : l) } }
  }),
  removeList: (listId) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.filter((l) => l.id !== listId) } }
  }),

  addCard: (card) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => l.id === card.listId ? { ...l, cards: [...l.cards, card] } : l) } }
  }),
  updateCard: (card) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.map((c) => c.id === card.id ? { ...c, ...card } : c) })) } }
  }),
  moveCard: (card, fromListId, toListId, newPosition) => set((s) => {
    if (!s.currentBoard) return s
    const lists = s.currentBoard.lists.map((l) => {
      if (l.id === fromListId) return { ...l, cards: l.cards.filter((c) => c.id !== card.id) }
      if (l.id === toListId) {
        const moved = { ...card, listId: toListId, position: newPosition, updatedAt: new Date().toISOString() }
        return { ...l, cards: [...l.cards, moved].sort((a, b) => a.position - b.position) }
      }
      return l
    })
    return { currentBoard: { ...s.currentBoard, lists } }
  }),
  removeCard: (cardId) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) })) } }
  }),

  addComment: (cardId, comment) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.map((c) => c.id === cardId ? { ...c, comments: [...c.comments, comment] } : c) })) } }
  }),

  addActivity: (activity) => set((s) => ({ activities: [activity, ...s.activities] })),
  markNotificationRead: (nid) => set((s) => ({ notifications: s.notifications.map((n) => n.id === nid ? { ...n, read: true } : n) })),

  toggleLabel: (cardId, label) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.map((c) => {
      if (c.id !== cardId) return c
      const exists = c.labels.findIndex((l) => l.id === label.id)
      return exists !== -1 ? { ...c, labels: c.labels.filter((_, i) => i !== exists) } : { ...c, labels: [...c.labels, label] }
    }) })) } }
  }),

  addChecklistItem: (cardId, item) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.map((c) => c.id === cardId ? { ...c, checklist: [...(c.checklist || []), item] } : c) })) } }
  }),

  toggleChecklistItem: (cardId, itemId, done) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.map((c) => c.id === cardId ? { ...c, checklist: (c.checklist || []).map((ci) => ci.id === itemId ? { ...ci, done } : ci) } : c) })) } }
  }),

  addAssignee: (cardId, member) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.map((c) => c.id === cardId ? { ...c, assignees: c.assignees.some(a => a.id === member.id) ? c.assignees : [...c.assignees, member] } : c) })) } }
  }),

  removeAssignee: (cardId, memberId) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => ({ ...l, cards: l.cards.map((c) => c.id === cardId ? { ...c, assignees: c.assignees.filter(a => a.id !== memberId) } : c) })) } }
  }),

  addBoardMember: (member) => set((s) => {
    if (!s.currentBoard) return s
    if (s.currentBoard.members.some(m => m.id === member.id)) return s
    return { currentBoard: { ...s.currentBoard, members: [...s.currentBoard.members, member] } }
  }),

  removeBoardMember: (memberId) => set((s) => {
    if (!s.currentBoard) return s
    return { currentBoard: { ...s.currentBoard, members: s.currentBoard.members.filter(m => m.id !== memberId) } }
  }),
}))
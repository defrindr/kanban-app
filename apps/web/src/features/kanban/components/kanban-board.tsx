'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useBoardStore } from '../stores/board-store'
import { useDarkMode } from '@/shared/hooks/use-dark-mode'
import {
  fetchBoard, createCard, createList, updateList, deleteList,
  updateCard, deleteCard, addComment, toggleLabel as apiToggleLabel,
  fetchActivities, updateBoard, moveCard as apiMoveCard,
  addCardAssignee as apiAddAssignee, removeCardAssignee as apiRemoveAssignee,
  addBoardMember as apiAddBoardMember, removeBoardMember as apiRemoveBoardMember,
  uploadAttachment, deleteBoard as apiDeleteBoard,
} from '../api/mock-api'
import { apiClient } from '@/shared/api/client'
import { KanbanHeader } from './kanban-header'
import { KanbanList } from './kanban-list'
import { CardDetailModal } from './card-detail-modal'
import { RightSidebar } from './right-sidebar'
import { useToast } from '@/shared/hooks/use-toast'
import { connectSocket, joinBoard, leaveBoard, disconnectSocket, getSocket } from '@/shared/api/socket'
import type { Board, Card, Label, BoardMember } from '../types/kanban'

interface Props {
  boardId: string
}

export function KanbanBoard({ boardId }: Props) {
  const { darkMode, setDarkMode } = useDarkMode()
  const {
    currentBoard, activities, notifications,
    setCurrentBoard, setActivities, setNotifications,
    moveCard: storeMoveCard,
    markNotificationRead, removeBoard,
  } = useBoardStore()

  const toast = useToast()
  const router = useRouter()

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const selectedCardRef = useRef<Card | null>(null)
  const [rightTab, setRightTab] = useState<'settings' | 'activity'>('activity')
  const [showRight, setShowRight] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [onlineCount, setOnlineCount] = useState(1)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function updateSelectedCardRef(card: Card | null) {
    selectedCardRef.current = card
    setSelectedCard(card)
  }

  async function refreshBoard() {
    const res = await fetchBoard(boardId)
    if (res.ok) {
      setCurrentBoard(res.data)
      const curr = selectedCardRef.current
      if (curr) {
        for (const l of res.data.lists) {
          const found = l.cards.find(c => c.id === curr.id)
          if (found) { setSelectedCard(found); break }
        }
      }
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetchBoard(boardId)
      if (res.ok) {
        setCurrentBoard(res.data)
        const [actRes] = await Promise.all([
          fetchActivities(boardId),
        ])
        if (actRes.ok) setActivities(actRes.data)
      }
      setLoading(false)
    }
    load()

    const token = localStorage.getItem('kanban-token')
    if (token) {
      const sock = connectSocket(token)
      joinBoard(boardId)

      sock.on('card:created', refreshBoard)
      sock.on('card:updated', refreshBoard)
      sock.on('card:moved', refreshBoard)
      sock.on('card:deleted', refreshBoard)
      sock.on('list:created', refreshBoard)
      sock.on('list:updated', refreshBoard)
      sock.on('list:deleted', refreshBoard)
      sock.on('user:presence', (data: { boardId: string; users: unknown[] }) => {
        if (data.boardId === boardId) setOnlineCount(data.users.length)
      })
    }

    return () => {
      leaveBoard(boardId)
      disconnectSocket()
    }
  }, [boardId, setCurrentBoard, setActivities])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !currentBoard) return
    const activeId = active.id as string
    const overId = over.id as string

    const isListDrag = currentBoard.lists.some((l) => l.id === activeId)
    if (isListDrag) {
      const overList = currentBoard.lists.find((l) => l.id === overId)
      if (!overList || activeId === overId) return

      const sorted = [...currentBoard.lists].sort((a, b) => a.position - b.position)
      const fromIdx = sorted.findIndex((l) => l.id === activeId)
      const toIdx = sorted.findIndex((l) => l.id === overId)
      if (fromIdx === -1 || toIdx === -1) return

      const [moved] = sorted.splice(fromIdx, 1)
      sorted.splice(toIdx, 0, moved)
      const reordered = sorted.map((l, i) => ({ ...l, position: i + 1 }))

      setCurrentBoard({ ...currentBoard, lists: reordered })
      apiClient(`/api/lists/${activeId}`, { method: 'PUT', body: JSON.stringify({ position: reordered.find((l) => l.id === activeId)!.position }) }).then(refreshBoard)
      return
    }

    const activeList = currentBoard.lists.find((l) => l.cards.some((c) => c.id === activeId))
    const overList = currentBoard.lists.find((l) => l.id === overId || l.cards.some((c) => c.id === overId))
    if (!activeList || !overList) return
    const card = activeList.cards.find((c) => c.id === activeId)
    if (!card) return

    const targetCards = activeList.id === overList.id
      ? activeList.cards.filter((c) => c.id !== activeId)
      : overList.cards

    let newPosition: number
    if (overId === overList.id) {
      newPosition = targetCards.length + 1
    } else {
      const overIndex = targetCards.findIndex((c) => c.id === overId)
      newPosition = overIndex === -1 ? targetCards.length + 1 : overIndex + 1
    }

    storeMoveCard(card, activeList.id, overList.id, newPosition)
    apiMoveCard(activeId, activeList.id, overList.id, newPosition).then(refreshBoard)
  }

  const handleUpdateCard = useCallback(async (cardId: string, data: any) => {
    const res = await updateCard(cardId, data)
    if (res.ok) refreshBoard()
  }, [])

  const handleDeleteCard = useCallback(async (cardId: string) => {
    await deleteCard(cardId)
    refreshBoard()
  }, [])

  const handleToggleLabel = useCallback(async (cardId: string, label: Label, add: boolean) => {
    await apiToggleLabel(cardId, label, add)
    refreshBoard()
  }, [])



  async function handleAddCard(listId: string, title: string) {
    const res = await createCard(listId, title)
    if (res.ok) refreshBoard()
  }

  async function handleAddList() {
    if (!currentBoard) return
    const res = await createList(currentBoard.id, 'New List')
    if (res.ok) refreshBoard()
  }

  async function handleRenameList(listId: string, title: string) {
    const res = await updateList(listId, { title })
    if (res.ok) refreshBoard()
  }

  async function handleDeleteList(listId: string) {
    await deleteList(listId)
    refreshBoard()
  }

  async function handleAddComment(cardId: string, content: string) {
    const res = await addComment(cardId, content)
    if (res.ok) refreshBoard()
  }

  async function handleAddAssignee(cardId: string, member: BoardMember) {
    const res = await apiAddAssignee(cardId, member)
    if (res.ok) refreshBoard()
  }

  async function handleRemoveAssignee(cardId: string, memberId: string) {
    const res = await apiRemoveAssignee(cardId, memberId)
    if (res.ok) refreshBoard()
  }

  async function handleAddAttachment(cardId: string, file: File) {
    const res = await uploadAttachment(cardId, file)
    if (res.ok) refreshBoard()
    else toast.error(res.error?.message || 'Failed to upload')
  }

  async function handleUpdateBoard(data: { name?: string; description?: string; visibility?: 'workspace' | 'private' | 'public' }) {
    if (!currentBoard) return
    setCurrentBoard({ ...currentBoard, ...data } as Board)
    const res = await updateBoard(boardId, data)
    if (!res.ok) { refreshBoard(); toast.error(res.error?.message || 'Failed to update board') }
  }

  async function handleDeleteBoard() {
    if (!currentBoard || !confirm('Are you sure you want to delete this board? This action cannot be undone.')) return
    const res = await apiDeleteBoard(currentBoard.id)
    if (res.ok) {
      removeBoard(currentBoard.id)
      toast.success('Board deleted')
      router.push('/dashboard')
    } else toast.error(res.error?.message || 'Failed to delete board')
  }

  async function handleAddBoardMember(member: BoardMember) {
    if (!currentBoard) return
    const res = await apiAddBoardMember(currentBoard.id, member)
    if (res.ok) setCurrentBoard(res.data)
    else toast.error(res.error?.message || 'Failed to add member')
  }

  async function handleRemoveBoardMember(memberId: string) {
    if (!currentBoard) return
    const res = await apiRemoveBoardMember(currentBoard.id, memberId)
    if (res.ok) setCurrentBoard(res.data)
    else toast.error(res.error?.message || 'Failed to remove member')
  }

  // Filter cards based on search
  const filteredLists = currentBoard?.lists.map((list) => {
    const q = searchQuery.toLowerCase().trim()
    return {
      ...list,
      cards: list.cards
        .filter((c) => showArchived ? true : !c.archived)
        .filter((c) => !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.labels.some((l) => l.name.toLowerCase().includes(q))),
    }
  }) ?? []

  if (loading || !currentBoard) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span className="text-sm">Loading board...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0D1117]">
      <KanbanHeader
        boardName={currentBoard.name}
        members={currentBoard.members}
        onlineCount={onlineCount}
        notifications={notifications}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onToggleMenu={() => setShowMobileMenu(!showMobileMenu)}
        onToggleRight={() => setShowRight(!showRight)}
        showRight={showRight}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => { setRightTab('settings'); setShowRight(true) }}
        onMarkRead={markNotificationRead}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(!showArchived)}
      />

      <div className="flex-1 flex overflow-hidden">
        {showMobileMenu && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
            <aside className="relative w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">K</div>
                  <span className="font-semibold text-gray-900 dark:text-white">KanbanPro</span>
                </div>
              </div>
              <nav className="flex-1 p-3 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Boards</div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>{currentBoard.name}</span>
                </div>
              </nav>
            </aside>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-6">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 h-full items-start" style={{ minHeight: 0 }}>
                <SortableContext items={currentBoard.lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
                  {filteredLists.map((list) => (
                    <KanbanList
                      key={list.id}
                      list={list}
                      onAddCard={handleAddCard}
                      onCardClick={(card) => updateSelectedCardRef(card)}
                      onRenameList={handleRenameList}
                      onDeleteList={handleDeleteList}
                      onUpdateCard={handleUpdateCard}
                    />
                  ))}
                </SortableContext>

                {/* Add list button */}
                <div className="w-80 flex-shrink-0">
                  <button
                    onClick={handleAddList}
                    className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add List
                  </button>
                </div>
              </div>
            </DndContext>
          </div>

          <div className="hidden lg:block">
            <RightSidebar activeTab={rightTab} onTabChange={setRightTab} activities={activities} board={currentBoard} onUpdateBoard={handleUpdateBoard} onAddMember={handleAddBoardMember} onRemoveMember={handleRemoveBoardMember} onDeleteBoard={handleDeleteBoard} />
          </div>
        </div>
      </div>

      {showRight && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRight(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl">
            <RightSidebar activeTab={rightTab} onTabChange={setRightTab} activities={activities} board={currentBoard} onUpdateBoard={handleUpdateBoard} onAddMember={handleAddBoardMember} onRemoveMember={handleRemoveBoardMember} onDeleteBoard={handleDeleteBoard} />
          </div>
        </div>
      )}

      <CardDetailModal
        card={selectedCard}
        onClose={() => updateSelectedCardRef(null)}
        onAddComment={handleAddComment}
        onUpdateCard={handleUpdateCard}
        onToggleLabel={handleToggleLabel}
        onDeleteCard={handleDeleteCard}
        onAddAttachment={handleAddAttachment}
        onAddAssignee={handleAddAssignee}
        onRemoveAssignee={handleRemoveAssignee}
        boardMembers={currentBoard.members}
      />
    </div>
  )
}
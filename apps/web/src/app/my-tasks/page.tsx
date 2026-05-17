'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useDarkMode } from '@/shared/hooks/use-dark-mode'
import { fetchMyTasks, fetchBoards, moveCard } from '@/features/kanban/api/mock-api'
import type { Card, Board } from '@/features/kanban/types/kanban'

const labelColorMap: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

function normalizeListName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ')
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'to do':
      return 'M9 12l2 2 4-4'
    case 'in progress':
      return 'M13 10V3L4 14h7v7l9-11h-7z'
    case 'done':
      return 'M5 13l4 4L19 7'
    default:
      return 'M5 13l4 4L19 7'
  }
}

function ProgressChart({ completed, total }: { completed: number; total: number }) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{percentage}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{completed}/{total}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">completed</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    'to do': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', icon: '◯' },
    'in progress': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '◐' },
    'done': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '✓' },
  }
  
  const config = statusConfig[status] || statusConfig['to do']
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {status}
    </span>
  )
}

function OverdueIndicator({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null
  
  const due = new Date(dueDate)
  const now = new Date()
  const isOverdue = due < now
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (isOverdue) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Overdue
      </div>
    )
  }
  
  if (daysLeft <= 3) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Due in {daysLeft}d
      </div>
    )
  }
  
  return null
}

export default function MyTasksPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const { darkMode, setDarkMode } = useDarkMode()
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading && !user) { useAuthStore.getState().checkAuth(); return }
    if (!user) { router.push('/login'); return }

    async function load(userId: string) {
      const [cardRes, boardRes] = await Promise.all([
        fetchMyTasks(userId),
        fetchBoards(),
      ])
      if (cardRes.ok) setCards(cardRes.data.filter(c => !c.archived))
      if (boardRes.ok) setBoards(boardRes.data)
      setLoading(false)
    }
    load(user.id)
  }, [user, authLoading, router])

  const boardNames = new Map<string, string>()
  const listToBoard = new Map<string, string>()
  const boardLists = new Map<string, { id: string; title: string }[]>()
  
  for (const b of boards) {
    boardNames.set(b.id, b.name)
    boardLists.set(b.id, b.lists.map(l => ({ id: l.id, title: l.title })))
    for (const l of b.lists) listToBoard.set(l.id, b.id)
  }

  const getCardBoardId = (c: Card): string => c.boardId || listToBoard.get(c.listId) || 'unknown'
  
  const grouped = new Map<string, Card[]>()
  for (const c of cards) {
    const bid = getCardBoardId(c)
    if (!grouped.has(bid)) grouped.set(bid, [])
    grouped.get(bid)!.push(c)
  }

  const getStatusCounts = (bCards: Card[]): { todo: number; inProgress: number; done: number } => {
    return {
      todo: bCards.filter(c => normalizeListName(c.listName || '') === 'to do').length,
      inProgress: bCards.filter(c => normalizeListName(c.listName || '') === 'in progress').length,
      done: bCards.filter(c => normalizeListName(c.listName || '') === 'done').length,
    }
  }

  const handleMoveCard = async (cardId: string, fromListId: string, toListId: string) => {
    setDropdownOpen(null)
    await moveCard(cardId, fromListId, toListId, Date.now())
    setCards(cards.map(c => 
      c.id === cardId 
        ? { ...c, listId: toListId, listName: boardLists.get(getCardBoardId(cards.find(x => x.id === cardId)!))?.find(l => l.id === toListId)?.title }
        : c
    ))
  }

  // Overall stats
  const totalTasks = cards.length
  const completedTasks = cards.filter(c => normalizeListName(c.listName || '') === 'done').length
  const inProgressTasks = cards.filter(c => normalizeListName(c.listName || '') === 'in progress').length
  const overdueTasks = cards.filter(c => c.dueDate && new Date(c.dueDate) < new Date()).length

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117]">
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h1>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          {darkMode
            ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <span className="text-sm">Loading tasks...</span>
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Tasks</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalTasks}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">In Progress</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{inProgressTasks}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Completed</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{completedTasks}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Overdue</div>
                <div className={`text-3xl font-bold ${overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{overdueTasks}</div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Progress</h2>
              <ProgressChart completed={completedTasks} total={totalTasks} />
            </div>

            {/* Tasks by Board */}
            <div className="space-y-6">
              {Array.from(grouped.entries()).sort().map(([bid, bCards]) => {
                const counts = getStatusCounts(bCards)
                const boardCompleted = counts.done
                const boardTotal = counts.todo + counts.inProgress + counts.done
                
                return (
                  <div key={bid} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Board Header */}
                    <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <Link href={`/board/${bid}`} className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {boardNames.get(bid) || 'Unknown Board'}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                        </Link>
                      </div>
                      
                      {/* Board Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">To Do</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.todo}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">In Progress</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{counts.inProgress}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Done</div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.done}</div>
                        </div>
                      </div>
                      
                      {/* Board Progress */}
                      <ProgressChart completed={boardCompleted} total={boardTotal} />
                    </div>

                    {/* Tasks List */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {bCards.map((c) => {
                        const listName = c.listName || 'Unknown'
                        const availableLists = boardLists.get(bid) || []
                        const cardLink = `/board/${bid}?cardId=${c.id}`
                        
                        return (
                          <Link
                            key={c.id}
                            href={cardLink}
                            className="block group p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                  {c.title}
                                </h3>
                                {c.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {c.labels.map((l) => (
                                      <span key={l.id} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${labelColorMap[l.color] || labelColorMap.gray}`}>
                                        {l.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {c.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {c.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="flex flex-col items-end gap-2">
                                  <div className="relative" onClick={(e) => e.preventDefault()}>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setDropdownOpen(dropdownOpen === c.id ? null : c.id)
                                      }}
                                      className="hover:opacity-80 transition-opacity"
                                    >
                                      <StatusBadge status={listName} />
                                    </button>
                                    {dropdownOpen === c.id && (
                                      <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-max overflow-hidden">
                                        {availableLists.map((list) => (
                                          <button
                                            key={list.id}
                                            onClick={(e) => {
                                              e.preventDefault()
                                              handleMoveCard(c.id, c.listId, list.id)
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                          >
                                            {list.title}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    {c.dueDate && (
                                      <span className={`flex items-center gap-1 ${new Date(c.dueDate) < new Date() ? 'text-red-600 dark:text-red-400' : ''}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12v6m0 0v6m0-6h6m0 0h6m0 0v-6m0 6V6m0 0h-6m0 0H6m0 0v6" /></svg>
                                        {new Date(c.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                    {c.assignees.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V9.5m-8-8v8m0 0h8m-8 0L19 1.5" /></svg>
                                        {c.assignees.length}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <OverdueIndicator dueDate={c.dueDate} />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useDarkMode } from '@/shared/hooks/use-dark-mode'
import { fetchMyTasks, fetchBoards, moveCard } from '@/features/kanban/api/mock-api'
import type { Card, Board } from '@/features/kanban/types/kanban'

const labelColorMap: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

const statusColors: Record<string, string> = {
  todo: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
  'in progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
}

function normalizeListName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ')
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

  // Build maps: boardId->name, listId->boardId, boardId->lists
  const boardNames = new Map<string, string>()
  const listToBoard = new Map<string, string>()
  const boardLists = new Map<string, { id: string; title: string }[]>()
  for (const b of boards) {
    boardNames.set(b.id, b.name)
    boardLists.set(b.id, b.lists.map(l => ({ id: l.id, title: l.title })))
    for (const l of b.lists) listToBoard.set(l.id, b.id)
  }

  // Use boardId from card API response, fallback to listToBoard map
  const getCardBoardId = (c: Card): string => c.boardId || listToBoard.get(c.listId) || 'unknown'
  
  // Group cards by board
  const grouped = new Map<string, Card[]>()
  for (const c of cards) {
    const bid = getCardBoardId(c)
    if (!grouped.has(bid)) grouped.set(bid, [])
    grouped.get(bid)!.push(c)
  }

  // Calculate status counts per board
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h1>
          <span className="text-sm text-gray-400">{cards.length} tasks</span>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          {darkMode
            ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
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
            <p className="text-gray-500 dark:text-gray-400">No tasks assigned to you yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).sort().map(([bid, bCards]) => {
              const counts = getStatusCounts(bCards)
              return (
                <div key={bid}>
                  <div className="flex items-center justify-between mb-4">
                    <Link href={`/board/${bid}`} className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {boardNames.get(bid) || 'Unknown Board'}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </Link>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">To do:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{counts.todo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">In progress:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{counts.inProgress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Done:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{counts.done}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {bCards.map((c) => {
                      const listName = c.listName || 'Unknown'
                      const statusKey = normalizeListName(listName)
                      const availableLists = boardLists.get(bid) || []
                      return (
                        <div key={c.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 hover:border-blue-500/30 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <Link href={`/board/${bid}`} className="block hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{c.title}</h3>
                              </Link>
                              {c.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{c.description}</p>}
                              {c.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {c.labels.map((l) => (
                                    <span key={l.id} className={`text-[11px] font-semibold px-2 py-0.5 rounded ${labelColorMap[l.color] || labelColorMap.gray}`}>{l.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="relative">
                                <button
                                  onClick={() => setDropdownOpen(dropdownOpen === c.id ? null : c.id)}
                                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${statusColors[statusKey] || statusColors.todo}`}
                                >
                                  {listName}
                                </button>
                                {dropdownOpen === c.id && (
                                  <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-max">
                                    {availableLists.map((list) => (
                                      <button
                                        key={list.id}
                                        onClick={() => handleMoveCard(c.id, c.listId, list.id)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                                      >
                                        {list.title}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                {c.dueDate && (
                                  <span className={`flex items-center gap-1 ${new Date(c.dueDate) < new Date() ? 'text-red-500' : ''}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {new Date(c.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                  {c.assignees.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

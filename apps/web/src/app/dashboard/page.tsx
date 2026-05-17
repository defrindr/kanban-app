'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useDarkMode } from '@/shared/hooks/use-dark-mode'
import { fetchBoards, createBoard } from '@/features/kanban/api/mock-api'
import { useBoardStore } from '@/features/kanban/stores/board-store'
import { NewBoardModal } from '@/features/kanban/components/new-board-modal'
import type { Board } from '@/features/kanban/types/kanban'

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const { darkMode, setDarkMode } = useDarkMode()
  const { boards, setBoards, addBoard } = useBoardStore()
  const [loading, setLoading] = useState(true)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [showNewBoard, setShowNewBoard] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (authLoading && !user) { useAuthStore.getState().checkAuth(); return }
    if (!user) { router.push('/login'); return }
    fetchBoards().then((res) => { if (res.ok) setBoards(res.data); setLoading(false) })
  }, [user, authLoading, router, setBoards])

  async function handleCreateBoard(name: string, description: string, template?: string) {
    const res = await createBoard(name, description, template)
    if (res.ok) {
      addBoard(res.data)
      setShowNewBoard(false)
      router.push(`/board/${res.data.id}`)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] flex">
      {mobileMenu && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenu(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">K</div>
            <span className="font-semibold text-gray-900 dark:text-white">KanbanPro</span>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Workspace</div>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Product Workspace
            </button>
            <Link href="/my-tasks" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors mt-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Tasks
            </Link>
          </div>
          {user.role === 'ADMIN' && (
            <div className="mb-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Admin</div>
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Admin Dashboard
              </Link>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Boards</span>
            </div>
            <div className="space-y-0.5">
              {boards.map((board) => (
                <Link key={board.id} href={`/board/${board.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <div className={`w-3 h-3 rounded-full ${board.id === 'board-1' ? 'bg-blue-500' : board.id === 'board-2' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                  <span className="truncate">{board.name}</span>
                </Link>
              ))}
            </div>
            <button onClick={() => setShowNewBoard(true)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full mt-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Board
            </button>
          </div>
        </nav>
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium">{user.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(true)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              {darkMode
                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <div className="relative">
              <button onClick={() => setUserMenu(!userMenu)} className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium hover:ring-2 hover:ring-blue-500 transition-all">{user.avatar}</button>
              {userMenu && <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-20 py-1">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <Link href="/board/board-1" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setUserMenu(false)}>My Boards</Link>
                  <button onClick={() => { setDarkMode(!darkMode) }} className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Toggle Dark Mode</button>
                  <hr className="my-1 border-gray-100 dark:border-gray-700" />
                  <button onClick={() => { useAuthStore.getState().logout(); router.push('/login') }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Sign out</button>
                </div>
              </>}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <span className="text-sm">Loading boards...</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Boards</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{boards.length} boards</span>
                  <button onClick={() => setShowNewBoard(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">+ New Board</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {boards.map((board) => {
                  const totalCards = board.lists.reduce((s, l) => s + l.cards.length, 0)
                  return (
                    <Link key={board.id} href={`/board/${board.id}`} className="group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5 min-h-[180px] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:border-blue-400/20 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${board.id === 'board-1' ? 'bg-blue-500' : board.id === 'board-2' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{board.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{board.description || 'No description'}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{board.lists.length} lists</span>
                        <span>{totalCards} cards</span>
                        <span>{board.members.length} members</span>
                      </div>
                    </Link>
                  )
                })}
                <button onClick={() => setShowNewBoard(true)} className="flex items-center justify-center min-h-[180px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-sm font-medium">New Board</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <NewBoardModal open={showNewBoard} onClose={() => setShowNewBoard(false)} onCreate={handleCreateBoard} />
    </div>
  )
}
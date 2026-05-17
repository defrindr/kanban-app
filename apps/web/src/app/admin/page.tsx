'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useDarkMode } from '@/shared/hooks/use-dark-mode'
import { StatsCards } from '@/features/admin/components/stats-cards'
import { UsersTable } from '@/features/admin/components/users-table'
import { BoardsTable } from '@/features/admin/components/boards-table'
import { ActivityLog } from '@/features/admin/components/activity-log'
import { AnalyticsDashboard } from '@/features/admin/components/analytics-dashboard'
import { fetchAdminStats } from '@/features/admin/api/admin-stats'
import type { AdminStats } from '@/features/admin/types'
import Link from 'next/link'

type Tab = 'overview' | 'analytics' | 'users' | 'boards' | 'activity'

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const { darkMode, setDarkMode } = useDarkMode()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  useEffect(() => {
    if (authLoading && !user) { useAuthStore.getState().checkAuth(); return }
    if (!user) { router.push('/login'); return }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return }
    fetchAdminStats().then(setStats)
  }, [user, authLoading, router])

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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'users', label: 'Users' },
    { key: 'boards', label: 'Boards' },
    { key: 'activity', label: 'Activity Log' },
  ]

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
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Admin</div>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${tab === t.key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {t.label}
            </button>
          ))}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Dashboard
            </Link>
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
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin</h1>
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
                  <Link href="/dashboard" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setUserMenu(false)}>Back to Dashboard</Link>
                  <button onClick={() => { setDarkMode(!darkMode) }} className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Toggle Dark Mode</button>
                  <hr className="my-1 border-gray-100 dark:border-gray-700" />
                  <button onClick={() => { useAuthStore.getState().logout(); router.push('/login') }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Sign out</button>
                </div>
              </>}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {tab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Overview</h2>
              <StatsCards stats={stats} />
            </div>
          )}
          {tab === 'analytics' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Analytics & Insights</h2>
              <AnalyticsDashboard />
            </div>
          )}
          {tab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h2>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
                <UsersTable />
              </div>
            </div>
          )}
          {tab === 'boards' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Boards</h2>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
                <BoardsTable />
              </div>
            </div>
          )}
          {tab === 'activity' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Log</h2>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
                <ActivityLog />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

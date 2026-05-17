'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdminActivities } from '../api/admin-activities'
import type { AdminActivity } from '../types'

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  UPDATE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  DELETE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  MOVE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
}

export function ActivityLog() {
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const load = useCallback(async (p: number) => {
    setLoading(true)
    const res = await fetchAdminActivities({ ...filters, page: p, limit: 20 })
    if (!res) { setLoading(false); return }
    setActivities(res.data)
    setPage(res.meta.page)
    setTotalPages(res.meta.totalPages)
    setLoading(false)
  }, [filters])

  useEffect(() => { load(1) }, [load])

  const entityTypes = ['', 'BOARD', 'LIST', 'CARD', 'COMMENT']
  const actions = ['', 'CREATE', 'UPDATE', 'DELETE', 'MOVE']

  function exportAsJSON() {
    const data = activities.map(a => ({
      id: a.id,
      timestamp: a.createdAt,
      user: a.user.name,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      boardId: a.boardId,
    }))
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `activities-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  }

  function exportAsCSV() {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Board ID']
    const rows = activities.map(a => [
      a.id,
      new Date(a.createdAt).toLocaleString(),
      a.user.name,
      a.action,
      a.entityType,
      a.entityId,
      a.boardId,
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadFile(csv, `activities-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filters.action || ''} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          <option value="">All Actions</option>
          {actions.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filters.entityType || ''} onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          <option value="">All Types</option>
          {entityTypes.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={exportAsJSON} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">Export JSON</button>
          <button onClick={exportAsCSV} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">Export CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-sm text-gray-400 py-4 text-center">No activities found</div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {a.user.avatar || a.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{a.user.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${actionColors[a.action] || 'bg-gray-100 text-gray-600'}`}>{a.action}</span>
                  <span className="text-[10px] font-medium text-gray-400">{a.entityType}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => load(page - 1)} disabled={page <= 1} className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors">Previous</button>
            <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

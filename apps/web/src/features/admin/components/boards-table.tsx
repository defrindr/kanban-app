'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdminBoards, deleteBoard } from '../api/admin-boards'
import type { AdminBoard } from '../types'

export function BoardsTable() {
  const [boards, setBoards] = useState<AdminBoard[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    const res = await fetchAdminBoards(p, 20)
    if (!res) { setError('Failed to load boards'); setLoading(false); return }
    setBoards(res.data || [])
    setTotalPages(res.totalPages)
    setPage(res.page)
    setLoading(false)
  }, [])

  useEffect(() => { load(1) }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Delete this board? All lists, cards, and comments will be permanently removed.')) return
    const ok = await deleteBoard(id)
    if (ok) load(page)
    else setError('Failed to delete board')
  }

  if (loading) return <div className="text-sm text-gray-400 py-4 text-center">Loading boards...</div>
  if (error) return <div className="text-sm text-red-500 py-4 text-center">{error}</div>

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Name</th>
              <th className="pb-3 font-semibold">Lists</th>
              <th className="pb-3 font-semibold">Members</th>
              <th className="pb-3 font-semibold">Created</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr key={b.id} className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="py-3 pr-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{b.name}</div>
                    {b.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{b.description}</div>}
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-500">{b._count.lists}</td>
                <td className="py-3 pr-4 text-gray-500">{b._count.members}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                <td className="py-3 text-right">
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => load(page - 1)} disabled={page <= 1} className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors">Previous</button>
          <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors">Next</button>
        </div>
      </div>
    </div>
  )
}

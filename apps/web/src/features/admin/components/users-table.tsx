'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdminUsers, updateUserRole, deleteUser } from '../api/admin-users'
import type { AdminUser } from '../types'

export function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    const res = await fetchAdminUsers(p, 20)
    if (!res) { setError('Failed to load users'); setLoading(false); return }
    setUsers(res.data || [])
    setTotalPages(res.totalPages)
    setPage(res.page)
    setLoading(false)
  }, [])

  useEffect(() => { load(1) }, [load])

  async function handleRoleChange(userId: string, role: string) {
    const ok = await updateUserRole(userId, role)
    if (ok) load(page)
    else setError('Failed to update role')
  }

  async function handleDelete(userId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    const ok = await deleteUser(userId)
    if (ok) load(page)
    else setError('Failed to delete user')
  }

  if (loading) return <div className="text-sm text-gray-400 py-4 text-center">Loading users...</div>
  if (error) return <div className="text-sm text-red-500 py-4 text-center">{error}</div>

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="pb-3 font-semibold">User</th>
              <th className="pb-3 font-semibold">Email</th>
              <th className="pb-3 font-semibold">Role</th>
              <th className="pb-3 font-semibold">Joined</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {u.avatar || u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                <td className="py-3 pr-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-none cursor-pointer ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-3 text-right">
                  <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium disabled:opacity-30" disabled={false}>Delete</button>
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

import { apiClient } from '@/shared/api/client'
import { camelizeResponse } from '@/shared/api/case-transform'
import type { AdminActivity } from '../types'

type ActivityFilters = Record<string, string | number | undefined>
type ActivityMeta = { total: number; page: number; limit: number; totalPages: number }

export async function fetchAdminActivities(filters: ActivityFilters = {}): Promise<{ data: AdminActivity[]; meta: ActivityMeta } | null> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })

  const token = typeof window !== 'undefined' ? localStorage.getItem('kanban-token') : null
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/activities?${params}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!res.ok) return null
  const json = await res.json()
  const camelized = camelizeResponse<{ ok: boolean; data: AdminActivity[]; meta: ActivityMeta }>(json)
  if (!camelized.ok) return null
  return { data: camelized.data, meta: camelized.meta }
}

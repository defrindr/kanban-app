import { apiClient } from '@/shared/api/client'
import type { AnalyticsData } from '../types'

export async function fetchAnalytics(): Promise<AnalyticsData | null> {
  const res = await apiClient<AnalyticsData>('/api/admin/analytics')
  if (!res.ok) return null
  return res.data
}

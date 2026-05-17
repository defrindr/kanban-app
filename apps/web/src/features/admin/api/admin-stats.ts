import { apiClient } from '@/shared/api/client';
import type { AdminStats } from '../types';

export async function fetchAdminStats(): Promise<AdminStats | null> {
  const res = await apiClient<AdminStats>('/api/admin/stats');
  if (!res.ok) return null;
  return res.data;
}

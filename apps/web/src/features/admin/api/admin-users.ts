import { apiClient } from '@/shared/api/client';
import type { AdminUser, PaginatedResponse } from '../types';

export async function fetchAdminUsers(page = 1, limit = 20): Promise<PaginatedResponse<AdminUser> | null> {
  const res = await apiClient<PaginatedResponse<AdminUser>>(`/api/admin/users?page=${page}&limit=${limit}`);
  if (!res.ok) return null;
  return res.data;
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  const res = await apiClient(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
  return res.ok;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const res = await apiClient(`/api/admin/users/${userId}`, { method: 'DELETE' });
  return res.ok;
}

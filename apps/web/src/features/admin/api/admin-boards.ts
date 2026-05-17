import { apiClient } from '@/shared/api/client';
import type { AdminBoard, PaginatedResponse } from '../types';

export async function fetchAdminBoards(page = 1, limit = 20): Promise<PaginatedResponse<AdminBoard> | null> {
  const res = await apiClient<PaginatedResponse<AdminBoard>>(`/api/admin/boards?page=${page}&limit=${limit}`);
  if (!res.ok) return null;
  return res.data;
}

export async function deleteBoard(boardId: string): Promise<boolean> {
  const res = await apiClient(`/api/admin/boards/${boardId}`, { method: 'DELETE' });
  return res.ok;
}

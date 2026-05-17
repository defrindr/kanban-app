import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../api/client';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const API_URL = 'http://localhost:4000';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('apiClient', () => {
  it('returns parsed success response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { user_id: 'u1' } }),
    });

    const result = await apiClient('/users/me');
    expect(result).toEqual({ ok: true, data: { userId: 'u1' } });
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/users/me`,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('returns error response with backend error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        }),
    });

    const result = await apiClient('/boards');
    expect(result).toEqual({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
    });
  });

  it('returns fallback error when json parsing fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    const result = await apiClient('/boards');
    expect(result).toEqual({
      ok: false,
      error: { code: 'HTTP_ERROR', message: 'Request failed with status 500' },
    });
  });

  it('handles network failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(apiClient('/boards')).rejects.toThrow('Network error');
  });

  it('passes custom headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: null }),
    });

    await apiClient('/boards', {
      headers: { Authorization: 'Bearer token' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/boards`,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      })
    );
  });

  it('camelizes list responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          data: [
            { board_id: 'b1', created_at: '2026-01-01T00:00:00Z' },
            { board_id: 'b2', created_at: '2026-01-02T00:00:00Z' },
          ],
        }),
    });

    const result = await apiClient('/boards');
    expect(result).toEqual({
      ok: true,
      data: [
        { boardId: 'b1', createdAt: '2026-01-01T00:00:00Z' },
        { boardId: 'b2', createdAt: '2026-01-02T00:00:00Z' },
      ],
    });
  });
});

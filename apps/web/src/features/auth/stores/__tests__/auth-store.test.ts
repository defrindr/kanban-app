import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../auth-store'

const mockFetch = vi.fn()
global.fetch = mockFetch

function mockApi(response: unknown, ok = true) {
  mockFetch.mockResolvedValueOnce({ ok, json: () => Promise.resolve(response) })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useAuthStore.setState({ user: null, isLoading: false })
})

describe('AuthStore', () => {
  describe('login', () => {
    it('stores token and sets user on success', async () => {
      mockApi({
        ok: true,
        data: { token: 'abc123', user: { id: 'u1', email: 'a@b.com', name: 'John Doe', avatar: null } },
      })

      const ok = await useAuthStore.getState().login('a@b.com', 'pass')
      expect(ok).toBe(true)
      expect(localStorage.getItem('kanban-token')).toBe('abc123')
      const user = useAuthStore.getState().user
      expect(user?.id).toBe('u1')
      expect(user?.avatar).toBe('JD')
    })

    it('returns false on error', async () => {
      mockApi({ ok: false, error: { code: 'INVALID', message: 'bad' } }, false)

      const ok = await useAuthStore.getState().login('a@b.com', 'wrong')
      expect(ok).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('handles network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(useAuthStore.getState().login('a@b.com', 'pass')).rejects.toThrow()
    })
  })

  describe('register', () => {
    it('stores token and sets user on success', async () => {
      mockApi({
        ok: true,
        data: { token: 'xyz789', user: { id: 'u2', email: 'c@d.com', name: 'Jane Smith', avatar: '/pic.jpg' } },
      })

      const ok = await useAuthStore.getState().register('Jane Smith', 'c@d.com', 'pass')
      expect(ok).toBe(true)
      expect(localStorage.getItem('kanban-token')).toBe('xyz789')
      expect(useAuthStore.getState().user?.avatar).toBe('/pic.jpg')
    })

    it('returns false on error', async () => {
      mockApi({ ok: false, error: { code: 'CONFLICT', message: 'exists' } }, false)

      const ok = await useAuthStore.getState().register('Jane', 'c@d.com', 'pass')
      expect(ok).toBe(false)
    })
  })

  describe('logout', () => {
    it('clears token and user', () => {
      localStorage.setItem('kanban-token', 'abc')
      useAuthStore.setState({ user: { id: 'u1', name: 'John', email: 'a@b.com', avatar: '', role: 'USER' } })

      useAuthStore.getState().logout()
      expect(localStorage.getItem('kanban-token')).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('checkAuth', () => {
    it('sets user when token exists', async () => {
      localStorage.setItem('kanban-token', 'valid')
      mockApi({
        ok: true,
        data: { id: 'u1', email: 'a@b.com', name: 'John Doe', avatar: null },
      })

      await useAuthStore.getState().checkAuth()
      expect(useAuthStore.getState().user?.id).toBe('u1')
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('sets loading false when no token', async () => {
      await useAuthStore.getState().checkAuth()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('sets loading false on error', async () => {
      localStorage.setItem('kanban-token', 'expired')
      mockApi({ ok: false, error: { code: 'UNAUTHORIZED', message: 'bad' } }, false)

      await useAuthStore.getState().checkAuth()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('loginWithGoogle', () => {
    it('returns false after timeout', async () => {
      const ok = await useAuthStore.getState().loginWithGoogle()
      expect(ok).toBe(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})

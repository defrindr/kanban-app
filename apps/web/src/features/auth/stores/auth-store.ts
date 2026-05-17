import { create } from 'zustand';
import { apiClient } from '@/shared/api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

function storeToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kanban-token', token);
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('kanban-token');
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  checkAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    const res = await apiClient<{ id: string; email: string; name: string; avatar: string | null; role: string }>(
      '/api/auth/me'
    );
    if (res.ok) {
      set({
        user: {
          ...res.data,
          avatar:
            res.data.avatar ||
            res.data.name
              .split(' ')
              .map((n: string) => n[0])
              .join(''),
          role: res.data.role || 'USER',
        },
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const res = await apiClient<{
      token: string;
      user: { id: string; email: string; name: string; avatar: string | null; role: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      storeToken(res.data.token);
      set({
        user: {
          ...res.data.user,
          avatar:
            res.data.user.avatar ||
            res.data.user.name
              .split(' ')
              .map((n) => n[0])
              .join(''),
        },
        isLoading: false,
      });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1000));
    set({ isLoading: false });
    return false;
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    const res = await apiClient<{
      token: string;
      user: { id: string; email: string; name: string; avatar: string | null; role: string };
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
    if (res.ok) {
      storeToken(res.data.token);
      set({
        user: {
          ...res.data.user,
          avatar:
            res.data.user.avatar ||
            res.data.user.name
              .split(' ')
              .map((n) => n[0])
              .join(''),
        },
        isLoading: false,
      });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kanban-token');
    }
    set({ user: null });
  },
}));

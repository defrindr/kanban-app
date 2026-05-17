import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '../use-dark-mode'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useDarkMode', () => {
  it('defaults to light mode when no preference', () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.darkMode).toBe(false)
  })

  it('reads saved preference from localStorage', () => {
    localStorage.setItem('kanban-dark-mode', 'true')
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.darkMode).toBe(true)
  })

  it('reads system dark preference', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.darkMode).toBe(true)
  })

  it('toggles dark mode', () => {
    const { result } = renderHook(() => useDarkMode())
    act(() => result.current.setDarkMode(true))
    expect(result.current.darkMode).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('kanban-dark-mode')).toBe('true')
  })

  it('toggles back to light mode', () => {
    localStorage.setItem('kanban-dark-mode', 'true')
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useDarkMode())
    act(() => result.current.setDarkMode(false))
    expect(result.current.darkMode).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

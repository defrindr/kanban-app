import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useToastStore, useToast } from '../use-toast'

beforeEach(() => {
  vi.useFakeTimers()
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToastStore', () => {
  it('starts empty', () => {
    expect(useToastStore.getState().toasts).toEqual([])
  })

  it('adds a toast', () => {
    useToastStore.getState().addToast('success', 'Done!')
    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Done!')
  })

  it('removes toast by id', () => {
    useToastStore.getState().addToast('error', 'Oops')
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().removeToast(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('auto-dismisses after 4 seconds', () => {
    useToastStore.getState().addToast('info', 'Auto dismiss')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(4000)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('handles multiple toasts', () => {
    useToastStore.getState().addToast('success', 'First')
    useToastStore.getState().addToast('error', 'Second')
    expect(useToastStore.getState().toasts).toHaveLength(2)
  })
})

describe('useToast hook', () => {
  it('exposes success, error, info functions', () => {
    const addToast = vi.spyOn(useToastStore.getState(), 'addToast')
    const { result } = renderHook(() => useToast())
    result.current.success('Works')
    expect(addToast).toHaveBeenCalledWith('success', 'Works')
    result.current.error('Fail')
    expect(addToast).toHaveBeenCalledWith('error', 'Fail')
    result.current.info('Heads up')
    expect(addToast).toHaveBeenCalledWith('info', 'Heads up')
  })
})

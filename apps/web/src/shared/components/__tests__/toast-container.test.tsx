import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastContainer } from '../toast-container'
import { useToastStore } from '@/shared/hooks/use-toast'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('ToastContainer', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders toasts', () => {
    useToastStore.getState().addToast('success', 'Saved!')
    render(<ToastContainer />)
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('renders multiple toasts', () => {
    useToastStore.getState().addToast('success', 'First')
    useToastStore.getState().addToast('error', 'Second')
    render(<ToastContainer />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('removes toast on dismiss click', () => {
    useToastStore.getState().addToast('info', 'Dismiss me')
    render(<ToastContainer />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
  })
})

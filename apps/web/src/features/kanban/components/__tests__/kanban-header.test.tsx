import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KanbanHeader } from '../kanban-header'
import type { BoardMember, Notification } from '../../types/kanban'

const base = {
  boardName: 'Test Board', members: [] as BoardMember[], onlineCount: 0,
  notifications: [] as Notification[], darkMode: false,
  onToggleDarkMode: vi.fn(), onToggleMenu: vi.fn(), onToggleRight: vi.fn(),
  showRight: false, searchQuery: '', onSearchChange: vi.fn(),
  onOpenSettings: vi.fn(), onMarkRead: vi.fn(), showArchived: false, onToggleArchived: vi.fn(),
}

describe('KanbanHeader', () => {
  it('renders board name', () => {
    render(<KanbanHeader {...base} />)
    expect(screen.getByText('Test Board')).toBeInTheDocument()
  })

  it('renders member avatar', () => {
    render(<KanbanHeader {...base} members={[{ id: 'u1', name: 'John', email: 'j@t.com', avatar: 'JD' }]} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows +N for extra members', () => {
    render(<KanbanHeader {...base} members={Array.from({ length: 5 }, (_, i) => ({ id: `u${i}`, name: `U${i}`, email: `${i}@t.com`, avatar: `U${i}` }))} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('shows online count', () => {
    render(<KanbanHeader {...base} onlineCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onSearchChange', () => {
    const fn = vi.fn()
    render(<KanbanHeader {...base} onSearchChange={fn} />)
    fireEvent.change(screen.getByPlaceholderText('Search cards...'), { target: { value: 'x' } })
    expect(fn).toHaveBeenCalledWith('x')
  })

  it('shows clear search button', () => {
    const fn = vi.fn()
    render(<KanbanHeader {...base} searchQuery="test" onSearchChange={fn} />)
    const buttons = screen.getAllByRole('button')
    for (const b of buttons) {
      if (b.querySelector('svg path[d*="M6 18L18 6"]')) { fireEvent.click(b); break }
    }
    expect(fn).toHaveBeenCalledWith('')
  })

  it('toggles archived', () => {
    const fn = vi.fn()
    render(<KanbanHeader {...base} onToggleArchived={fn} />)
    const btn = screen.getByTitle('Show archived')
    fireEvent.click(btn)
    expect(fn).toHaveBeenCalled()
  })

  it('shows hide archived title', () => {
    render(<KanbanHeader {...base} showArchived={true} />)
    expect(screen.getByTitle('Hide archived')).toBeInTheDocument()
  })

  it('calls onOpenSettings', () => {
    const fn = vi.fn()
    render(<KanbanHeader {...base} onOpenSettings={fn} />)
    const btn = screen.getByTitle('Board Settings')
    fireEvent.click(btn)
    expect(fn).toHaveBeenCalled()
  })

  it('shows notification unread count', () => {
    const notifs: Notification[] = [
      { id: 'n1', userId: 'u1', type: 'mention', message: 'Hi', read: false, createdAt: '2026-01-01T00:00:00Z' },
    ]
    render(<KanbanHeader {...base} notifications={notifs} />)
    const notifBtns = screen.getAllByRole('button')
    for (const b of notifBtns) {
      if (b.querySelector('svg path[d*="14.857"]')) { fireEvent.click(b); break }
    }
    expect(screen.getByText('1 unread')).toBeInTheDocument()
  })

  it('shows empty notification state', () => {
    render(<KanbanHeader {...base} />)
    const notifBtns = screen.getAllByRole('button')
    for (const b of notifBtns) {
      if (b.querySelector('svg path[d*="14.857"]')) { fireEvent.click(b); break }
    }
    expect(screen.getByText('No notifications yet')).toBeInTheDocument()
  })

  it('calls onMarkRead', () => {
    const fn = vi.fn()
    const notifs: Notification[] = [
      { id: 'n1', userId: 'u1', type: 'mention', message: 'Test', read: false, createdAt: '2026-01-01T00:00:00Z' },
    ]
    render(<KanbanHeader {...base} notifications={notifs} onMarkRead={fn} />)
    const notifBtns = screen.getAllByRole('button')
    for (const b of notifBtns) {
      if (b.querySelector('svg path[d*="14.857"]')) { fireEvent.click(b); break }
    }
    fireEvent.click(screen.getByText('Mark read'))
    expect(fn).toHaveBeenCalledWith('n1')
  })
})

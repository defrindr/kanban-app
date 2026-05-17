import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RightSidebar } from '../right-sidebar'
import type { Activity, Board, BoardMember } from '../../types/kanban'

const baseBoard: Board = {
  id: 'b1', name: 'Test Board', description: 'A description', ownerId: 'u1',
  visibility: 'workspace', lists: [], members: [
    { id: 'u1', name: 'John', email: 'john@test.com', avatar: 'JD' },
  ],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
}

function makeActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: 'a1', boardId: 'b1', userId: 'u1', userName: 'John', userAvatar: '',
    action: 'created', entityType: 'card', entityId: 'c1', entityName: 'Task 1',
    createdAt: '2026-01-01T00:00:00Z', ...overrides,
  }
}

const baseProps = {
  activeTab: 'activity' as const,
  onTabChange: vi.fn(),
  activities: [] as Activity[],
  board: baseBoard,
  onUpdateBoard: vi.fn(),
  onAddMember: vi.fn(),
  onRemoveMember: vi.fn(),
  onDeleteBoard: vi.fn(),
}

describe('RightSidebar', () => {
  it('renders activity tab by default', () => {
    render(<RightSidebar {...baseProps} />)
    expect(screen.getByText('Activity')).toBeInTheDocument()
  })

  it('shows empty activity state', () => {
    render(<RightSidebar {...baseProps} />)
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('renders activities', () => {
    render(<RightSidebar {...baseProps} activities={[makeActivity()]} />)
    expect(screen.getByText(/Task 1/)).toBeInTheDocument()
  })

  it('renders multiple activities', () => {
    render(<RightSidebar {...baseProps} activities={[makeActivity(), makeActivity({ id: 'a2', entityName: 'Task 2' })]} />)
    expect(screen.getByText(/Task 1/)).toBeInTheDocument()
    expect(screen.getByText(/Task 2/)).toBeInTheDocument()
  })

  it('switches to settings tab', () => {
    const onTabChange = vi.fn()
    render(<RightSidebar {...baseProps} onTabChange={onTabChange} />)
    fireEvent.click(screen.getByText('Board Settings'))
    expect(onTabChange).toHaveBeenCalledWith('settings')
  })

  it('renders board settings', () => {
    render(<RightSidebar {...baseProps} activeTab="settings" />)
    expect(screen.getByDisplayValue('Test Board')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A description')).toBeInTheDocument()
  })

  it('calls onUpdateBoard when saving settings', () => {
    const onUpdateBoard = vi.fn()
    render(<RightSidebar {...baseProps} activeTab="settings" onUpdateBoard={onUpdateBoard} />)
    fireEvent.change(screen.getByDisplayValue('Test Board'), { target: { value: 'Renamed' } })
    fireEvent.click(screen.getByText('Save Changes'))
    expect(onUpdateBoard).toHaveBeenCalledWith(expect.objectContaining({ name: 'Renamed' }))
  })

  it('shows member list', () => {
    render(<RightSidebar {...baseProps} activeTab="settings" />)
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('shows member count', () => {
    render(<RightSidebar {...baseProps} activeTab="settings" />)
    expect(screen.getByText('Members (1)')).toBeInTheDocument()
  })

  it('calls onAddMember', () => {
    const onAddMember = vi.fn()
    render(<RightSidebar {...baseProps} activeTab="settings" onAddMember={onAddMember} />)
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'jane@test.com' } })
    fireEvent.click(screen.getByText('Add Member'))
    expect(onAddMember).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane', email: 'jane@test.com' }))
  })

  it('does not call onAddMember with empty fields', () => {
    const onAddMember = vi.fn()
    render(<RightSidebar {...baseProps} activeTab="settings" onAddMember={onAddMember} />)
    fireEvent.click(screen.getByText('Add Member'))
    expect(onAddMember).not.toHaveBeenCalled()
  })

  it('calls onDeleteBoard', () => {
    const onDeleteBoard = vi.fn()
    render(<RightSidebar {...baseProps} activeTab="settings" onDeleteBoard={onDeleteBoard} />)
    fireEvent.click(screen.getByText('Delete Board'))
    expect(onDeleteBoard).toHaveBeenCalled()
  })

  it('shows visibility select', () => {
    render(<RightSidebar {...baseProps} activeTab="settings" />)
    expect(screen.getByDisplayValue('Workspace visible')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KanbanCard } from '../kanban-card'
import type { Card } from '../../types/kanban'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    setNodeRef: vi.fn(),
    attributes: {},
    listeners: {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

function makeCard(overrides?: Partial<Card>): Card {
  return {
    id: 'c1', listId: 'l1', title: 'Test Card', description: 'A description',
    position: 1, labels: [], assignees: [], comments: [],
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('KanbanCard', () => {
  it('renders card title', () => {
    render(<KanbanCard card={makeCard()} onClick={vi.fn()} />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<KanbanCard card={makeCard()} onClick={onClick} />)
    fireEvent.click(screen.getByText('Test Card'))
    expect(onClick).toHaveBeenCalled()
  })

  it('renders labels', () => {
    const card = makeCard({ labels: [{ id: 'lb1', name: 'Bug', color: 'red' }] })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText('Bug')).toBeInTheDocument()
  })

  it('renders multiple labels', () => {
    const card = makeCard({
      labels: [
        { id: 'lb1', name: 'Bug', color: 'red' },
        { id: 'lb2', name: 'Frontend', color: 'blue' },
      ],
    })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText('Bug')).toBeInTheDocument()
    expect(screen.getByText('Frontend')).toBeInTheDocument()
  })

  it('renders due date', () => {
    const card = makeCard({ dueDate: '2026-06-01T00:00:00Z' })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText(/Jun 1/)).toBeInTheDocument()
  })

  it('shows overdue indicator', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    const card = makeCard({ dueDate: past })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText(/Overdue/)).toBeInTheDocument()
  })

  it('shows comment count', () => {
    const card = makeCard({ comments: [{ id: 'cm1', cardId: 'c1', userId: 'u1', userName: 'John', content: 'Hi', createdAt: '2026-01-01T00:00:00Z' }] })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows checklist progress', () => {
    const card = makeCard({ checklist: [{ id: 'ch1', text: 'x', done: true }, { id: 'ch2', text: 'y', done: false }] })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('shows full progress in green', () => {
    const card = makeCard({ checklist: [{ id: 'ch1', text: 'x', done: true }] })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText('1/1')).toBeInTheDocument()
  })

  it('shows attachment count', () => {
    const card = makeCard({ attachments: [{ id: 'att1', name: 'file.pdf', url: '/u/file.pdf', type: 'pdf', createdAt: '2026-01-01T00:00:00Z' }] })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders assignee avatars', () => {
    const card = makeCard({ assignees: [{ id: 'u2', name: 'Jane', email: 'j@t.com', avatar: 'JD' }] })
    render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows cover color bar', () => {
    const card = makeCard({ coverColor: 'blue' })
    const { container } = render(<KanbanCard card={card} onClick={vi.fn()} />)
    expect(container.querySelector('.h-2')).toBeInTheDocument()
  })

  it('allows inline title edit on double click', () => {
    const onUpdate = vi.fn()
    render(<KanbanCard card={makeCard({ title: 'Original' })} onClick={vi.fn()} onUpdate={onUpdate} />)
    fireEvent.doubleClick(screen.getByText('Original'))
    const input = screen.getByDisplayValue('Original')
    fireEvent.change(input, { target: { value: 'Edited' } })
    fireEvent.blur(input)
    expect(onUpdate).toHaveBeenCalledWith('c1', { title: 'Edited' })
  })

  it('does not call onUpdate when title unchanged', () => {
    const onUpdate = vi.fn()
    render(<KanbanCard card={makeCard({ title: 'Same' })} onClick={vi.fn()} onUpdate={onUpdate} />)
    fireEvent.doubleClick(screen.getByText('Same'))
    fireEvent.blur(screen.getByDisplayValue('Same'))
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

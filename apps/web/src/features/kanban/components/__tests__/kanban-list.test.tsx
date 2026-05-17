import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KanbanList } from '../kanban-list'
import type { Card, List } from '../../types/kanban'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    setNodeRef: vi.fn(),
    attributes: {},
    listeners: {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: any) => children,
  verticalListSortingStrategy: {},
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

vi.mock('../kanban-card', () => ({
  KanbanCard: ({ card, onClick }: any) => <div data-testid="kanban-card" onClick={onClick}>{card.title}</div>,
}))

function makeCard(overrides?: Partial<Card>): Card {
  return {
    id: 'c1', listId: 'l1', title: 'Test Card', description: '',
    position: 1, labels: [], assignees: [], comments: [],
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeList(overrides?: Partial<List>): List {
  return {
    id: 'l1', boardId: 'b1', title: 'To Do', position: 1, cards: [],
    ...overrides,
  }
}

describe('KanbanList', () => {
  it('renders list title', () => {
    render(<KanbanList list={makeList()} onAddCard={vi.fn()} onCardClick={vi.fn()} />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('shows card count', () => {
    const list = makeList({ cards: [makeCard(), makeCard({ id: 'c2', title: 'Task 2' })] })
    render(<KanbanList list={list} onAddCard={vi.fn()} onCardClick={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders cards', () => {
    const list = makeList({ cards: [makeCard()] })
    render(<KanbanList list={list} onAddCard={vi.fn()} onCardClick={vi.fn()} />)
    expect(screen.getByTestId('kanban-card')).toBeInTheDocument()
  })

  it('shows add card input on button click', () => {
    render(<KanbanList list={makeList()} onAddCard={vi.fn()} onCardClick={vi.fn()} />)
    fireEvent.click(screen.getByText('Add card'))
    expect(screen.getByPlaceholderText('Enter card title...')).toBeInTheDocument()
  })

  it('calls onAddCard with title', () => {
    const onAddCard = vi.fn()
    render(<KanbanList list={makeList()} onAddCard={onAddCard} onCardClick={vi.fn()} />)
    fireEvent.click(screen.getByText('Add card'))
    fireEvent.change(screen.getByPlaceholderText('Enter card title...'), { target: { value: 'New Task' } })
    fireEvent.click(screen.getByText('Add'))
    expect(onAddCard).toHaveBeenCalledWith('l1', 'New Task')
  })

  it('does not add empty card', () => {
    const onAddCard = vi.fn()
    render(<KanbanList list={makeList()} onAddCard={onAddCard} onCardClick={vi.fn()} />)
    fireEvent.click(screen.getByText('Add card'))
    fireEvent.click(screen.getByText('Add'))
    expect(onAddCard).not.toHaveBeenCalled()
  })

  it('calls onCardClick when card clicked', () => {
    const onCardClick = vi.fn()
    const list = makeList({ cards: [makeCard()] })
    render(<KanbanList list={list} onAddCard={vi.fn()} onCardClick={onCardClick} />)
    fireEvent.click(screen.getByText('Test Card'))
    expect(onCardClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }))
  })

  it('shows list menu button', () => {
    render(<KanbanList list={makeList()} onAddCard={vi.fn()} onCardClick={vi.fn()} />)
    const menuBtn = screen.getAllByRole('button')[0]
    fireEvent.click(menuBtn)
    expect(screen.getByText('Rename')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onDeleteList from menu', () => {
    const onDeleteList = vi.fn()
    render(<KanbanList list={makeList()} onAddCard={vi.fn()} onCardClick={vi.fn()} onDeleteList={onDeleteList} />)
    const menuBtn = screen.getAllByRole('button')[0]
    fireEvent.click(menuBtn)
    fireEvent.click(screen.getByText('Delete'))
    expect(onDeleteList).toHaveBeenCalledWith('l1')
  })

  it('cancels card adding', () => {
    render(<KanbanList list={makeList()} onAddCard={vi.fn()} onCardClick={vi.fn()} />)
    fireEvent.click(screen.getByText('Add card'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText('Enter card title...')).not.toBeInTheDocument()
  })

  it('renames list on double click title', () => {
    const onRenameList = vi.fn()
    render(<KanbanList list={makeList()} onAddCard={vi.fn()} onCardClick={vi.fn()} onRenameList={onRenameList} />)
    fireEvent.doubleClick(screen.getByText('To Do'))
    const input = screen.getByDisplayValue('To Do')
    fireEvent.change(input, { target: { value: 'Done' } })
    fireEvent.blur(input)
    expect(onRenameList).toHaveBeenCalledWith('l1', 'Done')
  })

  it('cancels rename when same title', () => {
    const onRenameList = vi.fn()
    render(<KanbanList list={makeList()} onAddCard={vi.fn()} onCardClick={vi.fn()} onRenameList={onRenameList} />)
    fireEvent.doubleClick(screen.getByText('To Do'))
    fireEvent.blur(screen.getByDisplayValue('To Do'))
    expect(onRenameList).not.toHaveBeenCalled()
  })
})

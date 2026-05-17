import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardDetailModal } from '../card-detail-modal';
import type { Card, BoardMember, Activity } from '../../types/kanban';

function makeCard(overrides?: Partial<Card>): Card {
  return {
    id: 'c1',
    listId: 'l1',
    title: 'Test Card',
    description: 'A description',
    position: 1,
    labels: [],
    assignees: [],
    comments: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const baseProps = {
  card: makeCard(),
  onClose: vi.fn(),
  onAddComment: vi.fn(),
  onUpdateCard: vi.fn(),
  onToggleLabel: vi.fn(),
  onDeleteCard: vi.fn(),
  onAddAttachment: vi.fn(),
  onAddAssignee: vi.fn(),
  onRemoveAssignee: vi.fn(),
  boardMembers: [] as BoardMember[],
};

describe('CardDetailModal', () => {
  it('renders nothing when card is null', () => {
    const { container } = render(<CardDetailModal {...baseProps} card={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders card title', () => {
    render(<CardDetailModal {...baseProps} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders card description', () => {
    render(<CardDetailModal {...baseProps} />);
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('shows placeholder for missing description', () => {
    render(<CardDetailModal {...baseProps} card={makeCard({ description: '' })} />);
    expect(screen.getByText('Add a more detailed description...')).toBeInTheDocument();
  });

  it('renders labels', () => {
    const card = makeCard({ labels: [{ id: 'lb1', name: 'Bug', color: 'red' }] });
    render(<CardDetailModal {...baseProps} card={card} />);
    expect(screen.getAllByText('Bug').length).toBeGreaterThan(0);
  });

  it('shows no labels state', () => {
    render(<CardDetailModal {...baseProps} card={makeCard({ labels: [] })} />);
    expect(screen.getByText('No labels')).toBeInTheDocument();
  });

  it('shows label picker on edit', () => {
    render(<CardDetailModal {...baseProps} />);
    fireEvent.click(screen.getAllByText('Edit')[1]);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('calls onToggleLabel from picker', () => {
    const onToggleLabel = vi.fn();
    render(<CardDetailModal {...baseProps} onToggleLabel={onToggleLabel} />);
    fireEvent.click(screen.getAllByText('Edit')[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Bug' }));
    expect(onToggleLabel).toHaveBeenCalledWith('c1', { id: 'Bug', name: 'Bug', color: 'red' }, true);
  });

  it('calls onAddComment', () => {
    const onAddComment = vi.fn();
    render(<CardDetailModal {...baseProps} onAddComment={onAddComment} />);
    const textarea = screen.getByPlaceholderText('Write a comment...');
    fireEvent.change(textarea, { target: { value: 'Nice work' } });
    fireEvent.click(screen.getByText('Comment'));
    expect(onAddComment).toHaveBeenCalledWith('c1', 'Nice work');
  });

  it('disables comment button when empty', () => {
    render(<CardDetailModal {...baseProps} onAddComment={vi.fn()} />);
    expect(screen.getByText('Comment')).toBeDisabled();
  });

  it('renders existing comments', () => {
    const card = makeCard({
      comments: [
        {
          id: 'cm1',
          cardId: 'c1',
          userId: 'u1',
          userName: 'John',
          content: 'Great!',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
    });
    render(<CardDetailModal {...baseProps} card={card} />);
    expect(screen.getByText('Great!')).toBeInTheDocument();
  });

  it('shows no comments state', () => {
    render(<CardDetailModal {...baseProps} />);
    expect(screen.getByText('No comments yet')).toBeInTheDocument();
  });

  it('renders assignees', () => {
    const card = makeCard({ assignees: [{ id: 'u2', name: 'Jane', email: 'j@t.com', role: 'MEMBER', avatar: 'JD' }] });
    render(<CardDetailModal {...baseProps} card={card} />);
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('shows no assignees state', () => {
    render(<CardDetailModal {...baseProps} card={makeCard({ assignees: [] })} />);
    expect(screen.getByText('No assignees')).toBeInTheDocument();
  });

  it('allows editing title', () => {
    const onUpdateCard = vi.fn();
    render(<CardDetailModal {...baseProps} onUpdateCard={onUpdateCard} />);
    fireEvent.click(screen.getByText('Test Card'));
    const input = screen.getByDisplayValue('Test Card');
    fireEvent.change(input, { target: { value: 'Updated Title' } });
    fireEvent.blur(input);
    expect(onUpdateCard).toHaveBeenCalledWith('c1', { title: 'Updated Title' });
  });

  it('allows editing description', () => {
    const onUpdateCard = vi.fn();
    render(<CardDetailModal {...baseProps} onUpdateCard={onUpdateCard} />);
    fireEvent.click(screen.getByText('A description'));
    const textarea = screen.getByDisplayValue('A description');
    fireEvent.change(textarea, { target: { value: 'New description' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onUpdateCard).toHaveBeenCalledWith('c1', { description: 'New description' });
  });

  it('calls onDeleteCard', () => {
    const onDeleteCard = vi.fn();
    render(<CardDetailModal {...baseProps} onDeleteCard={onDeleteCard} />);
    fireEvent.click(screen.getByText('Delete card'));
    expect(onDeleteCard).toHaveBeenCalledWith('c1');
  });

  it('shows overdue warning', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const card = makeCard({ dueDate: past });
    render(<CardDetailModal {...baseProps} card={card} />);
    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });

  it('renders checklist items', () => {
    const card = makeCard({ checklist: [{ id: 'ch1', text: 'Task 1', done: false }] });
    render(<CardDetailModal {...baseProps} card={card} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });

  it('adds checklist item', () => {
    const onUpdateCard = vi.fn();
    render(<CardDetailModal {...baseProps} onUpdateCard={onUpdateCard} />);
    const input = screen.getByPlaceholderText('Add checklist item...');
    fireEvent.change(input, { target: { value: 'New item' } });
    fireEvent.click(screen.getAllByText('Add')[0]);
    expect(onUpdateCard).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        checklist: expect.arrayContaining([expect.objectContaining({ text: 'New item' })]),
      })
    );
  });

  it('archives card', () => {
    const onUpdateCard = vi.fn();
    render(<CardDetailModal {...baseProps} onUpdateCard={onUpdateCard} />);
    const archiveBtn = screen.getByTitle('Archive');
    fireEvent.click(archiveBtn);
    expect(onUpdateCard).toHaveBeenCalledWith('c1', { archived: true });
  });

  it('shows cover color picker', () => {
    render(<CardDetailModal {...baseProps} />);
    const coverBtn = screen.getByTitle('Cover color');
    fireEvent.click(coverBtn);
    expect(screen.getByText('Cover:')).toBeInTheDocument();
  });

  describe('history', () => {
    const lists = [
      { id: 'l1', boardId: 'b1', title: 'Backlog', position: 1, cards: [] },
      { id: 'l2', boardId: 'b1', title: 'In Progress', position: 2, cards: [] },
    ];

    it('shows no history state', () => {
      render(<CardDetailModal {...baseProps} activities={[]} boardLists={lists} />);
      expect(screen.getByText('No history yet')).toBeInTheDocument();
    });

    it('shows card creation in history', () => {
      const activities: Activity[] = [
        {
          id: 'a1',
          boardId: 'b1',
          userId: 'u1',
          userName: 'John',
          action: 'created',
          entityType: 'card',
          entityId: 'c1',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      render(<CardDetailModal {...baseProps} activities={activities} boardLists={lists} />);
      expect(screen.getByText('created this card')).toBeInTheDocument();
    });

    it('shows card movement with list ids as fallback', () => {
      const activities: Activity[] = [
        {
          id: 'a1',
          boardId: 'b1',
          userId: 'u1',
          userName: 'John',
          action: 'moved',
          entityType: 'card',
          entityId: 'c1',
          fromListId: 'l1',
          toListId: 'l2',
          fromListTitle: 'Backlog',
          toListTitle: 'In Progress',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      render(<CardDetailModal {...baseProps} activities={activities} boardLists={lists} />);
      expect(screen.getByText(/moved from/)).toBeInTheDocument();
      expect(screen.getByText(/Backlog/)).toBeInTheDocument();
      expect(screen.getByText(/In Progress/)).toBeInTheDocument();
    });

    it('shows card update in history', () => {
      const activities: Activity[] = [
        {
          id: 'a1',
          boardId: 'b1',
          userId: 'u1',
          userName: 'John',
          action: 'updated',
          entityType: 'card',
          entityId: 'c1',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      render(<CardDetailModal {...baseProps} activities={activities} boardLists={lists} />);
      expect(screen.getByText('updated the card')).toBeInTheDocument();
    });
  });
});

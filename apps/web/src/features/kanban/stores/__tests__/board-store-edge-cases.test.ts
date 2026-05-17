import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardStore } from '../board-store';
import type { Card } from '../../types/kanban';

function makeCard(overrides?: Partial<Card>): Card {
  return {
    id: 'c1',
    listId: 'l1',
    title: 'Task',
    description: '',
    position: 1,
    labels: [],
    assignees: [],
    comments: [],
    checklist: [],
    attachments: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeBoard(overrides?: any) {
  return {
    id: 'b1',
    name: 'Board',
    description: '',
    ownerId: 'u1',
    lists: [
      {
        id: 'l1',
        boardId: 'b1',
        title: 'To Do',
        position: 1,
        cards: [makeCard(), makeCard({ id: 'c2', title: 'Task 2', position: 2 })],
      },
      { id: 'l2', boardId: 'b1', title: 'Done', position: 2, cards: [] },
    ],
    members: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  useBoardStore.setState({
    boards: [],
    currentBoard: null,
    activities: [],
    notifications: [],
    loading: false,
    error: null,
  });
});

describe('BoardStore edge cases', () => {
  it('moves card to same list', () => {
    const board = makeBoard();
    useBoardStore.getState().setCurrentBoard(board);
    useBoardStore.getState().moveCard(makeCard({ id: 'c1' }), 'l1', 'l1', 1);
    const cards = useBoardStore.getState().currentBoard?.lists.find((l) => l.id === 'l1')?.cards;
    expect(cards).toHaveLength(2);
  });

  it('does not crash on moveCard when no current board', () => {
    expect(() => useBoardStore.getState().moveCard(makeCard({ id: 'c1' }), 'l1', 'l2', 1)).not.toThrow();
  });

  it('does not crash on addCard when no current board', () => {
    expect(() => useBoardStore.getState().addCard(makeCard())).not.toThrow();
  });

  it('does not crash on updateCard when no current board', () => {
    expect(() => useBoardStore.getState().updateCard(makeCard())).not.toThrow();
  });

  it('does not crash on removeCard when no current board', () => {
    expect(() => useBoardStore.getState().removeCard('c1')).not.toThrow();
  });

  it('does not crash on addList when no current board', () => {
    const before = useBoardStore.getState().currentBoard;
    useBoardStore.getState().addList({ id: 'l3', boardId: 'b1', title: 'New', position: 3, cards: [] });
    expect(useBoardStore.getState().currentBoard).toBe(before);
  });

  it('does not crash on toggleLabel when no current board', () => {
    expect(() => useBoardStore.getState().toggleLabel('c1', { id: 'lb1', name: 'Bug', color: 'red' })).not.toThrow();
  });

  it('sorts cards by position after move', () => {
    useBoardStore.getState().setCurrentBoard(makeBoard());
    useBoardStore.getState().moveCard(makeCard({ id: 'c1', position: 1 }), 'l1', 'l2', 2);
    useBoardStore.getState().moveCard(makeCard({ id: 'c2', position: 2 }), 'l1', 'l2', 1);
    const cards = useBoardStore.getState().currentBoard?.lists.find((l) => l.id === 'l2')?.cards;
    expect(cards).toHaveLength(2);
    if (cards && cards.length === 2) {
      expect(cards[0].position).toBeLessThanOrEqual(cards[1].position);
    }
  });

  it('addCard only adds to correct list', () => {
    useBoardStore.getState().setCurrentBoard(makeBoard());
    useBoardStore.getState().addCard(makeCard({ id: 'c3', listId: 'l2', title: 'New card' }));
    const l1cards = useBoardStore.getState().currentBoard?.lists.find((l) => l.id === 'l1')?.cards;
    const l2cards = useBoardStore.getState().currentBoard?.lists.find((l) => l.id === 'l2')?.cards;
    expect(l1cards).toHaveLength(2);
    expect(l2cards).toHaveLength(1);
    expect(l2cards?.[0].title).toBe('New card');
  });

  it('updateCard only updates matching card', () => {
    useBoardStore.getState().setCurrentBoard(makeBoard());
    useBoardStore.getState().updateCard(makeCard({ id: 'c1', title: 'Updated' }));
    const cards = useBoardStore.getState().currentBoard?.lists.find((l) => l.id === 'l1')?.cards;
    expect(cards?.find((c) => c.id === 'c1')?.title).toBe('Updated');
    expect(cards?.find((c) => c.id === 'c2')?.title).toBe('Task 2');
  });

  it('addComment only adds to correct card', () => {
    useBoardStore.getState().setCurrentBoard(makeBoard());
    useBoardStore.getState().addComment('c1', {
      id: 'cm1',
      cardId: 'c1',
      userId: 'u1',
      userName: 'John',
      content: 'Hello',
      createdAt: '2026-01-01T00:00:00Z',
    });
    const c1 = useBoardStore
      .getState()
      .currentBoard?.lists.find((l) => l.id === 'l1')
      ?.cards.find((c) => c.id === 'c1');
    const c2 = useBoardStore
      .getState()
      .currentBoard?.lists.find((l) => l.id === 'l1')
      ?.cards.find((c) => c.id === 'c2');
    expect(c1?.comments).toHaveLength(1);
    expect(c2?.comments).toHaveLength(0);
  });

  it('updateBoard updates currentBoard in-place', () => {
    useBoardStore.getState().setCurrentBoard(makeBoard());
    useBoardStore.getState().updateBoard(makeBoard({ name: 'Renamed' }));
    expect(useBoardStore.getState().currentBoard?.name).toBe('Renamed');
  });

  it('removeBoard clears currentBoard when deleted', () => {
    useBoardStore.getState().setCurrentBoard(makeBoard());
    useBoardStore.getState().removeBoard('b1');
    expect(useBoardStore.getState().currentBoard).toBeNull();
  });

  it('removeBoard preserves different board as current', () => {
    useBoardStore.getState().setCurrentBoard(makeBoard({ id: 'b2', name: 'Other' }));
    useBoardStore.getState().removeBoard('b1');
    expect(useBoardStore.getState().currentBoard?.id).toBe('b2');
  });
});

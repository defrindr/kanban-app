import { describe, it, expect } from 'vitest';
import {
  BoardSchema,
  ListSchema,
  CardSchema,
  CommentSchema,
  LabelSchema,
  BoardMemberSchema,
  AttachmentSchema,
  ChecklistItemSchema,
  ActivitySchema,
  NotificationSchema,
  LABEL_OPTIONS,
  BOARD_TEMPLATES,
} from '../kanban';

describe('Zod Schemas', () => {
  describe('BoardSchema', () => {
    const valid = {
      id: 'b1',
      name: 'Test',
      ownerId: 'u1',
      lists: [],
      members: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    it('parses valid board', () => {
      expect(BoardSchema.parse(valid).name).toBe('Test');
    });
    it('rejects missing name', () => {
      expect(() => BoardSchema.parse({ ...valid, name: undefined })).toThrow();
    });
    it('rejects invalid visibility', () => {
      expect(() => BoardSchema.parse({ ...valid, visibility: 'invalid' })).toThrow();
    });
    it('accepts valid visibility values', () => {
      for (const v of ['workspace', 'private', 'public'] as const) {
        expect(BoardSchema.parse({ ...valid, visibility: v }).visibility).toBe(v);
      }
    });
  });

  describe('ListSchema', () => {
    const valid = { id: 'l1', boardId: 'b1', title: 'To Do', position: 1, cards: [] };
    it('parses valid list', () => {
      expect(ListSchema.parse(valid).title).toBe('To Do');
    });
    it('requires cards array', () => {
      expect(() => ListSchema.parse({ ...valid, cards: undefined })).toThrow();
    });
  });

  describe('CardSchema', () => {
    const valid = {
      id: 'c1',
      listId: 'l1',
      title: 'Task',
      position: 1,
      labels: [],
      assignees: [],
      comments: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    it('parses valid card', () => {
      expect(CardSchema.parse(valid).title).toBe('Task');
    });
    it('rejects missing title', () => {
      expect(() => CardSchema.parse({ ...valid, title: undefined })).toThrow();
    });
    it('accepts optional fields', () => {
      const withOpt = {
        ...valid,
        dueDate: '2026-02-01T00:00:00Z',
        coverColor: '#ff0000',
        archived: true,
        description: 'desc',
        checklist: [],
        attachments: [],
      };
      const parsed = CardSchema.parse(withOpt);
      expect(parsed.dueDate).toBeDefined();
      expect(parsed.archived).toBe(true);
    });
  });

  describe('CommentSchema', () => {
    it('parses valid comment', () => {
      const c = {
        id: 'cm1',
        cardId: 'c1',
        userId: 'u1',
        userName: 'John',
        content: 'Nice',
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(CommentSchema.parse(c).content).toBe('Nice');
    });
  });

  describe('LabelSchema', () => {
    it('parses valid label', () => {
      const l = { id: 'lb1', name: 'Bug', color: 'red' };
      expect(LabelSchema.parse(l).color).toBe('red');
    });
    it('rejects invalid color', () => {
      expect(() => LabelSchema.parse({ id: 'lb1', name: 'Bug', color: 'pink' })).toThrow();
    });
  });

  describe('BoardMemberSchema', () => {
    it('parses valid member', () => {
      const m = { id: 'u1', name: 'John', email: 'j@t.com' };
      expect(BoardMemberSchema.parse(m).name).toBe('John');
    });
  });

  describe('AttachmentSchema', () => {
    it('parses valid attachment', () => {
      const a = {
        id: 'att1',
        name: 'file.pdf',
        url: '/uploads/file.pdf',
        type: 'application/pdf',
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(AttachmentSchema.parse(a).name).toBe('file.pdf');
    });
  });

  describe('ChecklistItemSchema', () => {
    it('parses valid checklist item', () => {
      const ci = { id: 'ch1', text: 'Do it', done: false };
      expect(ChecklistItemSchema.parse(ci).done).toBe(false);
    });
  });

  describe('ActivitySchema', () => {
    it('parses valid activity', () => {
      const a = {
        id: 'a1',
        boardId: 'b1',
        userId: 'u1',
        userName: 'John',
        action: 'created',
        entityType: 'card',
        entityId: 'c1',
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(ActivitySchema.parse(a).action).toBe('created');
    });
    it('rejects invalid action', () => {
      expect(() =>
        ActivitySchema.parse({
          id: 'a1',
          boardId: 'b1',
          userId: 'u1',
          userName: 'John',
          action: 'invalid',
          entityType: 'card',
          entityId: 'c1',
          createdAt: '2026-01-01T00:00:00Z',
        })
      ).toThrow();
    });
    it('rejects invalid entityType', () => {
      expect(() =>
        ActivitySchema.parse({
          id: 'a1',
          boardId: 'b1',
          userId: 'u1',
          userName: 'John',
          action: 'created',
          entityType: 'invalid',
          entityId: 'c1',
          createdAt: '2026-01-01T00:00:00Z',
        })
      ).toThrow();
    });
  });

  describe('NotificationSchema', () => {
    it('parses valid notification', () => {
      const n = {
        id: 'n1',
        userId: 'u1',
        type: 'mention',
        message: 'Hi',
        read: false,
        createdAt: '2026-01-01T00:00:00Z',
      };
      expect(NotificationSchema.parse(n).type).toBe('mention');
    });
  });
});

describe('Constants', () => {
  it('LABEL_OPTIONS has 6 items', () => {
    expect(LABEL_OPTIONS).toHaveLength(6);
  });

  it('BOARD_TEMPLATES has 4 items', () => {
    expect(BOARD_TEMPLATES).toHaveLength(4);
  });

  it('all templates have name and description', () => {
    for (const t of BOARD_TEMPLATES) {
      expect(t.name).toBeDefined();
      expect(t.description).toBeDefined();
    }
  });
});

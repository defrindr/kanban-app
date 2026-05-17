import { describe, it, expect } from 'vitest';
import { camelizeResponse, snakeifyRequest } from '../api/case-transform';

describe('camelizeResponse', () => {
  it('converts snake_case keys to camelCase', () => {
    const input = { user_id: 'u1', created_at: '2026-01-01T00:00:00Z' };
    expect(camelizeResponse(input)).toEqual({
      userId: 'u1',
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('converts nested objects', () => {
    const input = {
      board_id: 'b1',
      owner: { first_name: 'John', last_name: 'Doe' },
    };
    expect(camelizeResponse(input)).toEqual({
      boardId: 'b1',
      owner: { firstName: 'John', lastName: 'Doe' },
    });
  });

  it('converts arrays of objects', () => {
    const input = [
      { card_id: 'c1', list_id: 'l1' },
      { card_id: 'c2', list_id: 'l2' },
    ];
    expect(camelizeResponse(input)).toEqual([
      { cardId: 'c1', listId: 'l1' },
      { cardId: 'c2', listId: 'l2' },
    ]);
  });

  it('handles primitives and null', () => {
    expect(camelizeResponse(null)).toBeNull();
    expect(camelizeResponse(42)).toBe(42);
    expect(camelizeResponse('hello')).toBe('hello');
  });

  it('handles empty objects', () => {
    expect(camelizeResponse({})).toEqual({});
  });

  it('handles empty arrays', () => {
    expect(camelizeResponse([])).toEqual([]);
  });

  it('preserves already camelCase keys', () => {
    const input = { userId: 'u1', createdAt: '2026-01-01T00:00:00Z' };
    expect(camelizeResponse(input)).toEqual(input);
  });
});

describe('snakeifyRequest', () => {
  it('converts camelCase keys to snake_case', () => {
    const input = { userId: 'u1', createdAt: '2026-01-01T00:00:00Z' };
    expect(snakeifyRequest(input)).toEqual({
      user_id: 'u1',
      created_at: '2026-01-01T00:00:00Z',
    });
  });

  it('converts nested objects', () => {
    const input = {
      boardId: 'b1',
      owner: { firstName: 'John', lastName: 'Doe' },
    };
    expect(snakeifyRequest(input)).toEqual({
      board_id: 'b1',
      owner: { first_name: 'John', last_name: 'Doe' },
    });
  });

  it('converts arrays of objects', () => {
    const input = [
      { cardId: 'c1', listId: 'l1' },
      { cardId: 'c2', listId: 'l2' },
    ];
    expect(snakeifyRequest(input)).toEqual([
      { card_id: 'c1', list_id: 'l1' },
      { card_id: 'c2', list_id: 'l2' },
    ]);
  });

  it('handles primitives and null', () => {
    expect(snakeifyRequest(null)).toBeNull();
    expect(snakeifyRequest(42)).toBe(42);
    expect(snakeifyRequest('hello')).toBe('hello');
  });

  it('preserves already snake_case keys', () => {
    const input = { user_id: 'u1', created_at: '2026-01-01T00:00:00Z' };
    expect(snakeifyRequest(input)).toEqual(input);
  });
});

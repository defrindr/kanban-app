import { describe, it, expect } from 'vitest';
import { isApiSuccess } from '../api/response';

describe('isApiSuccess', () => {
  it('returns true for success response', () => {
    const response = { ok: true as const, data: { id: '1' } };
    expect(isApiSuccess(response)).toBe(true);
  });

  it('returns false for error response', () => {
    const response = { ok: false as const, error: { code: 'ERROR', message: 'fail' } };
    expect(isApiSuccess(response)).toBe(false);
  });
});

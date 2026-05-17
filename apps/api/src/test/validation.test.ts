import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { registerTestUser } from './helpers.js';

const testEmail = `validation-test-${Date.now()}@test.com`;

describe('API Versioning', () => {
  it('serves auth at both prefixes', async () => {
    const res1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'none@test.com', password: 'x' });
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'none@test.com', password: 'x' });
    expect(res1.status).toBe(401);
    expect(res2.status).toBe(401);
  });

  it('adds version headers on v1 prefix', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nope@test.com', password: 'x' });
    expect(res.headers['x-api-version']).toBe('1');
  });
});

describe('Input validation', () => {
  it('rejects board without name', async () => {
    const { data } = await registerTestUser(testEmail);

    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${data.token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects card without title', async () => {
    const { data } = await registerTestUser(`card-val-${Date.now()}@test.com`);

    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${data.token}`)
      .send({ listId: 'invalid' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects non-cuid IDs', async () => {
    const { data } = await registerTestUser(`cuid-test-${Date.now()}@test.com`);

    const res = await request(app)
      .get('/api/boards/not-a-cuid')
      .set('Authorization', `Bearer ${data.token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent board', async () => {
    const { data } = await registerTestUser(`notfound-${Date.now()}@test.com`);
    const fakeId = 'clx1234567890abcdefghijkl';

    const res = await request(app)
      .get(`/api/boards/${fakeId}`)
      .set('Authorization', `Bearer ${data.token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

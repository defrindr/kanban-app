import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

const testEmail = `board-test-${Date.now()}@test.com`;
let token: string;
let boardId: string;

afterAll(async () => {
  await cleanupTestUser(testEmail);
});

describe('Board CRUD', () => {
  it('creates a board with auth', async () => {
    const { data } = await registerTestUser(testEmail);
    token = data.token;

    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Board', description: 'A test board' });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.name).toBe('Test Board');
    expect(res.body.data.lists).toHaveLength(3);
    expect(res.body.data.members).toHaveLength(1);
    boardId = res.body.data.id;
  });

  it('lists boards', async () => {
    const res = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('gets a single board', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Test Board');
  });

  it('updates a board', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Board' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Board');
  });

  it('deletes a board', async () => {
    const res = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects without auth', async () => {
    const res = await request(app)
      .post('/api/boards')
      .send({ name: 'No Auth Board' });

    expect(res.status).toBe(401);
  });
});

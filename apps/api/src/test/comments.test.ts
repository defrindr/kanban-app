import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

const email = `comment-test-${Date.now()}@test.com`;
let token: string;
let boardId: string;
let listId: string;
let cardId: string;

afterAll(async () => {
  await cleanupTestUser(email);
});

describe('Comment REST API', () => {
  beforeAll(async () => {
    const { data } = await registerTestUser(email);
    token = data.token;

    const board = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Comment Test Board' });
    boardId = board.body.data.id;
    listId = board.body.data.lists[0].id;

    const card = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ listId, title: 'Test Card', position: 1 });
    cardId = card.body.data.id;
  });

  it('creates a comment', async () => {
    const res = await request(app)
      .post(`/api/comments/card/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test comment' });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.content).toBe('Test comment');
    expect(res.body.data.user).toBeDefined();
  });

  it('lists comments with pagination', async () => {
    await request(app)
      .post(`/api/comments/card/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Second comment' });

    const res = await request(app)
      .get(`/api/comments/card/${cardId}?page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('rejects empty content', async () => {
    const res = await request(app)
      .post(`/api/comments/card/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });

    expect(res.status).toBe(422);
  });

  it('rejects without auth', async () => {
    const res = await request(app)
      .post(`/api/comments/card/${cardId}`)
      .send({ content: 'No auth' });

    expect(res.status).toBe(401);
  });

  it('updates own comment', async () => {
    const created = await request(app)
      .post(`/api/comments/card/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'To update' });

    const res = await request(app)
      .put(`/api/comments/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated!' });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('Updated!');
  });

  it('forbids updating other user comment', async () => {
    const otherEmail = `other-${Date.now()}@test.com`;
    const { data: other } = await registerTestUser(otherEmail);

    const created = await request(app)
      .post(`/api/comments/card/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Mine' });

    const res = await request(app)
      .put(`/api/comments/${created.body.data.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ content: 'Hacked!' });

    expect(res.status).toBe(403);
    await cleanupTestUser(otherEmail);
  });

  it('deletes own comment', async () => {
    const created = await request(app)
      .post(`/api/comments/card/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'To delete' });

    const res = await request(app)
      .delete(`/api/comments/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

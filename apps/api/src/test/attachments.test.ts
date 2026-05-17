import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import { existsSync, unlinkSync } from 'fs';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

const email = `attach-test-${Date.now()}@test.com`;
let token: string;
let boardId: string;
let listId: string;
let cardId: string;
let attachmentId: string;

beforeAll(async () => {
  const { data } = await registerTestUser(email);
  token = data.token;

  const board = await request(app)
    .post('/api/boards')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Attachment Test' });
  boardId = board.body.data.id;
  listId = board.body.data.lists[0].id;

  const card = await request(app)
    .post('/api/cards')
    .set('Authorization', `Bearer ${token}`)
    .send({ listId, title: 'Attachment Card' });
  cardId = card.body.data.id;
});

afterAll(async () => {
  await cleanupTestUser(email);
});

describe('Card Attachments', () => {
  it('uploads a file', async () => {
    const res = await request(app)
      .post(`/api/cards/${cardId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test file content'), 'test.txt');

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('test.txt');
    expect(res.body.data.url).toMatch(/^\/uploads\//);
    expect(res.body.data.size).toBeGreaterThan(0);
    attachmentId = res.body.data.id;
  });

  it('rejects without auth', async () => {
    const res = await request(app)
      .post(`/api/cards/${cardId}/attachments`)
      .attach('file', Buffer.from('content'), 'test.txt');

    expect(res.status).toBe(401);
  });

  it('rejects invalid card', async () => {
    const res = await request(app)
      .post('/api/cards/invalid/attachments')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('content'), 'test.txt');

    expect(res.status).toBe(404);
  });

  it('deletes an attachment', async () => {
    const res = await request(app)
      .delete(`/api/cards/${cardId}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects delete on non-existent attachment', async () => {
    const res = await request(app)
      .delete(`/api/cards/${cardId}/attachments/invalid-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('rejects delete without auth', async () => {
    const res = await request(app)
      .delete(`/api/cards/${cardId}/attachments/${attachmentId}`);

    expect(res.status).toBe(401);
  });
});

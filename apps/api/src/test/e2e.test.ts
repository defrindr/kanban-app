import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

const ownerEmail = `e2e-owner-${Date.now()}@test.com`;
const userEmail = `e2e-user-${Date.now()}@test.com`;
let ownerToken: string;
let userToken: string;
let ownerId: string;
let userId: string;

let boardId: string;
let listIds: string[] = [];
let cardIds: string[] = [];
let commentId: string;
let memberId: string;
let refreshToken: string;
let attachmentId: string;

beforeAll(async () => {
  const { data: o } = await registerTestUser(ownerEmail);
  ownerToken = o.token;
  ownerId = o.user.id;

  const { data: u } = await registerTestUser(userEmail, 'password123', 'Second User');
  userToken = u.token;
  userId = u.user.id;
});

afterAll(async () => {
  await cleanupTestUser(ownerEmail);
  await cleanupTestUser(userEmail);
});

describe('E2E: Board Lifecycle', () => {
  it('creates a board with default lists', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'E2E Project', description: 'End-to-end test board' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('E2E Project');
    expect(res.body.data.lists).toHaveLength(3);
    expect(res.body.data.members).toHaveLength(1);
    expect(res.body.data.members[0].role).toBe('ADMIN');

    boardId = res.body.data.id;
    listIds = res.body.data.lists.map((l: { id: string }) => l.id);
  });

  it('search board by name', async () => {
    const res = await request(app)
      .get(`/api/boards?q=E2E`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].name).toContain('E2E');
  });

  it('gets board with full details', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('E2E Project');
    expect(res.body.data.lists).toHaveLength(3);
  });

  it('updates board name', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'E2E Project v2' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('E2E Project v2');
  });
});

describe('E2E: Card Workflow', () => {
  it('creates cards in the first list', async () => {
    for (const title of ['Design homepage', 'Implement auth', 'Write tests']) {
      const res = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ listId: listIds[0], title });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(title);
      cardIds.push(res.body.data.id);
    }
    expect(cardIds).toHaveLength(3);
  });

  it('creates a card in a different list', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ listId: listIds[1], title: 'In progress task' });
    expect(res.status).toBe(201);
    cardIds.push(res.body.data.id);
  });

  it('moves a card between lists', async () => {
    const res = await request(app)
      .post('/api/cards/move')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ cardId: cardIds[0], fromListId: listIds[0], toListId: listIds[1], newPosition: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.listId).toBe(listIds[1]);
  });

  it('updates a card with labels and due date', async () => {
    const res = await request(app)
      .put(`/api/cards/${cardIds[1]}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Implement JWT auth',
        description: 'Use bcrypt + JWT',
        labels: ['backend', 'security'],
        dueDate: new Date('2026-06-01').toISOString(),
        archived: false,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Implement JWT auth');
    expect(res.body.data.labels).toContain('backend');
  });

  it('searches cards by text', async () => {
    const res = await request(app)
      .get(`/api/cards/search?boardId=${boardId}&q=auth`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.some((c: { title: string }) => c.title.toLowerCase().includes('auth'))
    ).toBe(true);
  });

  it('searches cards by label', async () => {
    const res = await request(app)
      .get(`/api/cards/search?boardId=${boardId}&labels=backend`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('E2E: Comments Flow', () => {
  it('adds comments to a card', async () => {
    const res = await request(app)
      .post(`/api/comments/card/${cardIds[1]}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ content: 'Great progress on this!' });
    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Great progress on this!');
    commentId = res.body.data.id;
  });

  it('adds another comment', async () => {
    const res = await request(app)
      .post(`/api/comments/card/${cardIds[1]}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ content: 'Need to review the implementation' });
    expect(res.status).toBe(201);
  });

  it('lists comments with pagination', async () => {
    const res = await request(app)
      .get(`/api/comments/card/${cardIds[1]}?page=1&limit=10`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('edits own comment', async () => {
    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ content: 'Updated: Great progress, needs review' });
    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('Updated: Great progress, needs review');
  });

  it('cannot edit another user comment', async () => {
    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'trying to hijack' });
    expect(res.status).toBe(403);
  });
});

describe('E2E: Member Management', () => {
  it('adds a member', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId, role: 'MEMBER' });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('MEMBER');
    memberId = res.body.data.id;
  });

  it('lists members including new user', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('new member can read board', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it('new member can create cards', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ listId: listIds[0], title: 'Card by member' });
    expect(res.status).toBe(201);
    cardIds.push(res.body.data.id);
  });

  it('new user can view board (public by ID)', async () => {
    const freshEmail = `e2e-fresh-${Date.now()}@test.com`;
    const { data } = await registerTestUser(freshEmail);
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${data.token}`);
    expect(res.status).toBe(200);
    await cleanupTestUser(freshEmail);
  });

  it('changes member role', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('removes member', async () => {
    await request(app)
      .put(`/api/boards/${boardId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'MEMBER' });

    const res = await request(app)
      .delete(`/api/boards/${boardId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });
});

describe('E2E: File Upload', () => {
  it('uploads an attachment', async () => {
    const res = await request(app)
      .post(`/api/cards/${cardIds[1]}/attachments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('e2e test content'), 'e2e-test.txt');
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('e2e-test.txt');
    attachmentId = res.body.data.id;
  });

  it('deletes attachment', async () => {
    const res = await request(app)
      .delete(`/api/cards/${cardIds[1]}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });
});

describe('E2E: Auth Refresh Flow', () => {
  it('gets refresh token on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ownerEmail, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).toBeDefined();
    refreshToken = res.body.data.refreshToken;
  });

  it('exchanges refresh token for new tokens', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
    ownerToken = res.body.data.token;
    refreshToken = res.body.data.refreshToken;
  });

  it('logout revokes refresh token', async () => {
    const res = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(res.status).toBe(200);

    const res2 = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res2.status).toBe(401);
  });
});

describe('E2E: Error Scenarios', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent board', async () => {
    const res = await request(app)
      .get('/api/boards/nonexistent-id')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent card', async () => {
    const res = await request(app)
      .put('/api/cards/nonexistent-id')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'test' });
    expect(res.status).toBe(404);
  });

  it('returns 422 for invalid board data', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('returns 404 for unknown route', async () => {
    const res = await request(app)
      .get('/api/unknown-route')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(404);
  });

  it('rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: ownerEmail, password: 'password123', name: 'Test' });
    expect(res.status).toBe(409);
  });

  it('returns valid JSON envelope on all responses', async () => {
    const endpoints = [
      request(app).get('/api/boards').set('Authorization', `Bearer ${ownerToken}`),
      request(app).get(`/api/boards/${boardId}`).set('Authorization', `Bearer ${ownerToken}`),
      request(app)
        .get(`/api/boards/${boardId}/activities`)
        .set('Authorization', `Bearer ${ownerToken}`),
    ];
    const results = await Promise.all(endpoints);
    for (const res of results) {
      expect(res.body).toHaveProperty('ok');
      expect(typeof res.body.ok).toBe('boolean');
    }
  });
});

describe('E2E: Board Deletion', () => {
  it('deletes the board', async () => {
    const res = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });

  it('board is gone after deletion', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(404);
  });

  it('board not listed', async () => {
    const res = await request(app).get('/api/boards').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.body.data.every((b: { id: string }) => b.id !== boardId)).toBe(true);
  });
});

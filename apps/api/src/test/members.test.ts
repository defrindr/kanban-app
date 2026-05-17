import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

const email1 = `member-owner-${Date.now()}@test.com`;
const email2 = `member-user-${Date.now()}@test.com`;
let ownerToken: string;
let ownerId: string;
let userToken: string;
let userId: string;
let boardId: string;
let memberId: string;

beforeAll(async () => {
  const { data: ownerData } = await registerTestUser(email1);
  ownerToken = ownerData.token;
  ownerId = ownerData.user.id;

  const { data: userData } = await registerTestUser(email2, 'password123', 'Second User');
  userToken = userData.token;
  userId = userData.user.id;
});

afterAll(async () => {
  await cleanupTestUser(email1);
  await cleanupTestUser(email2);
});

describe('Board Members', () => {
  it('creates board as owner', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Member Test Board' });

    boardId = res.body.data.id;
    expect(res.status).toBe(201);
  });

  it('lists board members', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].role).toBe('ADMIN');
  });

  it('rejects non-member from listing members', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('adds a member', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId, role: 'MEMBER' });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('MEMBER');
    expect(res.body.data.user.email).toBe(email2);
    memberId = res.body.data.id;
  });

  it('rejects adding existing member', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId, role: 'MEMBER' });

    expect(res.status).toBe(409);
  });

  it('lists members including new one', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('allows member to list members', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('changes member role', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('rejects role change from non-admin member', async () => {
    await request(app)
      .put(`/api/boards/${boardId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'MEMBER' });

    const res = await request(app)
      .put(`/api/boards/${boardId}/members/${memberId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'VIEWER' });

    expect(res.status).toBe(403);
  });

  it('removes member', async () => {
    const res = await request(app)
      .delete(`/api/boards/${boardId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects remove without auth', async () => {
    const res = await request(app)
      .delete(`/api/boards/${boardId}/members/${memberId}`);

    expect(res.status).toBe(401);
  });
});

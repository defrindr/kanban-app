import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

const email = `search-test-${Date.now()}@test.com`;
let token: string;
let boardId: string;
let listId: string;
let card1Id: string;
let card2Id: string;

beforeAll(async () => {
  const { data } = await registerTestUser(email);
  token = data.token;

  const board = await request(app)
    .post('/api/boards')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Search Test Board', description: 'A board for testing search' });
  boardId = board.body.data.id;
  listId = board.body.data.lists[0].id;

  const c1 = await request(app)
    .post('/api/cards')
    .set('Authorization', `Bearer ${token}`)
    .send({ listId, title: 'Fix login bug', description: 'Users cannot login with special characters' });
  card1Id = c1.body.data.id;

  const c2 = await request(app)
    .post('/api/cards')
    .set('Authorization', `Bearer ${token}`)
    .send({ listId, title: 'Add payment integration', description: 'Integrate Stripe for payments' });
  card2Id = c2.body.data.id;

  await prisma.card.update({
    where: { id: card1Id },
    data: { labels: ['bug', 'urgent'] },
  });
  await prisma.card.update({
    where: { id: card2Id },
    data: { labels: ['feature'] },
  });
});

afterAll(async () => {
  await cleanupTestUser(email);
});

describe('Search', () => {
  describe('Board Search', () => {
    it('lists all boards without query', async () => {
      const res = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('filters boards by name', async () => {
      const res = await request(app)
        .get('/api/boards?q=Search')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toContain('Search');
    });

    it('returns empty for non-matching search', async () => {
      const res = await request(app)
        .get('/api/boards?q=NonExistentBoard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('Card Search', () => {
    it('returns all cards for a board', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('filters cards by title content', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}&q=login`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Fix login bug');
    });

    it('filters cards by description content', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}&q=Stripe`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('filters cards by label', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}&labels=bug`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Fix login bug');
    });

    it('filters cards by list', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}&listId=${listId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('filters by non-matching label returns empty', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}&labels=nonexistent`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('paginates results', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}&page=1&limit=1`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(2);
    });

    it('rejects without boardId', async () => {
      const res = await request(app)
        .get('/api/cards/search')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('requires auth', async () => {
      const res = await request(app)
        .get(`/api/cards/search?boardId=${boardId}`);
      expect(res.status).toBe(401);
    });
  });
});

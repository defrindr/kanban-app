import { createHmac } from 'crypto';
import request from 'supertest';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';
import { verifySignature } from '../utils/webhooks.js';

let token: string;
let boardId: string;
let webhookId: string;

const testUrl = 'https://hooks.example.com/kanban';
const testEvents = ['card:created', 'card:updated', 'board:updated'];

const webhookEmail = 'webhooks-test@test.com';

beforeAll(async () => {
  await cleanupTestUser(webhookEmail);
  const user = await registerTestUser(webhookEmail);
  token = user.data.token;

  const boardRes = await request(app)
    .post('/api/boards')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Webhook Test Board' });
  boardId = boardRes.body.data.id;
});

afterAll(async () => {
  await prisma.webhook.deleteMany({ where: { boardId } });
  await cleanupTestUser(webhookEmail);
});

describe('Webhook CRUD', () => {
  it('should create a webhook', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/webhooks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ url: testUrl, events: testEvents });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.url).toBe(testUrl);
    expect(res.body.data.events).toEqual(testEvents);
    expect(res.body.data.secret).toBeDefined();
    webhookId = res.body.data.id;
  });

  it('should list webhooks', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/webhooks`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].url).toBe(testUrl);
  });

  it('should reject invalid webhook URL', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/webhooks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'not-a-url', events: ['card:created'] });
    expect(res.status).toBe(422);
  });

  it('should reject invalid events', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/webhooks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ url: testUrl, events: ['invalid:event'] });
    expect(res.status).toBe(422);
  });

  it('should update a webhook', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}/webhooks/${webhookId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.data.active).toBe(false);
  });

  it('should update webhook events', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}/webhooks/${webhookId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ events: ['card:deleted'] });
    expect(res.status).toBe(200);
    expect(res.body.data.events).toEqual(['card:deleted']);
  });

  it('should deny non-admin user', async () => {
    const other = await registerTestUser('other@test.com', 'password123', 'Other');
    const res = await request(app)
      .get(`/api/boards/${boardId}/webhooks`)
      .set('Authorization', `Bearer ${other.data.token}`);
    expect(res.status).toBe(403);
    await prisma.user.deleteMany({ where: { email: 'other@test.com' } });
  });

  it('should return 404 for non-existent webhook', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}/webhooks/nonexistent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });
    expect(res.status).toBe(404);
  });

  it('should delete a webhook', async () => {
    const res = await request(app)
      .delete(`/api/boards/${boardId}/webhooks/${webhookId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });
});

describe('Webhook signature verification', () => {
  it('should verify correct signature', () => {
    const body = JSON.stringify({ event: 'test' });
    const secret = 'test-secret-123';
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifySignature(body, sig, secret)).toBe(true);
  });

  it('should reject wrong signature', () => {
    const body = JSON.stringify({ event: 'test' });
    const secret = 'test-secret-123';
    expect(verifySignature(body, 'wrong-signature', secret)).toBe(false);
  });

  it('should reject wrong secret', () => {
    const body = JSON.stringify({ event: 'test' });
    const secret = 'test-secret-123';
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifySignature(body, sig, 'wrong-secret')).toBe(false);
  });
});

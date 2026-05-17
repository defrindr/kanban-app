import request from 'supertest';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

let token: string;
let boardId: string;
let adminToken: string;

const auditEmail = 'audit-test@test.com';

beforeAll(async () => {
  await cleanupTestUser(auditEmail);
  await cleanupTestUser('admin-audit@test.com');
  const user = await registerTestUser(auditEmail);
  token = user.data.token;

  const boardRes = await request(app)
    .post('/api/boards')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Audit Log Test' });
  boardId = boardRes.body.data.id;

  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-audit@test.com', password: 'password123', name: 'Admin' });
  await prisma.user.update({ where: { email: 'admin-audit@test.com' }, data: { role: 'ADMIN' } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-audit@test.com', password: 'password123' });
  adminToken = loginRes.body.data.token;
});

afterAll(async () => {
  await cleanupTestUser('admin-audit@test.com');
  await cleanupTestUser(auditEmail);
});

describe('Board Activities', () => {
  it('should list activities with pagination', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/activities`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('page', 1);
    expect(res.body.meta).toHaveProperty('limit', 20);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  it('should respect pagination params', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/activities?page=1&limit=5`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.meta.limit).toBe(5);
  });

  it('should filter by action', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/activities?action=CREATE`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((a: any) => {
      expect(a.action).toBe('CREATE');
    });
  });

  it('should filter by entityType', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/activities?entityType=BOARD`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((a: any) => {
        expect(a.entityType).toBe('BOARD');
      });
    }
  });

  it('should filter by date range', async () => {
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const res = await request(app)
      .get(`/api/boards/${boardId}/activities?dateFrom=${yesterday}&dateTo=${now}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
  });

  it('should reject invalid action', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/activities?action=INVALID`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
  });

  it('should reject invalid entityType', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}/activities?entityType=INVALID`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
  });
});

describe('Admin Audit Log', () => {
  it('should list all activities globally', async () => {
    const res = await request(app)
      .get('/api/admin/activities')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('should filter by boardId', async () => {
    const res = await request(app)
      .get(`/api/admin/activities?boardId=${boardId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((a: any) => {
      expect(a.boardId).toBe(boardId);
    });
  });

  it('should deny non-admin access', async () => {
    const res = await request(app)
      .get('/api/admin/activities')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should support combined filters', async () => {
    const res = await request(app)
      .get(`/api/admin/activities?boardId=${boardId}&action=CREATE&entityType=BOARD`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((a: any) => {
      expect(a.boardId).toBe(boardId);
      expect(a.action).toBe('CREATE');
      expect(a.entityType).toBe('BOARD');
    });
  });

  it('should paginate results', async () => {
    const res = await request(app)
      .get('/api/admin/activities?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
  });
});

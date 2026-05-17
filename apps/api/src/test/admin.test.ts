import request from 'supertest';
import { app, prisma } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

let userToken: string;
let adminToken: string;
let adminUserId: string;
let regularUserId: string;

const adminEmail = `admin-${Date.now()}@test.com`;
const regularEmail = `regular-${Date.now()}@test.com`;

beforeAll(async () => {
  await cleanupTestUser(adminEmail);
  await cleanupTestUser(regularEmail);
  const user = await registerTestUser(regularEmail);
  userToken = user.data.token;
  regularUserId = user.data.user.id;
  userToken = user.data.token;

  await request(app)
    .post('/api/auth/register')
    .send({ email: adminEmail, password: 'password123', name: 'Admin' });
  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: 'ADMIN' },
  });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: adminEmail, password: 'password123' });
  adminToken = loginRes.body.data.token;
  adminUserId = loginRes.body.data.user.id;
});

afterAll(async () => {
  await cleanupTestUser(adminEmail);
});

describe('Admin Dashboard API', () => {
  describe('Authentication', () => {
    it('should deny non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should deny unauthenticated requests', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should allow admin users', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return system stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('boards');
      expect(res.body.data).toHaveProperty('lists');
      expect(res.body.data).toHaveProperty('cards');
      expect(res.body.data).toHaveProperty('comments');
      expect(typeof res.body.data.users).toBe('number');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should list users with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page', 1);
      expect(res.body.data).toHaveProperty('limit', 20);
    });

    it('should respect pagination params', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(1);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user by id', async () => {
      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      const userId = listRes.body.data.users[0].id;

      const res = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(userId);
      expect(res.body.data).toHaveProperty('role');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/admin/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user role', async () => {
      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      const res = await request(app)
        .put(`/api/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('ADMIN');

      await prisma.user.update({ where: { id: regularUserId }, data: { role: 'USER' } });
    });

    it('should prevent self-role-change', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'USER' });
      expect(res.status).toBe(422);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPERADMIN' });
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete a user', async () => {
      const delRes = await request(app)
        .post('/api/auth/register')
        .send({ email: 'delete-me@test.com', password: 'password123', name: 'Delete Me' });
      const deleteUserId = delRes.body.data.user.id;

      const res = await request(app)
        .delete(`/api/admin/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      const check = await prisma.user.findUnique({ where: { id: deleteUserId } });
      expect(check).toBeNull();
    });

    it('should prevent self-deletion', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/admin/boards', () => {
    it('should list all boards', async () => {
      const res = await request(app)
        .get('/api/admin/boards')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('boards');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page', 1);
    });
  });

  describe('DELETE /api/admin/boards/:id', () => {
    it('should delete a board', async () => {
      const boardRes = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Board to Delete' });
      const boardId = boardRes.body.data.id;

      const res = await request(app)
        .delete(`/api/admin/boards/${boardId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('should return 200 for non-existent board', async () => {
      const res = await request(app)
        .delete('/api/admin/boards/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});

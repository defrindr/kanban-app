import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { registerTestUser, cleanupTestUser } from './helpers.js';

const testEmail = `auth-test-${Date.now()}@test.com`;
let refreshToken: string;

afterAll(async () => {
  await cleanupTestUser(testEmail);
});

describe('POST /api/auth/register', () => {
  it('registers a new user with refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'password123', name: 'Test' });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    refreshToken = res.body.data.refreshToken;
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'password123', name: 'Test' });

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'Test' });

    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@test.com', password: '123', name: 'Test' });

    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and returns refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns new tokens with valid refresh token', async () => {
    const { body } = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(body.ok).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.refreshToken).not.toBe(refreshToken);
    expect(body.data.user.email).toBe(testEmail);

    refreshToken = body.data.refreshToken;
  });

  it('rejects already-used refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const res2 = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res2.status).toBe(401);
    refreshToken = res.body.data.refreshToken;
  });

  it('rejects invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });

  it('rejects empty body', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes refresh token', async () => {
    const { body } = await request(app).post('/api/auth/refresh').send({ refreshToken });

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: body.data.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const res2 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: body.data.refreshToken });

    expect(res2.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const { data } = await registerTestUser(`me-test-${Date.now()}@test.com`);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.email).toBeDefined();
  });

  it('rejects without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('rejects invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});

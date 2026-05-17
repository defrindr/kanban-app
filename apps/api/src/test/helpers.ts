import request from 'supertest';
import { app, prisma } from '../app.js';

export async function registerTestUser(email = 'test@test.com', password = 'password123', name = 'Test User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });
  return res.body as {
    ok: boolean;
    data: { token: string; user: { id: string; email: string; name: string } };
  };
}

export async function cleanupTestUser(email = 'test@test.com') {
  await prisma.user.deleteMany({ where: { email } });
}

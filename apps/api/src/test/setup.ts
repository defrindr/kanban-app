import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../app.js';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

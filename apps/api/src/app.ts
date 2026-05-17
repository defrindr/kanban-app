import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';

import { logger } from './utils/logger.js';
import { registerSocketHandlers } from './socket/handlers.js';
import { errorHandler } from './middleware/error-handler.js';
import { authGuard } from './middleware/auth.js';
import { apiLimiter, authLimiter } from './middleware/rate-limit.js';
import boardRoutes from './controllers/board.js';
import listRoutes from './controllers/list.js';
import cardRoutes from './controllers/card.js';
import commentRoutes from './controllers/comment.js';
import memberRoutes from './controllers/member.js';
import authRoutes from './controllers/auth.js';
import { swaggerServe, swaggerSetup } from './swagger.js';
import { UPLOAD_DIR } from './middleware/upload.js';

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

export const prisma = new PrismaClient();
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true },
});

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    integrations: [Sentry.expressIntegration()],
  });
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

app.use(pinoHttp({ logger }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/docs', swaggerServe, swaggerSetup);
app.get('/health/ready', async (_, res) => {
  try {
    await Promise.race([
      Promise.all([
        prisma.$queryRaw`SELECT 1`,
        redis.ping(),
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);
    res.json({ status: 'ok', uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Dependencies not ready' });
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/boards', apiLimiter, authGuard, boardRoutes);
app.use('/api/lists', apiLimiter, authGuard, listRoutes);
app.use('/api/cards', apiLimiter, authGuard, cardRoutes);
app.use('/api/comments', apiLimiter, commentRoutes);
app.use('/api/boards/:boardId/members', apiLimiter, authGuard, memberRoutes);

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(errorHandler);

registerSocketHandlers(io);

export { app, httpServer };

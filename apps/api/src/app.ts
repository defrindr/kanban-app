import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';
import express, { Request, Response, NextFunction } from 'express';
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
import { apiLimiter, writeLimiter } from './middleware/rate-limit.js';
import boardRoutes from './controllers/board.js';
import listRoutes from './controllers/list.js';
import cardRoutes from './controllers/card.js';
import commentRoutes from './controllers/comment.js';
import memberRoutes from './controllers/member.js';
import authRoutes from './controllers/auth.js';
import adminRoutes from './controllers/admin.js';
import webhookRoutes from './controllers/webhook.js';
import notificationRoutes from './controllers/notification.js';
import { swaggerServe, swaggerSetup } from './swagger.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { existsSync } from 'fs';
import { mkdirSync } from 'fs';

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
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

app.use(pinoHttp({ logger }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' }));
const isLocalStorage = !process.env.S3_BUCKET;
if (isLocalStorage) {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOAD_DIR));
}

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

const mutationGuard = (req: Request, _: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, _, next);
  }
  next();
};

function deprecatedApi(req: Request, _res: Response, next: NextFunction) {
  _res.setHeader('X-API-Version', '1');
  _res.setHeader('Sunset', 'Sat, 01 Jan 2028 00:00:00 GMT');
  next();
}

function mount(prefix: string) {
  const p = (path: string) => `${prefix}${path}`;
  const pw = (path: string) => `${prefix}${path}`;
  const middlewares = [apiLimiter, mutationGuard, authGuard];

  app.use(p('/auth'), deprecatedApi, authRoutes);
  app.use(pw('/boards'), ...middlewares, boardRoutes);
  app.use(pw('/lists'), ...middlewares, listRoutes);
  app.use(pw('/cards'), ...middlewares, cardRoutes);
  app.use(pw('/comments'), apiLimiter, mutationGuard, commentRoutes);
  app.use(p('/boards/:boardId/members'), ...middlewares, memberRoutes);
  app.use(p('/boards/:boardId/webhooks'), apiLimiter, authGuard, webhookRoutes);
  app.use(p('/notifications'), apiLimiter, authGuard, notificationRoutes);
  app.use(p('/admin'), apiLimiter, authGuard, adminRoutes);
}

mount('/api/v1');
mount('/api');

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(errorHandler);

registerSocketHandlers(io);

export { app, httpServer };

import { randomBytes, createHash } from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app.js';
import { authGuard, signToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { AppError } from '../errors.js';
import { z } from 'zod';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(128),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const REFRESH_EXPIRY_DAYS = 30;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function createRefreshToken(userId: string) {
  const raw = randomBytes(40).toString('hex');
  const hashed = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token: hashed, userId, expiresAt },
  });

  return raw;
}

function respondWithTokens(user: { id: string; email: string; name: string; avatar: string | null }, refreshToken: string) {
  const token = signToken({ userId: user.id, email: user.email });
  return {
    ok: true,
    data: {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    },
  };
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_FAILED', 'Invalid input', 422, parsed.error.flatten());
    }
    const { email, name, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('CONFLICT', 'Email already registered', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, password: hashed },
    });

    const refreshToken = await createRefreshToken(user.id);

    res.status(201).json(respondWithTokens(user, refreshToken));
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_FAILED', 'Invalid input', 422, parsed.error.flatten());
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }

    const refreshToken = await createRefreshToken(user.id);

    res.json(respondWithTokens(user, refreshToken));
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_FAILED', 'Refresh token is required', 422);
    }
    const { refreshToken } = parsed.data;
    const hashed = hashToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
      }
      throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }

    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const newRefreshToken = await createRefreshToken(stored.userId);

    res.json(respondWithTokens(stored.user, newRefreshToken));
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_FAILED', 'Refresh token is required', 422);
    }
    const { refreshToken } = parsed.data;
    const hashed = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: { token: hashed, revoked: false },
      data: { revoked: true },
    });

    res.json({ ok: true, data: { success: true } });
  })
);

router.get(
  '/me',
  authGuard,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }
    res.json({ ok: true, data: user });
  })
);

export default router;

import { Router } from 'express';
import { prisma } from '../app.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { adminGuard } from '../middleware/auth.js';
import { AppError } from '../errors.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();

router.use(adminGuard);

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const UpdateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { page, limit } = PaginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.json({
      ok: true,
      data: { users, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    res.json({ ok: true, data: user });
  })
);

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const parsed = UpdateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_FAILED', 'Invalid input', 422, parsed.error.flatten());
    }

    if (req.params.id === req.user!.userId) {
      throw new AppError('VALIDATION_FAILED', 'Cannot change your own role', 422);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: parsed.data.role },
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
    });
    res.json({ ok: true, data: user });
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.userId) {
      throw new AppError('VALIDATION_FAILED', 'Cannot delete yourself', 422);
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { success: true } });
  })
);

router.get(
  '/boards',
  asyncHandler(async (req, res) => {
    const { page, limit } = PaginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        skip,
        take: limit,
        select: {
          id: true, name: true, description: true, ownerId: true, createdAt: true, updatedAt: true,
          _count: { select: { lists: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.board.count(),
    ]);

    res.json({
      ok: true,
      data: { boards, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.delete(
  '/boards/:id',
  asyncHandler(async (req, res) => {
    await prisma.board.deleteMany({ where: { id: req.params.id } });
    res.json({ ok: true, data: { success: true } });
  })
);

const ActivityFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  boardId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'MOVE']).optional(),
  entityType: z.enum(['BOARD', 'LIST', 'CARD', 'COMMENT']).optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

router.get(
  '/activities',
  asyncHandler(async (req, res) => {
    const filters = ActivityFilterSchema.parse(req.query);
    const skip = (filters.page - 1) * filters.limit;

    const where: Record<string, unknown> = {};
    if (filters.boardId) where.boardId = filters.boardId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(filters.dateTo);
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: where as Prisma.ActivityWhereInput,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.activity.count({ where: where as Prisma.ActivityWhereInput }),
    ]);

    res.json({
      ok: true,
      data: activities,
      meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
    });
  })
);

router.get(
  '/stats',
  asyncHandler(async (_, res) => {
    const [users, boards, lists, cards, comments] = await Promise.all([
      prisma.user.count(),
      prisma.board.count(),
      prisma.list.count(),
      prisma.card.count(),
      prisma.comment.count(),
    ]);

    res.json({
      ok: true,
      data: { users, boards, lists, cards, comments },
    });
  })
);

export default router;

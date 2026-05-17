import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { AppError } from '../errors.js';
import { CreateBoardSchema, UpdateBoardSchema, PaginationSchema, BoardSearchSchema } from '../utils/validation.js';
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js';
import { notifyBoard } from '../utils/notifications.js';
import { logActivity } from '../utils/activity.js';
import { z } from 'zod';
import { ActivityAction as PrismaActivityAction, EntityType as PrismaEntityType, Prisma } from '@prisma/client';

type PrismaActivityWhereInput = Prisma.ActivityWhereInput;

const router = Router();

const MEMBER_SELECT = { id: true, email: true, name: true, avatar: true };
const MEMBER_INCLUDE = { include: { user: { select: MEMBER_SELECT } } };

const BOARD_LIST_INCLUDE = { members: MEMBER_INCLUDE };

const BOARD_DETAIL_INCLUDE = {
  members: MEMBER_INCLUDE,
  lists: {
    include: {
      _count: { select: { cards: true } },
    },
    orderBy: { position: 'asc' as const },
  },
};

const BOARD_CREATE_INCLUDE = {
  members: MEMBER_INCLUDE,
  lists: {
    orderBy: { position: 'asc' as const },
  },
};

router.get(
  '/',
  validateQuery(BoardSearchSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, q } = req.query as unknown as { page: number; limit: number; q?: string };
    const skip = (page - 1) * limit;
    const cacheKey = `boards:${req.user!.userId}:${page}:${limit}:${q || ''}`;

    const where = {
      members: { some: { userId: req.user!.userId } },
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const cached = await cacheGet<{ boards: unknown; total: number }>(cacheKey);
    if (cached) {
      res.json({ ok: true, data: cached.boards, meta: { page, limit, total: cached.total } });
      return;
    }

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        skip,
        take: limit,
        include: BOARD_LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.board.count({ where }),
    ]);

    await cacheSet(cacheKey, { boards, total });

    res.json({ ok: true, data: boards, meta: { page, limit, total } });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `board:${id}`;

    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      res.json({ ok: true, data: cached });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id },
      include: BOARD_DETAIL_INCLUDE,
    });

    if (!board) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Board not found' },
      });
    }

    await cacheSet(cacheKey, board);

    res.json({ ok: true, data: board });
  })
);

router.post(
  '/',
  validateBody(CreateBoardSchema),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const board = await prisma.board.create({
      data: {
        name,
        description,
        ownerId: req.user!.userId,
        members: {
          create: { userId: req.user!.userId, role: 'ADMIN' },
        },
        lists: {
          create: [
            { title: 'To Do', position: 1 },
            { title: 'In Progress', position: 2 },
            { title: 'Done', position: 3 },
          ],
        },
      },
      include: BOARD_CREATE_INCLUDE,
    });

    await cacheDel(`boards:${req.user!.userId}:*`);

    await logActivity({
      boardId: board.id,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'BOARD',
      entityId: board.id,
    });

    notifyBoard(board.id, 'board:created', board, req.user);
    res.status(201).json({ ok: true, data: board });
  })
);

router.put(
  '/:id',
  validateBody(UpdateBoardSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const board = await prisma.board.update({
      where: { id },
      data: { name, description },
      include: BOARD_DETAIL_INCLUDE,
    });

    await cacheDel(`board:${id}`);
    await cacheDel(`boards:${req.user!.userId}:*`);

    await logActivity({
      boardId: id,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'BOARD',
      entityId: id,
    });

    notifyBoard(id, 'board:updated', board, req.user);
    res.json({ ok: true, data: board });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await logActivity({
      boardId: id,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'BOARD',
      entityId: id,
    });

    await prisma.board.delete({ where: { id } });

    await cacheDel(`board:${id}`);
    await cacheDel(`boards:${req.user!.userId}:*`);

    notifyBoard(id, 'board:deleted', { id }, req.user);
    res.json({ ok: true, data: { success: true } });
  })
);

const ActivityFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.nativeEnum(PrismaActivityAction).optional(),
  entityType: z.nativeEnum(PrismaEntityType).optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

router.get(
  '/:id/activities',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const parsed = ActivityFilterSchema.safeParse(req.query);
    if (!parsed.success) throw new AppError('VALIDATION_FAILED', 'Invalid filter parameters', 422, parsed.error.flatten());
    const filters = parsed.data;
    const skip = (filters.page - 1) * filters.limit;

    const where: Record<string, unknown> = { boardId: id };
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
        where: where as PrismaActivityWhereInput,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.activity.count({ where: where as PrismaActivityWhereInput }),
    ]);

    res.json({
      ok: true,
      data: activities,
      meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
    });
  })
);

export default router;

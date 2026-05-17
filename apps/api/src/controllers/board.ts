import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { CreateBoardSchema, UpdateBoardSchema, PaginationSchema, BoardSearchSchema } from '../utils/validation.js';
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js';
import { notifyBoard } from '../utils/notifications.js';

const router = Router();

const CARD_INCLUDE = {
  comments: { include: { user: { select: { id: true, name: true, avatar: true } } } },
  cardLabels: true,
  cardAssignees: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } },
};

const LIST_INCLUDE = {
  cards: { include: CARD_INCLUDE, orderBy: { position: 'asc' as const } },
};

const BOARD_INCLUDE = {
  members: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } },
  lists: { include: LIST_INCLUDE, orderBy: { position: 'asc' as const } },
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
        include: BOARD_INCLUDE,
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
      include: BOARD_INCLUDE,
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
      include: BOARD_INCLUDE,
    });

    await cacheDel(`boards:${req.user!.userId}:*`);

    await logActivity({
      boardId: board.id,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'BOARD',
      entityId: board.id,
    });

    notifyBoard(board.id, 'board:created', board);
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
      include: BOARD_INCLUDE,
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

    notifyBoard(id, 'board:updated', board);
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

    notifyBoard(id, 'board:deleted', { id });
    res.json({ ok: true, data: { success: true } });
  })
);

router.get(
  '/:id/activities',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const activities = await prisma.activity.findMany({
      where: { boardId: id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ ok: true, data: activities });
  })
);

export default router;

import { Router } from 'express';
import { prisma } from '../app.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { adminGuard } from '../middleware/auth.js';
import { AppError } from '../errors.js';
import { PAGINATION, ANALYTICS, ENTITY_TYPES, ACTIVITY_ACTIONS } from '../config/constants.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();

router.use(adminGuard);

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(PAGINATION.MIN_PAGE).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
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
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
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
          id: true,
          name: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
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
  page: z.coerce.number().int().min(PAGINATION.MIN_PAGE).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  boardId: z.string().optional(),
  action: z
    .enum([
      ACTIVITY_ACTIONS.CREATE,
      ACTIVITY_ACTIONS.UPDATE,
      ACTIVITY_ACTIONS.DELETE,
      ACTIVITY_ACTIONS.MOVE,
    ])
    .optional(),
  entityType: z
    .enum([ENTITY_TYPES.BOARD, ENTITY_TYPES.LIST, ENTITY_TYPES.CARD, ENTITY_TYPES.COMMENT])
    .optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

router.get(
  '/activities',
  asyncHandler(async (req, res) => {
    const parsed = ActivityFilterSchema.parse(req.query);
    const filters = {
      page: Number(parsed.page),
      limit: Number(parsed.limit),
      boardId: parsed.boardId,
      action: parsed.action,
      entityType: parsed.entityType,
      userId: parsed.userId,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
    };
    const skip = (filters.page - 1) * filters.limit;

    const where: Record<string, unknown> = {};
    if (filters.boardId) where.boardId = filters.boardId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom as string);
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.dateTo as string);
      }
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
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
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

router.get(
  '/analytics',
  asyncHandler(async (_, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - ANALYTICS.DAYS_LOOKBACK);

    // Fetch basic stats
    const [users, boards, lists, cards, comments] = await Promise.all([
      prisma.user.count(),
      prisma.board.count(),
      prisma.list.count(),
      prisma.card.count(),
      prisma.comment.count(),
    ]);

    // Fetch daily activity for last 30 days
    const activities = await prisma.activity.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, action: true, entityType: true, userId: true },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate daily metrics
    const dailyMetrics = new Map<
      string,
      { cardCreated: number; cardCompleted: number; commentAdded: number; userActive: Set<string> }
    >();
    for (const activity of activities) {
      const date = activity.createdAt.toISOString().split('T')[0];
      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, {
          cardCreated: 0,
          cardCompleted: 0,
          commentAdded: 0,
          userActive: new Set(),
        });
      }
      const metric = dailyMetrics.get(date)!;
      if (activity.entityType === 'CARD' && activity.action === 'CREATE') metric.cardCreated++;
      if (activity.entityType === 'CARD' && activity.action === 'UPDATE') metric.cardCompleted++;
      if (activity.entityType === 'COMMENT') metric.commentAdded++;
      metric.userActive.add(activity.userId);
    }

    const dailyActivity = Array.from(dailyMetrics.entries())
      .map(([date, metric]) => ({
        date,
        cardCreated: metric.cardCreated,
        cardCompleted: metric.cardCompleted,
        commentAdded: metric.commentAdded,
        userActive: metric.userActive.size,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fetch user engagement with correct relations
    const userStats = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        comments: true,
        boards: true,
      },
    });

    const userEngagement = await Promise.all(
      userStats.map(async (user) => {
        const lastActivity = await prisma.activity.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });
        const daysActive = Math.max(
          1,
          Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        );
        const boardsOwned = await prisma.board.count({ where: { ownerId: user.id } });

        return {
          userId: user.id,
          username: user.name,
          avatar: user.avatar,
          lastActive: lastActivity?.createdAt.toISOString() || user.createdAt.toISOString(),
          cardsCreated: user.boards.length || 0,
          commentsAdded: user.comments.length,
          boardsOwned,
          avgActivityPerDay: (user.comments.length + (user.boards.length || 0)) / daysActive,
        };
      })
    );

    // Fetch board usage with correct relations
    const boardStats = await prisma.board.findMany({
      include: {
        lists: { include: { cards: true } },
        members: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: ANALYTICS.TOP_BOARDS_USAGE_LIMIT,
    });

    const boardUsage = boardStats.map((board) => {
      const allCards = board.lists.flatMap((l) => l.cards);
      const archivedCards = allCards.filter((c) => c.archived).length;
      const cardActivities = activities.filter((a) => a.entityType === 'CARD');
      const daysActive = Math.max(
        1,
        Math.ceil(
          (new Date(board.updatedAt).getTime() - new Date(board.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      return {
        boardId: board.id,
        boardName: board.name,
        cardsTotal: allCards.length,
        cardsCompleted: archivedCards,
        members: board.members.length,
        lastActive: board.updatedAt.toISOString(),
        avgCardsPerDay: cardActivities.length / daysActive,
      };
    });

    // Top contributors
    const topContributors = userEngagement
      .sort((a, b) => b.cardsCreated + b.commentsAdded - (a.cardsCreated + a.commentsAdded))
      .slice(0, ANALYTICS.TOP_CONTRIBUTORS_LIMIT)
      .map((u) => ({
        name: u.username,
        avatar: u.avatar,
        contributions: u.cardsCreated + u.commentsAdded,
      }));

    // Most active boards
    const mostActiveBoards = boardUsage
      .sort((a, b) => b.avgCardsPerDay - a.avgCardsPerDay)
      .slice(0, ANALYTICS.TOP_BOARDS_LIMIT)
      .map((b) => ({
        name: b.boardName,
        activity: Math.round(b.avgCardsPerDay * 100) / 100,
      }));

    res.json({
      ok: true,
      data: {
        stats: { users, boards, lists, cards, comments },
        dailyActivity: dailyActivity.slice(-ANALYTICS.DAYS_LOOKBACK),
        userEngagement,
        boardUsage,
        topContributors,
        mostActiveBoards,
      },
    });
  })
);

export default router;

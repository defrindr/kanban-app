import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { CreateListSchema, UpdateListSchema, PaginationSchema } from '../utils/validation.js';
import { notifyBoard } from '../utils/notifications.js';
import { logActivity } from '../utils/activity.js';

const CARD_INCLUDE = {
  comments: { include: { user: { select: { id: true, name: true, avatar: true } } } },
  cardLabels: true,
  cardAssignees: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } },
};

const router = Router();

router.get(
  '/:id/cards',
  validateQuery(PaginationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const skip = (page - 1) * limit;

    const list = await prisma.list.findUnique({ where: { id } });
    if (!list) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'List not found' },
      });
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where: { listId: id },
        skip,
        take: limit,
        include: CARD_INCLUDE,
        orderBy: { position: 'asc' },
      }),
      prisma.card.count({ where: { listId: id } }),
    ]);

    res.json({ ok: true, data: cards, meta: { page, limit, total } });
  })
);

router.post(
  '/',
  validateBody(CreateListSchema),
  asyncHandler(async (req, res) => {
    const { boardId, title, position } = req.body;

    const list = await prisma.list.create({
      data: { boardId, title, position: position || 1 },
    });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'LIST',
      entityId: list.id,
    });

    notifyBoard(boardId, 'list:created', list, req.user);
    res.status(201).json({ ok: true, data: list });
  })
);

router.put(
  '/:id',
  validateBody(UpdateListSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, position } = req.body;

    const existing = await prisma.list.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'List not found' },
      });
    }

    const list = await prisma.list.update({
      where: { id },
      data: { title, position },
    });

    await logActivity({
      boardId: existing.boardId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'LIST',
      entityId: id,
    });

    notifyBoard(existing.boardId, 'list:updated', list, req.user);
    res.json({ ok: true, data: list });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const list = await prisma.list.findUnique({ where: { id } });
    if (!list) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'List not found' },
      });
    }

    await logActivity({
      boardId: list.boardId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'LIST',
      entityId: id,
    });

    await prisma.list.delete({ where: { id } });
    notifyBoard(list.boardId, 'list:deleted', { id }, req.user);
    res.json({ ok: true, data: { success: true } });
  })
);

export default router;

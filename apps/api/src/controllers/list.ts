import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { CreateListSchema, UpdateListSchema } from '../utils/validation.js';
import { notifyBoard } from '../utils/notifications.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.post(
  '/',
  validateBody(CreateListSchema),
  asyncHandler(async (req, res) => {
    const { boardId, title, position } = req.body;

    const list = await prisma.list.create({
      data: { boardId, title, position: position || 1 },
      include: { cards: true },
    });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'LIST',
      entityId: list.id,
    });

    notifyBoard(boardId, 'list:created', list);
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

    notifyBoard(existing.boardId, 'list:updated', list);
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
    notifyBoard(list.boardId, 'list:deleted', { id });
    res.json({ ok: true, data: { success: true } });
  })
);

export default router;

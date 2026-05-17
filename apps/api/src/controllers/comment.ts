import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { authGuard } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { CreateCommentSchema, UpdateCommentSchema, PaginationSchema } from '../utils/validation.js';
import { notifyBoard, notifyUser } from '../utils/notifications.js';
import { addNotification } from '../utils/notification-store.js';
import { logActivity } from '../utils/activity.js';
import { sendEmail, commentNotificationEmail } from '../utils/email.js';
import { ACTIVITY_METADATA } from '../config/constants.js';

const router = Router();

router.use(authGuard);

router.get(
  '/card/:cardId',
  validateQuery(PaginationSchema),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const skip = (page - 1) * limit;

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { cardId },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where: { cardId } }),
    ]);

    res.json({ ok: true, data: comments, meta: { page, limit, total } });
  })
);

router.post(
  '/card/:cardId',
  validateBody(CreateCommentSchema),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { content } = req.body;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { select: { boardId: true } } },
    });
    if (!card) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const comment = await prisma.comment.create({
      data: { cardId, userId: req.user!.userId, content },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    await logActivity({
      boardId: card.list.boardId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'COMMENT',
      entityId: comment.id,
      metadata: { entityName: card.title, content: content.slice(0, ACTIVITY_METADATA.CONTENT_PREVIEW_LENGTH) },
    });

    notifyBoard(card.list.boardId, 'comment:created', comment, req.user);

    const [cardInfo, assignees] = await Promise.all([
      prisma.card.findUnique({ where: { id: cardId }, select: { title: true, list: { select: { board: { select: { name: true } } } } } }),
      prisma.cardAssignee.findMany({ where: { cardId }, include: { user: { select: { email: true, id: true } } } }),
    ]);
    if (cardInfo) {
      const commenter = req.user!.email.split('@')[0];
      assignees
        .filter(a => a.userId !== req.user!.userId)
        .forEach(a => {
          const msg = `${commenter} commented on "${cardInfo.title}"`;
          const notif = addNotification(a.userId, { userId: a.userId, type: 'comment', message: msg, read: false });
          notifyUser(a.userId, 'notification:new', notif);
        });
      const emails = assignees
        .map(a => a.user.email)
        .filter(e => e !== req.user!.email);
      if (emails.length > 0) {
        const opts = commentNotificationEmail(req.user!.email, cardInfo.title, cardInfo.list.board.name, content, `${process.env.APP_URL || 'http://localhost:4000'}/boards/${card.list.boardId}/cards/${cardId}`);
        emails.forEach(to => sendEmail({ to, ...opts }));
      }
    }

    res.status(201).json({ ok: true, data: comment });
  })
);

router.put(
  '/:id',
  validateBody(UpdateCommentSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { card: { include: { list: { select: { boardId: true } } } } },
    });
    if (!comment) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
    }
    if (comment.userId !== req.user!.userId) {
      return res.status(403).json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit your own comments' },
      });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    await logActivity({
      boardId: comment.card.list.boardId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'COMMENT',
      entityId: id,
      metadata: { content: updated.content.slice(0, ACTIVITY_METADATA.CONTENT_PREVIEW_LENGTH) },
    });

    notifyBoard(comment.card.list.boardId, 'comment:updated', updated, req.user);
    res.json({ ok: true, data: updated });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { card: { include: { list: { select: { boardId: true } } } } },
    });
    if (!comment) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
    }
    if (comment.userId !== req.user!.userId) {
      return res.status(403).json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own comments' },
      });
    }

    await logActivity({
      boardId: comment.card.list.boardId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'COMMENT',
      entityId: id,
      metadata: { content: comment.content.slice(0, ACTIVITY_METADATA.CONTENT_PREVIEW_LENGTH) },
    });

    await prisma.comment.delete({ where: { id } });
    notifyBoard(comment.card.list.boardId, 'comment:deleted', { id }, req.user);
    res.json({ ok: true, data: { success: true } });
  })
);

export default router;

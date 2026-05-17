import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import {
  CreateCardSchema, UpdateCardSchema, MoveCardSchema,
  CreateCardLabelSchema, AddCardAssigneeSchema, CardSearchSchema,
} from '../utils/validation.js';
import { notifyBoard, notifyUser } from '../utils/notifications.js';
import { addNotification } from '../utils/notification-store.js';
import { logActivity } from '../utils/activity.js';
import { upload } from '../middleware/upload.js';
import { storage } from '../utils/storage.js';
import { sendEmail, assignmentNotificationEmail, commentNotificationEmail } from '../utils/email.js';
import { FIELD_LENGTHS, DEFAULTS } from '../config/constants.js';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';

const router = Router();

async function findBoardId(cardId: string): Promise<string | null> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { list: { select: { boardId: true } } },
  });
  return card?.list.boardId ?? null;
}

router.get(
  '/search',
  validateQuery(CardSearchSchema),
  asyncHandler(async (req, res) => {
    const {
      boardId, q, listId, labels, assigneeId,
      archived, dueBefore, dueAfter, page, limit,
    } = req.query as unknown as {
      boardId?: string; q?: string; listId?: string; labels?: string;
      assigneeId?: string; archived?: boolean;
      dueBefore?: string; dueAfter?: string;
      page: number; limit: number;
    };

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (boardId) where.list = { boardId };

    if (q) where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
    if (listId) where.listId = listId;
    if (assigneeId) where.cardAssignees = { some: { userId: assigneeId } };
    if (archived !== undefined) where.archived = archived;
    if (labels) where.labels = { hasSome: labels.split(',') };
    if (dueBefore || dueAfter) {
      const dueFilter: Record<string, string> = {};
      if (dueBefore) dueFilter.lte = new Date(dueBefore).toISOString();
      if (dueAfter) dueFilter.gte = new Date(dueAfter).toISOString();
      where.dueDate = dueFilter;
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take: limit,
        include: {
          list: { select: { id: true, title: true, boardId: true } },
          comments: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          cardLabels: true,
          cardAssignees: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.card.count({ where }),
    ]);

    res.json({ ok: true, data: cards, meta: { page, limit, total } });
  })
);

router.post(
  '/',
  validateBody(CreateCardSchema),
  asyncHandler(async (req, res) => {
    const { listId, title, description, position } = req.body;

    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'List not found' },
      });
    }

     const card = await prisma.card.create({
       data: { listId, title, description, position: position || DEFAULTS.CARD_POSITION, labels: [], assignees: [] },
       include: { comments: { include: { user: { select: { id: true, name: true, avatar: true } } } }, cardLabels: true, cardAssignees: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } } },
     });

    await logActivity({
      boardId: list.boardId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'CARD',
      entityId: card.id,
      metadata: { entityName: card.title },
    });

    notifyBoard(list.boardId, 'card:created', card, req.user);
    res.status(201).json({ ok: true, data: card });
  })
);

router.put(
  '/:id',
  validateBody(UpdateCardSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, labels, assignees, position, startDate, dueDate, coverColor, archived, checklist, attachments } = req.body;

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (labels !== undefined) data.labels = labels;
    if (assignees !== undefined) data.assignees = assignees;
    if (position !== undefined) data.position = position;
    if (coverColor !== undefined) data.coverColor = coverColor;
    if (archived !== undefined) data.archived = archived;
    if (checklist !== undefined) data.checklist = checklist;
    if (attachments !== undefined) data.attachments = attachments;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    const card = await prisma.card.update({
      where: { id },
      data,
      include: { comments: { include: { user: { select: { id: true, name: true, avatar: true } } } }, cardLabels: true, cardAssignees: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } } },
    });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'CARD',
      entityId: id,
      metadata: { entityName: card.title },
    });

    notifyBoard(boardId, 'card:updated', card, req.user);
    res.json({ ok: true, data: card });
  })
);

router.post(
  '/move',
  validateBody(MoveCardSchema),
  asyncHandler(async (req, res) => {
    const { cardId, fromListId, toListId, newPosition } = req.body;

    const boardId = await findBoardId(cardId);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const card = await prisma.card.update({
      where: { id: cardId },
      data: { listId: toListId, position: newPosition },
      include: { comments: { include: { user: { select: { id: true, name: true, avatar: true } } } }, cardLabels: true, cardAssignees: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } } },
    });

    const [fromList, toList] = await Promise.all([
      prisma.list.findUnique({ where: { id: fromListId }, select: { title: true } }),
      prisma.list.findUnique({ where: { id: toListId }, select: { title: true } }),
    ]);

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'MOVE',
      entityType: 'CARD',
      entityId: cardId,
      metadata: {
        entityName: card.title,
        fromListId,
        toListId,
        fromListTitle: fromList?.title,
        toListTitle: toList?.title,
        newPosition,
      },
    });

    notifyBoard(boardId, 'card:moved', { card, fromListId, toListId, newPosition }, req.user);
    res.json({ ok: true, data: card });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const card = await prisma.card.findUnique({ where: { id }, select: { title: true } });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'CARD',
      entityId: id,
      metadata: { entityName: card?.title },
    });

    await prisma.card.delete({ where: { id } });

    res.json({ ok: true, data: { success: true } });
  })
);

router.post(
  '/:id/labels',
  validateBody(CreateCardLabelSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const label = await prisma.cardLabel.create({
      data: { cardId: id, name, color },
    });

    notifyBoard(boardId, 'card:label:added', { cardId: id, label }, req.user);
    res.status(201).json({ ok: true, data: label });
  })
);

router.delete(
  '/:id/labels/:labelId',
  asyncHandler(async (req, res) => {
    const { id, labelId } = req.params;

    const label = await prisma.cardLabel.findUnique({ where: { id: labelId } });
    if (!label || label.cardId !== id) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Label not found' },
      });
    }

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    await prisma.cardLabel.delete({ where: { id: labelId } });

    const list = await prisma.card.findUnique({ where: { id }, select: { listId: true } });
    notifyBoard(boardId, 'card:label:removed', { cardId: id, labelId, listId: list?.listId }, req.user);
    res.json({ ok: true, data: { success: true } });
  })
);

router.post(
  '/:id/assignees',
  validateBody(AddCardAssigneeSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const assignee = await prisma.cardAssignee.create({
      data: { cardId: id, userId },
    });

    notifyBoard(boardId, 'card:assignee:added', { cardId: id, assignee }, req.user);

    const [assignedUser, card] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      prisma.card.findUnique({ where: { id }, select: { title: true, list: { select: { board: { select: { name: true } } } } } }),
    ]);
    if (assignedUser && card) {
      const msg = `${req.user!.email.split('@')[0]} assigned you to "${card.title}"`;
      const notif = addNotification(userId, { userId, type: 'assignment', message: msg, read: false });
      notifyUser(userId, 'notification:new', notif);

      const opts = assignmentNotificationEmail(req.user!.email, card.title, card.list.board.name, `${process.env.APP_URL || 'http://localhost:4000'}/boards/${boardId}/cards/${id}`);
      sendEmail({ to: assignedUser.email, ...opts });
    }

    res.status(201).json({ ok: true, data: assignee });
  })
);

router.post(
  '/:id/comments',
  asyncHandler(async (req, res) => {
     const { id } = req.params;
     const { content } = req.body;
     if (!content || typeof content !== 'string' || content.length > FIELD_LENGTHS.COMMENT_MAX) {
       return res.status(422).json({ ok: false, error: { code: 'VALIDATION_FAILED', message: `Content is required (max ${FIELD_LENGTHS.COMMENT_MAX} chars)` } });
    }
    const comment = await prisma.comment.create({
      data: { cardId: id, userId: req.user!.userId, content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const boardId2 = await findBoardId(id);
    if (boardId2) {
      notifyBoard(boardId2, 'card:comment:added', { cardId: id, comment }, req.user);

      const [cardInfo, assignees] = await Promise.all([
        prisma.card.findUnique({ where: { id }, select: { title: true, list: { select: { board: { select: { name: true } } } } } }),
        prisma.cardAssignee.findMany({ where: { cardId: id }, include: { user: { select: { email: true, id: true } } } }),
      ]);
      if (cardInfo) {
        const commenter = req.user!.email.split('@')[0];
        for (const a of assignees
          .filter(a => a.userId !== req.user!.userId)) {
            const msg = `${commenter} commented on "${cardInfo.title}"`;
            const notif = addNotification(a.userId, { userId: a.userId, type: 'comment', message: msg, read: false });
            notifyUser(a.userId, 'notification:new', notif);
          }
        const emails = assignees
          .map(a => a.user.email)
          .filter(e => e !== req.user!.email);
        if (emails.length > 0) {
          const opts = commentNotificationEmail(req.user!.email, cardInfo.title, cardInfo.list.board.name, content, `${process.env.APP_URL || 'http://localhost:4000'}/boards/${boardId2}/cards/${id}`);
          for (const to of emails) sendEmail({ to, ...opts });
        }
      }
    }
    res.status(201).json({ ok: true, data: comment });
  })
);

router.delete(
  '/:id/assignees/:userId',
  asyncHandler(async (req, res) => {
    const { id, userId } = req.params;

    const assignee = await prisma.cardAssignee.findFirst({ where: { cardId: id, userId } });
    if (!assignee) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Assignee not found' },
      });
    }

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    await prisma.cardAssignee.delete({ where: { id: assignee.id } });

    notifyBoard(boardId, 'card:assignee:removed', { cardId: id, userId }, req.user);
    res.json({ ok: true, data: { success: true } });
  })
);

router.post(
  '/:id/attachments',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    if (!req.file) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_FAILED', message: 'File is required' },
      });
    }

    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const fileKey = `cards/${id}/${crypto.randomUUID()}-${req.file.originalname}`;
    const url = await storage.save(fileKey, req.file.buffer, req.file.mimetype);

    const attachment = {
      id: crypto.randomUUID(),
      name: req.file.originalname,
      url,
      key: fileKey,
      type: req.file.mimetype,
      size: req.file.size,
      createdAt: new Date().toISOString(),
    };

    const current = (card.attachments as Prisma.JsonArray) || [];
    await prisma.card.update({
      where: { id },
      data: { attachments: [...current, attachment] as Prisma.JsonArray },
    });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'CARD',
      entityId: id,
      metadata: { attachmentName: req.file.originalname } as Prisma.InputJsonValue,
    });

    notifyBoard(boardId, 'card:attachment:added', { cardId: id, attachment }, req.user);
    res.status(201).json({ ok: true, data: attachment });
  })
);

router.delete(
  '/:id/attachments/:attachmentId',
  asyncHandler(async (req, res) => {
    const { id, attachmentId } = req.params;

    const boardId = await findBoardId(id);
    if (!boardId) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Card not found' },
      });
    }

    const current = (card.attachments as Prisma.JsonArray) || [];
    const list = current as Array<Record<string, unknown>>;
    const attachment = list.find(a => a.id === attachmentId);
    if (!attachment) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Attachment not found' },
      });
    }

    const remaining = list.filter(a => a.id !== attachmentId);
    await prisma.card.update({
      where: { id },
      data: { attachments: remaining as Prisma.JsonArray },
    });

    const fileKey = attachment.key as string;
    if (fileKey) {
      await storage.delete(fileKey);
    }

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'CARD',
      entityId: id,
      metadata: { attachmentName: attachment.name } as Prisma.InputJsonValue,
    });

    notifyBoard(boardId, 'card:attachment:removed', { cardId: id, attachmentId }, req.user);
    res.json({ ok: true, data: { success: true } });
  })
);

export default router;

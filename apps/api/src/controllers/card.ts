import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import {
  CreateCardSchema, UpdateCardSchema, MoveCardSchema,
  CreateCardLabelSchema, AddCardAssigneeSchema, CardSearchSchema,
} from '../utils/validation.js';
import { notifyBoard } from '../utils/notifications.js';
import { logActivity } from '../utils/activity.js';
import { upload, UPLOAD_DIR } from '../middleware/upload.js';
import { unlinkSync } from 'fs';
import { join } from 'path';
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
      boardId: string; q?: string; listId?: string; labels?: string;
      assigneeId?: string; archived?: boolean;
      dueBefore?: string; dueAfter?: string;
      page: number; limit: number;
    };

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      list: { boardId },
    };

    if (q) where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
    if (listId) where.listId = listId;
    if (assigneeId) where.assignees = { has: assigneeId };
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
      data: { listId, title, description, position: position || 1, labels: [], assignees: [] },
      include: { comments: { include: { user: { select: { id: true, name: true, avatar: true } } } }, cardLabels: true, cardAssignees: { include: { user: { select: { id: true, email: true, name: true, avatar: true } } } } },
    });

    await logActivity({
      boardId: list.boardId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'CARD',
      entityId: card.id,
    });

    notifyBoard(list.boardId, 'card:created', card);
    res.status(201).json({ ok: true, data: card });
  })
);

router.put(
  '/:id',
  validateBody(UpdateCardSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, labels, assignees, position, dueDate, coverColor, archived, checklist, attachments } = req.body;

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
    });

    notifyBoard(boardId, 'card:updated', card);
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

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'MOVE',
      entityType: 'CARD',
      entityId: cardId,
      metadata: { toListId, newPosition },
    });

    notifyBoard(boardId, 'card:moved', { card, fromListId, toListId, newPosition });
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

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'CARD',
      entityId: id,
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

    notifyBoard(boardId, 'card:label:added', { cardId: id, label });
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
    notifyBoard(boardId, 'card:label:removed', { cardId: id, labelId, listId: list?.listId });
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

    notifyBoard(boardId, 'card:assignee:added', { cardId: id, assignee });
    res.status(201).json({ ok: true, data: assignee });
  })
);

router.post(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.length > 2000) {
      return res.status(422).json({ ok: false, error: { code: 'VALIDATION_FAILED', message: 'Content is required (max 2000 chars)' } });
    }
    const comment = await prisma.comment.create({
      data: { cardId: id, userId: req.user!.userId, content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const boardId2 = await findBoardId(id);
    if (boardId2) {
      notifyBoard(boardId2, 'card:comment:added', { cardId: id, comment });
    }
    res.status(201).json({ ok: true, data: comment });
  })
);

router.delete(
  '/:id/assignees/:assigneeId',
  asyncHandler(async (req, res) => {
    const { id, assigneeId } = req.params;

    const assignee = await prisma.cardAssignee.findUnique({ where: { id: assigneeId } });
    if (!assignee || assignee.cardId !== id) {
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

    await prisma.cardAssignee.delete({ where: { id: assigneeId } });

    notifyBoard(boardId, 'card:assignee:removed', { cardId: id, assigneeId });
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

    const attachment = {
      id: crypto.randomUUID(),
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
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

    notifyBoard(boardId, 'card:attachment:added', { cardId: id, attachment });
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

    try {
      const filename = (attachment.url as string).replace('/uploads/', '');
      unlinkSync(join(UPLOAD_DIR, filename));
    } catch {}

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'CARD',
      entityId: id,
      metadata: { attachmentName: attachment.name } as Prisma.InputJsonValue,
    });

    notifyBoard(boardId, 'card:attachment:removed', { cardId: id, attachmentId });
    res.json({ ok: true, data: { success: true } });
  })
);

export default router;

import { Router } from 'express';
import { randomBytes } from 'crypto';
import { prisma, io } from '../app.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { AppError } from '../errors.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

const VALID_EVENTS = [
  'board:created', 'board:updated', 'board:deleted',
  'list:created', 'list:updated', 'list:deleted',
  'card:created', 'card:updated', 'card:deleted', 'card:moved',
  'card:label:added', 'card:label:removed',
  'card:assignee:added', 'card:assignee:removed',
  'card:attachment:added', 'card:attachment:removed',
  'comment:created', 'comment:updated', 'comment:deleted',
  'member:added', 'member:removed', 'member:role:updated',
] as const;

const CreateWebhookSchema = z.object({
  url: z.string().url().max(500),
  events: z.array(z.enum(VALID_EVENTS)).min(1),
});

const UpdateWebhookSchema = z.object({
  url: z.string().url().max(500).optional(),
  events: z.array(z.enum(VALID_EVENTS)).min(1).optional(),
  active: z.boolean().optional(),
});

async function requireAdmin(boardId: string, userId: string) {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!member || member.role !== 'ADMIN') {
    throw new AppError('FORBIDDEN', 'Only board admins can manage webhooks', 403);
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    await requireAdmin(boardId, req.user!.userId);

    const webhooks = await prisma.webhook.findMany({
      where: { boardId },
      select: { id: true, url: true, events: true, active: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ ok: true, data: webhooks });
  })
);

router.post(
  '/',
  validateBody(CreateWebhookSchema),
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    await requireAdmin(boardId, req.user!.userId);

    const { url, events } = req.body;
    const secret = randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: { boardId, url, secret, events },
      select: { id: true, url: true, events: true, active: true, createdAt: true },
    });

    res.status(201).json({ ok: true, data: { ...webhook, secret } });
  })
);

router.put(
  '/:webhookId',
  validateBody(UpdateWebhookSchema),
  asyncHandler(async (req, res) => {
    const { boardId, webhookId } = req.params;
    await requireAdmin(boardId, req.user!.userId);

    const existing = await prisma.webhook.findFirst({
      where: { id: webhookId, boardId },
    });
    if (!existing) throw new AppError('NOT_FOUND', 'Webhook not found', 404);

    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: req.body,
      select: { id: true, url: true, events: true, active: true, createdAt: true, updatedAt: true },
    });

    io.to(`board:${boardId}`).emit('webhook:updated', webhook);
    res.json({ ok: true, data: webhook });
  })
);

router.delete(
  '/:webhookId',
  asyncHandler(async (req, res) => {
    const { boardId, webhookId } = req.params;
    await requireAdmin(boardId, req.user!.userId);

    const existing = await prisma.webhook.findFirst({
      where: { id: webhookId, boardId },
    });
    if (!existing) throw new AppError('NOT_FOUND', 'Webhook not found', 404);

    await prisma.webhook.delete({ where: { id: webhookId } });

    io.to(`board:${boardId}`).emit('webhook:deleted', { webhookId });
    res.json({ ok: true, data: { success: true } });
  })
);

export default router;

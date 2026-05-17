import { Router } from 'express';
import { prisma, io } from '../app.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { AppError } from '../errors.js';
import { AddMemberSchema, UpdateMemberRoleSchema } from '../utils/validation.js';
import { notifyBoard } from '../utils/notifications.js';
import { logActivity } from '../utils/activity.js';
import type { BoardRole } from '@prisma/client';

const router = Router({ mergeParams: true });

async function getBoardMember(boardId: string, userId: string) {
  return prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
}

async function requireAdmin(boardId: string, userId: string) {
  const member = await getBoardMember(boardId, userId);
  if (!member || member.role !== 'ADMIN') {
    throw new AppError('FORBIDDEN', 'Only board admins can perform this action', 403);
  }
  return member;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new AppError('NOT_FOUND', 'Board not found', 404);
    }

    const membership = await getBoardMember(boardId, req.user!.userId);
    if (!membership) {
      throw new AppError('FORBIDDEN', 'You are not a member of this board', 403);
    }

    const members = await prisma.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { user: { name: 'asc' } },
    });

    res.json({ ok: true, data: members });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;

    await requireAdmin(boardId, req.user!.userId);

    let { userId, role, name, email } = req.body;

    if (!userId && (!name || !email)) {
      throw new AppError('VALIDATION_FAILED', 'Provide userId or name+email', 422);
    }

    if (!userId) {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { name, email, password: '', avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) },
        });
      }
      userId = user.id;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    const existing = await getBoardMember(boardId, userId);
    if (existing) {
      throw new AppError('CONFLICT', 'User is already a member', 409);
    }

    const member = await prisma.boardMember.create({
      data: { boardId, userId, role: role || 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'BOARD',
      entityId: boardId,
      metadata: { addedUserId: userId, role },
    });

    notifyBoard(boardId, 'member:added', member);
    res.status(201).json({ ok: true, data: member });
  })
);

router.put(
  '/:memberId',
  validateBody(UpdateMemberRoleSchema),
  asyncHandler(async (req, res) => {
    const { boardId, memberId } = req.params;
    const { role } = req.body;

    await requireAdmin(boardId, req.user!.userId);

    const member = await prisma.boardMember.findUnique({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new AppError('NOT_FOUND', 'Member not found', 404);
    }

    const updated = await prisma.boardMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'BOARD',
      entityId: boardId,
      metadata: { targetUserId: member.userId, newRole: role },
    });

    notifyBoard(boardId, 'member:updated', updated);
    res.json({ ok: true, data: updated });
  })
);

router.delete(
  '/:memberId',
  asyncHandler(async (req, res) => {
    const { boardId, memberId } = req.params;

    const member = await prisma.boardMember.findUnique({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new AppError('NOT_FOUND', 'Member not found', 404);
    }

    const isSelf = member.userId === req.user!.userId;
    const isAdmin = (await getBoardMember(boardId, req.user!.userId))?.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      throw new AppError('FORBIDDEN', 'Only admins can remove other members', 403);
    }

    if (member.role === 'ADMIN' && !isSelf) {
      const adminCount = await prisma.boardMember.count({
        where: { boardId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new AppError('FORBIDDEN', 'Cannot remove the last admin', 403);
      }
    }

    await prisma.boardMember.delete({ where: { id: memberId } });

    await logActivity({
      boardId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'BOARD',
      entityId: boardId,
      metadata: { removedUserId: member.userId },
    });

    notifyBoard(boardId, 'member:removed', { memberId });
    res.json({ ok: true, data: { success: true } });
  })
);

export default router;

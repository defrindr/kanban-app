import { prisma, io } from '../app.js';
import type { ActivityAction, EntityType, Prisma } from '@prisma/client';

const ACTIVITY_INCLUDE = {
  user: { select: { id: true, name: true, avatar: true } },
};

export async function logActivity(params: {
  boardId: string;
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const activity = await prisma.activity.create({
    data: params,
    include: ACTIVITY_INCLUDE,
  });

  io.to(`board:${params.boardId}`).emit('activity:created', activity);
}

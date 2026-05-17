import { prisma } from '../app.js';
import type { ActivityAction, EntityType, Prisma } from '@prisma/client';

export async function logActivity(params: {
  boardId: string;
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activity.create({ data: params });
}

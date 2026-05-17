import type { ActivityAction, EntityType, Prisma } from '@prisma/client';
export declare function logActivity(params: {
    boardId: string;
    userId: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
}): Promise<void>;
//# sourceMappingURL=activity.d.ts.map
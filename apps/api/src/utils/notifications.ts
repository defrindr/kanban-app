import { io } from '../app.js';
import { notifyWebhooks } from './dispatch-webhooks.js';

export function notifyBoard(boardId: string, event: string, data: unknown, actor?: { userId: string; email: string }) {
  io.to(`board:${boardId}`).emit(event, data);
  if (actor) {
    void notifyWebhooks(boardId, event, actor, data as Record<string, unknown>);
  }
}

export function notifyUser(userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}

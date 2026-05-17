import { io } from '../app.js';

export function notifyBoard(boardId: string, event: string, data: unknown) {
  io.to(`board:${boardId}`).emit(event, data);
}

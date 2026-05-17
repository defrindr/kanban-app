import { Server, Socket } from 'socket.io';
import { prisma } from '../app.js';
import { logger } from '../utils/logger.js';
import { checkSocketRateLimit } from '../middleware/socket-rate-limit.js';
import {
  BoardJoinSchema, BoardLeaveSchema,
  ListCreateSchema, ListUpdateSchema, ListDeleteSchema,
  CardCreateSchema, CardUpdateSchema, CardMoveSchema, CardDeleteSchema,
  CommentAddSchema,
} from '../utils/socket-validation.js';

const boardRooms = new Map<string, Map<string, { id: string; name: string }>>();

function emitError(socket: Socket, event: string, message: string) {
  socket.emit('error', { ok: false, error: { code: 'VALIDATION_FAILED', message } });
}

function guarded(socket: Socket, event: string, fn: (...args: unknown[]) => Promise<void>) {
  return async (...args: unknown[]) => {
    if (!(await checkSocketRateLimit(socket, event))) return;
    await fn(...args);
  };
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as { userId: string; email: string } | undefined;
    if (user) socket.join(`user:${user.userId}`);

    socket.on('board:join', guarded(socket, 'board:join', async (raw: unknown) => {
      const parsed = BoardJoinSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'board:join', 'Invalid board ID');
        return;
      }
      const { boardId } = parsed.data;

      await socket.join(`board:${boardId}`);

      if (!boardRooms.has(boardId)) {
        boardRooms.set(boardId, new Map());
      }
      const room = boardRooms.get(boardId)!;
      if (user) {
        room.set(socket.id, { id: user.userId, name: user.email.split('@')[0] });
      }

      const users = Array.from(room.values());
      io.to(`board:${boardId}`).emit('user:presence', { boardId, users });
    }));

    socket.on('board:leave', guarded(socket, 'board:leave', async (raw: unknown) => {
      const parsed = BoardLeaveSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'board:leave', 'Invalid board ID');
        return;
      }
      const { boardId } = parsed.data;

      await socket.leave(`board:${boardId}`);

      const room = boardRooms.get(boardId);
      if (room) {
        room.delete(socket.id);
        const users = Array.from(room.values());
        io.to(`board:${boardId}`).emit('user:presence', { boardId, users });
              }
    }));

    socket.on('list:create', guarded(socket, 'list:create', async (raw: unknown) => {
      const parsed = ListCreateSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'list:create', 'Invalid list data');
        return;
      }
      try {
        const list = await prisma.list.create({
          data: parsed.data,
          include: { cards: true },
        });
        io.to(`board:${list.boardId}`).emit('list:created', list);
      } catch (err) {
        socket.emit('list:error', { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create list' } });
      }
    }));

    socket.on('list:update', guarded(socket, 'list:update', async (raw: unknown) => {
      const parsed = ListUpdateSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'list:update', 'Invalid list data');
        return;
      }
      try {
        const { listId, title } = parsed.data;
        const list = await prisma.list.update({
          where: { id: listId },
          data: { title },
        });
        io.to(`board:${list.boardId}`).emit('list:updated', list);
      } catch (err) {
        socket.emit('list:error', { ok: false, error: { code: 'NOT_FOUND', message: 'List not found' } });
      }
    }));

    socket.on('list:delete', guarded(socket, 'list:delete', async (raw: unknown) => {
      const parsed = ListDeleteSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'list:delete', 'Invalid list ID');
        return;
      }
      try {
        const list = await prisma.list.findUnique({ where: { id: parsed.data.listId } });
        if (!list) {
          socket.emit('list:error', { ok: false, error: { code: 'NOT_FOUND', message: 'List not found' } });
          return;
        }
        await prisma.list.delete({ where: { id: list.id } });
        io.to(`board:${list.boardId}`).emit('list:deleted', list.id);
      } catch (err) {
        socket.emit('list:error', { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete list' } });
      }
    }));

    socket.on('card:create', guarded(socket, 'card:create', async (raw: unknown) => {
      const parsed = CardCreateSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'card:create', 'Invalid card data');
        return;
      }
      try {
        const list = await prisma.list.findUnique({ where: { id: parsed.data.listId } });
        if (!list) {
          socket.emit('card:error', { ok: false, error: { code: 'NOT_FOUND', message: 'List not found' } });
          return;
        }
        const card = await prisma.card.create({
          data: { ...parsed.data, labels: [], assignees: [] },
          include: { comments: true },
        });
        io.to(`board:${list.boardId}`).emit('card:created', card);
      } catch (err) {
        socket.emit('card:error', { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create card' } });
      }
    }));

    socket.on('card:update', guarded(socket, 'card:update', async (raw: unknown) => {
      const parsed = CardUpdateSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'card:update', 'Invalid card data');
        return;
      }
      try {
        const { cardId, ...data } = parsed.data;
        const card = await prisma.card.update({
          where: { id: cardId },
          data,
          include: { comments: true },
        });
        const list = await prisma.list.findUnique({ where: { id: card.listId } });
        if (list) {
          io.to(`board:${list.boardId}`).emit('card:updated', card);
        }
      } catch (err) {
        socket.emit('card:error', { ok: false, error: { code: 'NOT_FOUND', message: 'Card not found' } });
      }
    }));

    socket.on('card:move', guarded(socket, 'card:move', async (raw: unknown) => {
      const parsed = CardMoveSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'card:move', 'Invalid move data');
        return;
      }
      try {
        const { cardId, toListId, newPosition } = parsed.data;
        const card = await prisma.card.update({
          where: { id: cardId },
          data: { listId: toListId, position: newPosition },
          include: { comments: true },
        });
        const list = await prisma.list.findUnique({ where: { id: toListId } });
        if (list) {
          io.to(`board:${list.boardId}`).emit('card:moved', { card, fromListId: parsed.data.fromListId, toListId, newPosition });
        }
      } catch (err) {
        socket.emit('card:error', { ok: false, error: { code: 'NOT_FOUND', message: 'Card not found' } });
      }
    }));

    socket.on('card:delete', guarded(socket, 'card:delete', async (raw: unknown) => {
      const parsed = CardDeleteSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'card:delete', 'Invalid card ID');
        return;
      }
      try {
        const card = await prisma.card.findUnique({ where: { id: parsed.data.cardId } });
        if (!card) {
          socket.emit('card:error', { ok: false, error: { code: 'NOT_FOUND', message: 'Card not found' } });
          return;
        }
        await prisma.card.delete({ where: { id: card.id } });
        const list = await prisma.list.findUnique({ where: { id: card.listId } });
        if (list) {
          io.to(`board:${list.boardId}`).emit('card:deleted', card.id);
        }
      } catch (err) {
        socket.emit('card:error', { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete card' } });
      }
    }));

    socket.on('comment:add', guarded(socket, 'comment:add', async (raw: unknown) => {
      const parsed = CommentAddSchema.safeParse(raw);
      if (!parsed.success) {
        emitError(socket, 'comment:add', 'Invalid comment data');
        return;
      }
      const userId = user?.userId;
      if (!userId) {
        socket.emit('comment:error', { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }
      try {
        const comment = await prisma.comment.create({
          data: { ...parsed.data, userId },
        });
        const card = await prisma.card.findUnique({ where: { id: parsed.data.cardId } });
        if (card) {
          const list = await prisma.list.findUnique({ where: { id: card.listId } });
          if (list) {
            io.to(`board:${list.boardId}`).emit('comment:added', comment);
          }
        }
      } catch (err) {
        socket.emit('comment:error', { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add comment' } });
      }
    }));

    socket.on('disconnect', () => {
      boardRooms.forEach((room, boardId) => {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          const users = Array.from(room.values());
          io.to(`board:${boardId}`).emit('user:presence', { boardId, users });
        }
      });
    });
  });
}

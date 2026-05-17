import { z } from 'zod';

const CuidSchema = z.string().cuid();

export const BoardJoinSchema = z.object({ boardId: CuidSchema });
export const BoardLeaveSchema = z.object({ boardId: CuidSchema });

export const ListCreateSchema = z.object({
  boardId: CuidSchema,
  title: z.string().min(1).max(100),
  position: z.number(),
});

export const ListUpdateSchema = z.object({
  listId: CuidSchema,
  title: z.string().min(1).max(100),
});

export const ListDeleteSchema = z.object({ listId: CuidSchema });

export const CardCreateSchema = z.object({
  listId: CuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  position: z.number(),
});

export const CardUpdateSchema = z.object({
  cardId: CuidSchema,
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  position: z.number().optional(),
});

export const CardMoveSchema = z.object({
  cardId: CuidSchema,
  fromListId: CuidSchema,
  toListId: CuidSchema,
  newPosition: z.number().int().positive(),
});

export const CardDeleteSchema = z.object({ cardId: CuidSchema });

export const CommentAddSchema = z.object({
  cardId: CuidSchema,
  content: z.string().min(1).max(2000),
});

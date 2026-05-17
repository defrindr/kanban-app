import { z } from 'zod';

export const CuidSchema = z.string().cuid();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const CreateListSchema = z.object({
  boardId: CuidSchema,
  title: z.string().min(1, 'Title is required').max(100),
  position: z.number().optional(),
});

export const UpdateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().optional(),
});

export const CreateCardSchema = z.object({
  listId: CuidSchema,
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  position: z.number().optional(),
});

export const UpdateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

export const MoveCardSchema = z.object({
  cardId: CuidSchema,
  fromListId: CuidSchema,
  toListId: CuidSchema,
  newPosition: z.number().int().positive(),
});

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type CreateListInput = z.infer<typeof CreateListSchema>;
export type UpdateListInput = z.infer<typeof UpdateListSchema>;
export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type MoveCardInput = z.infer<typeof MoveCardSchema>;
import { z } from 'zod';
import { PAGINATION, FIELD_LENGTHS, BOARD_ROLES, SEARCH_TYPES } from '../config/constants.js';

export const CuidSchema = z.string().cuid();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(PAGINATION.MIN_PAGE).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(PAGINATION.MIN_PAGE).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const CreateBoardSchema = z.object({
  name: z.string().min(FIELD_LENGTHS.NAME_MIN, 'Name is required').max(FIELD_LENGTHS.NAME_MAX),
  description: z.string().max(FIELD_LENGTHS.DESCRIPTION_MAX).optional(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().min(FIELD_LENGTHS.NAME_MIN).max(FIELD_LENGTHS.NAME_MAX).optional(),
  description: z.string().max(FIELD_LENGTHS.DESCRIPTION_MAX).optional(),
});

export const CreateListSchema = z.object({
  boardId: CuidSchema,
  title: z.string().min(FIELD_LENGTHS.TITLE_MIN, 'Title is required').max(FIELD_LENGTHS.TITLE_MAX),
  position: z.number().optional(),
});

export const UpdateListSchema = z.object({
  title: z.string().min(FIELD_LENGTHS.TITLE_MIN).max(FIELD_LENGTHS.TITLE_MAX).optional(),
  position: z.number().optional(),
});

export const CreateCardSchema = z.object({
  listId: CuidSchema,
  title: z.string().min(FIELD_LENGTHS.CARD_TITLE_MIN, 'Title is required').max(FIELD_LENGTHS.CARD_TITLE_MAX),
  description: z.string().max(FIELD_LENGTHS.CARD_DESCRIPTION_MAX).optional(),
  position: z.number().optional(),
});

export const UpdateCardSchema = z.object({
  title: z.string().min(FIELD_LENGTHS.CARD_TITLE_MIN).max(FIELD_LENGTHS.CARD_TITLE_MAX).optional(),
  description: z.string().max(FIELD_LENGTHS.CARD_DESCRIPTION_MAX).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  archived: z.boolean().optional(),
  checklist: z.array(z.object({ id: z.string(), text: z.string(), done: z.boolean() })).optional(),
  attachments: z.array(z.object({ id: z.string(), name: z.string(), url: z.string(), type: z.string(), size: z.number().optional(), createdAt: z.string() })).optional(),
});

export const MoveCardSchema = z.object({
  cardId: CuidSchema,
  fromListId: CuidSchema,
  toListId: CuidSchema,
  newPosition: z.number().int().positive(),
});

export const CreateCardLabelSchema = z.object({
  name: z.string().min(FIELD_LENGTHS.LABEL_NAME_MIN).max(FIELD_LENGTHS.LABEL_NAME_MAX),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3B82F6'),
});

export const DeleteCardLabelSchema = z.object({
  labelId: CuidSchema,
});

export const AddMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([BOARD_ROLES.ADMIN, BOARD_ROLES.MEMBER, BOARD_ROLES.VIEWER]).optional(),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum([BOARD_ROLES.ADMIN, BOARD_ROLES.MEMBER, BOARD_ROLES.VIEWER]),
});

export const CreateCommentSchema = z.object({
  content: z.string().min(FIELD_LENGTHS.COMMENT_MIN).max(FIELD_LENGTHS.COMMENT_MAX),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(FIELD_LENGTHS.COMMENT_MIN).max(FIELD_LENGTHS.COMMENT_MAX),
});

export const AddCardAssigneeSchema = z.object({
  userId: z.string().min(1),
});

export const BoardSearchSchema = PaginationSchema.extend({
  q: z.string().optional(),
});

export const CardSearchSchema = z.object({
  boardId: CuidSchema.optional(),
  q: z.string().optional(),
  listId: CuidSchema.optional(),
  labels: z.string().optional(),
  assigneeId: z.string().optional(),
  archived: z.coerce.boolean().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  page: z.coerce.number().int().min(PAGINATION.MIN_PAGE).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(PAGINATION.MIN_PAGE).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const DeleteCardAssigneeSchema = z.object({
  assigneeId: CuidSchema,
});

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type CreateListInput = z.infer<typeof CreateListSchema>;
export type UpdateListInput = z.infer<typeof UpdateListSchema>;
export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type MoveCardInput = z.infer<typeof MoveCardSchema>;
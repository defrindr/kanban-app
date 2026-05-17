import { z } from 'zod'

export const BoardMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().optional(),
})

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.enum(['blue', 'red', 'purple', 'green', 'orange', 'gray']),
})

export const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number().optional(),
  createdAt: z.string(),
})

export const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
})

export const CommentSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  content: z.string(),
  createdAt: z.string(),
})

export const CardSchema = z.object({
  id: z.string(),
  listId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  position: z.number(),
  labels: z.array(LabelSchema),
  assignees: z.array(BoardMemberSchema),
  comments: z.array(CommentSchema),
  checklist: z.array(ChecklistItemSchema).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  dueDate: z.string().optional(),
  coverColor: z.string().optional(),
  archived: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  listName: z.string().optional(),
  boardId: z.string().optional(),
})

export const ListSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  title: z.string(),
  position: z.number(),
  cards: z.array(CardSchema),
})

export const BoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  visibility: z.enum(['workspace', 'private', 'public']).optional(),
  ownerId: z.string(),
  lists: z.array(ListSchema),
  members: z.array(BoardMemberSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ActivitySchema = z.object({
  id: z.string(),
  boardId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  action: z.enum(['created', 'moved', 'updated', 'deleted', 'commented']),
  entityType: z.enum(['board', 'list', 'card', 'comment']),
  entityId: z.string(),
  entityName: z.string().optional(),
  fromListId: z.string().optional(),
  toListId: z.string().optional(),
  fromListTitle: z.string().optional(),
  toListTitle: z.string().optional(),
  content: z.string().optional(),
  createdAt: z.string(),
})

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
})

export type BoardMember = z.infer<typeof BoardMemberSchema>
export type Label = z.infer<typeof LabelSchema>
export type Attachment = z.infer<typeof AttachmentSchema>
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>
export type Comment = z.infer<typeof CommentSchema>
export type Card = z.infer<typeof CardSchema>
export type List = z.infer<typeof ListSchema>
export type Board = z.infer<typeof BoardSchema>
export type Activity = z.infer<typeof ActivitySchema>
export type Notification = z.infer<typeof NotificationSchema>

export const LABEL_OPTIONS: { name: string; color: Label['color'] }[] = [
  { name: 'Frontend', color: 'blue' },
  { name: 'Backend', color: 'orange' },
  { name: 'Design', color: 'purple' },
  { name: 'DevOps', color: 'green' },
  { name: 'Bug', color: 'red' },
  { name: 'Docs', color: 'gray' },
]

export const BOARD_TEMPLATES = [
  { name: 'Product Roadmap', description: 'Plan and track product features' },
  { name: 'Sprint Board', description: 'Agile sprint management with backlog' },
  { name: 'Project Tracker', description: 'Track project tasks and milestones' },
  { name: 'Bug Tracker', description: 'Track and triage bugs' },
]
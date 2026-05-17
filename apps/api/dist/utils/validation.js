"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCardAssigneeSchema = exports.AddCardAssigneeSchema = exports.UpdateCommentSchema = exports.CreateCommentSchema = exports.DeleteCardLabelSchema = exports.CreateCardLabelSchema = exports.MoveCardSchema = exports.UpdateCardSchema = exports.CreateCardSchema = exports.UpdateListSchema = exports.CreateListSchema = exports.UpdateBoardSchema = exports.CreateBoardSchema = exports.PaginationSchema = exports.CuidSchema = void 0;
const zod_1 = require("zod");
exports.CuidSchema = zod_1.z.string().cuid();
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.CreateBoardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    description: zod_1.z.string().max(500).optional(),
});
exports.UpdateBoardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
});
exports.CreateListSchema = zod_1.z.object({
    boardId: exports.CuidSchema,
    title: zod_1.z.string().min(1, 'Title is required').max(100),
    position: zod_1.z.number().optional(),
});
exports.UpdateListSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100).optional(),
    position: zod_1.z.number().optional(),
});
exports.CreateCardSchema = zod_1.z.object({
    listId: exports.CuidSchema,
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    description: zod_1.z.string().max(2000).optional(),
    position: zod_1.z.number().optional(),
});
exports.UpdateCardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(2000).optional(),
    labels: zod_1.z.array(zod_1.z.string()).optional(),
    assignees: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.MoveCardSchema = zod_1.z.object({
    cardId: exports.CuidSchema,
    fromListId: exports.CuidSchema,
    toListId: exports.CuidSchema,
    newPosition: zod_1.z.number().int().positive(),
});
exports.CreateCardLabelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    color: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3B82F6'),
});
exports.DeleteCardLabelSchema = zod_1.z.object({
    labelId: exports.CuidSchema,
});
exports.CreateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
});
exports.UpdateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
});
exports.AddCardAssigneeSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
});
exports.DeleteCardAssigneeSchema = zod_1.z.object({
    assigneeId: exports.CuidSchema,
});
//# sourceMappingURL=validation.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentAddSchema = exports.CardDeleteSchema = exports.CardMoveSchema = exports.CardUpdateSchema = exports.CardCreateSchema = exports.ListDeleteSchema = exports.ListUpdateSchema = exports.ListCreateSchema = exports.BoardLeaveSchema = exports.BoardJoinSchema = void 0;
const zod_1 = require("zod");
const CuidSchema = zod_1.z.string().cuid();
exports.BoardJoinSchema = zod_1.z.object({ boardId: CuidSchema });
exports.BoardLeaveSchema = zod_1.z.object({ boardId: CuidSchema });
exports.ListCreateSchema = zod_1.z.object({
    boardId: CuidSchema,
    title: zod_1.z.string().min(1).max(100),
    position: zod_1.z.number(),
});
exports.ListUpdateSchema = zod_1.z.object({
    listId: CuidSchema,
    title: zod_1.z.string().min(1).max(100),
});
exports.ListDeleteSchema = zod_1.z.object({ listId: CuidSchema });
exports.CardCreateSchema = zod_1.z.object({
    listId: CuidSchema,
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    position: zod_1.z.number(),
});
exports.CardUpdateSchema = zod_1.z.object({
    cardId: CuidSchema,
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(2000).optional(),
    labels: zod_1.z.array(zod_1.z.string()).optional(),
    assignees: zod_1.z.array(zod_1.z.string()).optional(),
    position: zod_1.z.number().optional(),
});
exports.CardMoveSchema = zod_1.z.object({
    cardId: CuidSchema,
    fromListId: CuidSchema,
    toListId: CuidSchema,
    newPosition: zod_1.z.number().int().positive(),
});
exports.CardDeleteSchema = zod_1.z.object({ cardId: CuidSchema });
exports.CommentAddSchema = zod_1.z.object({
    cardId: CuidSchema,
    content: zod_1.z.string().min(1).max(2000),
});
//# sourceMappingURL=socket-validation.js.map
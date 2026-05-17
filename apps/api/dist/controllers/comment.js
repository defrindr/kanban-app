"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_js_1 = require("../app.js");
const validate_js_1 = require("../middleware/validate.js");
const auth_js_1 = require("../middleware/auth.js");
const error_handler_js_1 = require("../middleware/error-handler.js");
const validation_js_1 = require("../utils/validation.js");
const activity_js_1 = require("../utils/activity.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authGuard);
router.get('/card/:cardId', (0, validate_js_1.validateQuery)(validation_js_1.PaginationSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { cardId } = req.params;
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const card = await app_js_1.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Card not found' },
        });
    }
    const [comments, total] = await Promise.all([
        app_js_1.prisma.comment.findMany({
            where: { cardId },
            skip,
            take: limit,
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        app_js_1.prisma.comment.count({ where: { cardId } }),
    ]);
    res.json({ ok: true, data: comments, meta: { page, limit, total } });
}));
router.post('/card/:cardId', (0, validate_js_1.validateBody)(validation_js_1.CreateCommentSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { cardId } = req.params;
    const { content } = req.body;
    const card = await app_js_1.prisma.card.findUnique({
        where: { id: cardId },
        include: { list: { select: { boardId: true } } },
    });
    if (!card) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Card not found' },
        });
    }
    const comment = await app_js_1.prisma.comment.create({
        data: { cardId, userId: req.user.userId, content },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    await (0, activity_js_1.logActivity)({
        boardId: card.list.boardId,
        userId: req.user.userId,
        action: 'CREATE',
        entityType: 'COMMENT',
        entityId: comment.id,
    });
    res.status(201).json({ ok: true, data: comment });
}));
router.put('/:id', (0, validate_js_1.validateBody)(validation_js_1.UpdateCommentSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await app_js_1.prisma.comment.findUnique({
        where: { id },
        include: { card: { include: { list: { select: { boardId: true } } } } },
    });
    if (!comment) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Comment not found' },
        });
    }
    if (comment.userId !== req.user.userId) {
        return res.status(403).json({
            ok: false,
            error: { code: 'FORBIDDEN', message: 'You can only edit your own comments' },
        });
    }
    const updated = await app_js_1.prisma.comment.update({
        where: { id },
        data: { content },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    await (0, activity_js_1.logActivity)({
        boardId: comment.card.list.boardId,
        userId: req.user.userId,
        action: 'UPDATE',
        entityType: 'COMMENT',
        entityId: id,
    });
    res.json({ ok: true, data: updated });
}));
router.delete('/:id', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const comment = await app_js_1.prisma.comment.findUnique({
        where: { id },
        include: { card: { include: { list: { select: { boardId: true } } } } },
    });
    if (!comment) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Comment not found' },
        });
    }
    if (comment.userId !== req.user.userId) {
        return res.status(403).json({
            ok: false,
            error: { code: 'FORBIDDEN', message: 'You can only delete your own comments' },
        });
    }
    await (0, activity_js_1.logActivity)({
        boardId: comment.card.list.boardId,
        userId: req.user.userId,
        action: 'DELETE',
        entityType: 'COMMENT',
        entityId: id,
    });
    await app_js_1.prisma.comment.delete({ where: { id } });
    res.json({ ok: true, data: { success: true } });
}));
exports.default = router;
//# sourceMappingURL=comment.js.map
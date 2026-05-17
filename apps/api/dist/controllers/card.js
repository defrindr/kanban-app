"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_js_1 = require("../app.js");
const validate_js_1 = require("../middleware/validate.js");
const error_handler_js_1 = require("../middleware/error-handler.js");
const validation_js_1 = require("../utils/validation.js");
const activity_js_1 = require("../utils/activity.js");
const router = (0, express_1.Router)();
async function findBoardId(cardId) {
    const card = await app_js_1.prisma.card.findUnique({
        where: { id: cardId },
        select: { list: { select: { boardId: true } } },
    });
    return card?.list.boardId ?? null;
}
router.post('/', (0, validate_js_1.validateBody)(validation_js_1.CreateCardSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { listId, title, description, position } = req.body;
    const list = await app_js_1.prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'List not found' },
        });
    }
    const card = await app_js_1.prisma.card.create({
        data: { listId, title, description, position: position || 1, labels: [], assignees: [] },
        include: { comments: true, cardLabels: true, cardAssignees: true },
    });
    await (0, activity_js_1.logActivity)({
        boardId: list.boardId,
        userId: req.user.userId,
        action: 'CREATE',
        entityType: 'CARD',
        entityId: card.id,
    });
    res.status(201).json({ ok: true, data: card });
}));
router.put('/:id', (0, validate_js_1.validateBody)(validation_js_1.UpdateCardSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { title, description, labels, assignees, position } = req.body;
    const boardId = await findBoardId(id);
    if (!boardId) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Card not found' },
        });
    }
    const card = await app_js_1.prisma.card.update({
        where: { id },
        data: { title, description, labels, assignees, position },
        include: { comments: true, cardLabels: true, cardAssignees: true },
    });
    await (0, activity_js_1.logActivity)({
        boardId,
        userId: req.user.userId,
        action: 'UPDATE',
        entityType: 'CARD',
        entityId: id,
    });
    res.json({ ok: true, data: card });
}));
router.post('/move', (0, validate_js_1.validateBody)(validation_js_1.MoveCardSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { cardId, toListId, newPosition } = req.body;
    const boardId = await findBoardId(cardId);
    if (!boardId) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Card not found' },
        });
    }
    const card = await app_js_1.prisma.card.update({
        where: { id: cardId },
        data: { listId: toListId, position: newPosition },
        include: { comments: true, cardLabels: true, cardAssignees: true },
    });
    await (0, activity_js_1.logActivity)({
        boardId,
        userId: req.user.userId,
        action: 'MOVE',
        entityType: 'CARD',
        entityId: cardId,
        metadata: { toListId, newPosition },
    });
    res.json({ ok: true, data: card });
}));
router.delete('/:id', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const boardId = await findBoardId(id);
    if (!boardId) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Card not found' },
        });
    }
    await (0, activity_js_1.logActivity)({
        boardId,
        userId: req.user.userId,
        action: 'DELETE',
        entityType: 'CARD',
        entityId: id,
    });
    await app_js_1.prisma.card.delete({ where: { id } });
    res.json({ ok: true, data: { success: true } });
}));
router.post('/:id/labels', (0, validate_js_1.validateBody)(validation_js_1.CreateCardLabelSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;
    const boardId = await findBoardId(id);
    if (!boardId) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Card not found' },
        });
    }
    const label = await app_js_1.prisma.cardLabel.create({
        data: { cardId: id, name, color },
    });
    res.status(201).json({ ok: true, data: label });
}));
router.delete('/:id/labels/:labelId', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id, labelId } = req.params;
    const label = await app_js_1.prisma.cardLabel.findUnique({ where: { id: labelId } });
    if (!label || label.cardId !== id) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Label not found' },
        });
    }
    await app_js_1.prisma.cardLabel.delete({ where: { id: labelId } });
    res.json({ ok: true, data: { success: true } });
}));
router.post('/:id/assignees', (0, validate_js_1.validateBody)(validation_js_1.AddCardAssigneeSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const boardId = await findBoardId(id);
    if (!boardId) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Card not found' },
        });
    }
    const assignee = await app_js_1.prisma.cardAssignee.create({
        data: { cardId: id, userId },
    });
    res.status(201).json({ ok: true, data: assignee });
}));
router.delete('/:id/assignees/:assigneeId', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id, assigneeId } = req.params;
    const assignee = await app_js_1.prisma.cardAssignee.findUnique({ where: { id: assigneeId } });
    if (!assignee || assignee.cardId !== id) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Assignee not found' },
        });
    }
    await app_js_1.prisma.cardAssignee.delete({ where: { id: assigneeId } });
    res.json({ ok: true, data: { success: true } });
}));
exports.default = router;
//# sourceMappingURL=card.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_js_1 = require("../app.js");
const validate_js_1 = require("../middleware/validate.js");
const error_handler_js_1 = require("../middleware/error-handler.js");
const validation_js_1 = require("../utils/validation.js");
const activity_js_1 = require("../utils/activity.js");
const router = (0, express_1.Router)();
router.post('/', (0, validate_js_1.validateBody)(validation_js_1.CreateListSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { boardId, title, position } = req.body;
    const list = await app_js_1.prisma.list.create({
        data: { boardId, title, position: position || 1 },
        include: { cards: true },
    });
    await (0, activity_js_1.logActivity)({
        boardId,
        userId: req.user.userId,
        action: 'CREATE',
        entityType: 'LIST',
        entityId: list.id,
    });
    res.status(201).json({ ok: true, data: list });
}));
router.put('/:id', (0, validate_js_1.validateBody)(validation_js_1.UpdateListSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { title, position } = req.body;
    const existing = await app_js_1.prisma.list.findUnique({ where: { id } });
    if (!existing) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'List not found' },
        });
    }
    const list = await app_js_1.prisma.list.update({
        where: { id },
        data: { title, position },
    });
    await (0, activity_js_1.logActivity)({
        boardId: existing.boardId,
        userId: req.user.userId,
        action: 'UPDATE',
        entityType: 'LIST',
        entityId: id,
    });
    res.json({ ok: true, data: list });
}));
router.delete('/:id', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const list = await app_js_1.prisma.list.findUnique({ where: { id } });
    if (!list) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'List not found' },
        });
    }
    await (0, activity_js_1.logActivity)({
        boardId: list.boardId,
        userId: req.user.userId,
        action: 'DELETE',
        entityType: 'LIST',
        entityId: id,
    });
    await app_js_1.prisma.list.delete({ where: { id } });
    res.json({ ok: true, data: { success: true } });
}));
exports.default = router;
//# sourceMappingURL=list.js.map
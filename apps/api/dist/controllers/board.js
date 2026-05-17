"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_js_1 = require("../app.js");
const validate_js_1 = require("../middleware/validate.js");
const error_handler_js_1 = require("../middleware/error-handler.js");
const validation_js_1 = require("../utils/validation.js");
const cache_js_1 = require("../utils/cache.js");
const activity_js_1 = require("../utils/activity.js");
const router = (0, express_1.Router)();
router.get('/', (0, validate_js_1.validateQuery)(validation_js_1.PaginationSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const cacheKey = `boards:${req.user.userId}:${page}:${limit}`;
    const cached = await (0, cache_js_1.cacheGet)(cacheKey);
    if (cached) {
        res.json({ ok: true, data: cached.boards, meta: { page, limit, total: cached.total } });
        return;
    }
    const [boards, total] = await Promise.all([
        app_js_1.prisma.board.findMany({
            where: { members: { some: { userId: req.user.userId } } },
            skip,
            take: limit,
            include: {
                lists: {
                    include: {
                        cards: {
                            include: { comments: true },
                            orderBy: { position: 'asc' },
                        },
                    },
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        app_js_1.prisma.board.count({
            where: { members: { some: { userId: req.user.userId } } },
        }),
    ]);
    await (0, cache_js_1.cacheSet)(cacheKey, { boards, total });
    res.json({ ok: true, data: boards, meta: { page, limit, total } });
}));
router.get('/:id', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `board:${id}`;
    const cached = await (0, cache_js_1.cacheGet)(cacheKey);
    if (cached) {
        res.json({ ok: true, data: cached });
        return;
    }
    const board = await app_js_1.prisma.board.findUnique({
        where: { id },
        include: {
            lists: {
                include: {
                    cards: {
                        include: { comments: true },
                        orderBy: { position: 'asc' },
                    },
                },
                orderBy: { position: 'asc' },
            },
        },
    });
    if (!board) {
        return res.status(404).json({
            ok: false,
            error: { code: 'NOT_FOUND', message: 'Board not found' },
        });
    }
    await (0, cache_js_1.cacheSet)(cacheKey, board);
    res.json({ ok: true, data: board });
}));
router.post('/', (0, validate_js_1.validateBody)(validation_js_1.CreateBoardSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { name, description } = req.body;
    const board = await app_js_1.prisma.board.create({
        data: {
            name,
            description,
            ownerId: req.user.userId,
            members: {
                create: { userId: req.user.userId, role: 'ADMIN' },
            },
            lists: {
                create: [
                    { title: 'To Do', position: 1 },
                    { title: 'In Progress', position: 2 },
                    { title: 'Done', position: 3 },
                ],
            },
        },
        include: {
            members: true,
            lists: {
                include: { cards: true },
            },
        },
    });
    await (0, cache_js_1.cacheDel)(`boards:${req.user.userId}:*`);
    await (0, activity_js_1.logActivity)({
        boardId: board.id,
        userId: req.user.userId,
        action: 'CREATE',
        entityType: 'BOARD',
        entityId: board.id,
    });
    res.status(201).json({ ok: true, data: board });
}));
router.put('/:id', (0, validate_js_1.validateBody)(validation_js_1.UpdateBoardSchema), (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const board = await app_js_1.prisma.board.update({
        where: { id },
        data: { name, description },
    });
    await (0, cache_js_1.cacheDel)(`board:${id}`);
    await (0, cache_js_1.cacheDel)(`boards:${req.user.userId}:*`);
    await (0, activity_js_1.logActivity)({
        boardId: id,
        userId: req.user.userId,
        action: 'UPDATE',
        entityType: 'BOARD',
        entityId: id,
    });
    res.json({ ok: true, data: board });
}));
router.delete('/:id', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await (0, activity_js_1.logActivity)({
        boardId: id,
        userId: req.user.userId,
        action: 'DELETE',
        entityType: 'BOARD',
        entityId: id,
    });
    await app_js_1.prisma.board.delete({ where: { id } });
    await (0, cache_js_1.cacheDel)(`board:${id}`);
    await (0, cache_js_1.cacheDel)(`boards:${req.user.userId}:*`);
    res.json({ ok: true, data: { success: true } });
}));
exports.default = router;
//# sourceMappingURL=board.js.map
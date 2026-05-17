"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app_js_1 = require("../app.js");
const auth_js_1 = require("../middleware/auth.js");
const error_handler_js_1 = require("../middleware/error-handler.js");
const errors_js_1 = require("../errors.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1).max(100),
    password: zod_1.z.string().min(6).max(128),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
router.post('/register', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_js_1.AppError('VALIDATION_FAILED', 'Invalid input', 422, parsed.error.flatten());
    }
    const { email, name, password } = parsed.data;
    const existing = await app_js_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new errors_js_1.AppError('CONFLICT', 'Email already registered', 409);
    }
    const hashed = await bcryptjs_1.default.hash(password, 12);
    const user = await app_js_1.prisma.user.create({
        data: { email, name, password: hashed },
    });
    const token = (0, auth_js_1.signToken)({ userId: user.id, email: user.email });
    res.status(201).json({
        ok: true,
        data: {
            token,
            user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
        },
    });
}));
router.post('/login', (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_js_1.AppError('VALIDATION_FAILED', 'Invalid input', 422, parsed.error.flatten());
    }
    const { email, password } = parsed.data;
    const user = await app_js_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new errors_js_1.AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid) {
        throw new errors_js_1.AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }
    const token = (0, auth_js_1.signToken)({ userId: user.id, email: user.email });
    res.json({
        ok: true,
        data: {
            token,
            user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
        },
    });
}));
router.get('/me', auth_js_1.authGuard, (0, error_handler_js_1.asyncHandler)(async (req, res) => {
    const user = await app_js_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });
    if (!user) {
        throw new errors_js_1.AppError('NOT_FOUND', 'User not found', 404);
    }
    res.json({ ok: true, data: user });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map
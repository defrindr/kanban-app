"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authGuard = void 0;
exports.signToken = signToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_js_1 = require("../errors.js");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const authGuard = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return next(new errors_js_1.AppError('UNAUTHORIZED', 'Missing or invalid authorization header', 401));
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        next(new errors_js_1.AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
    }
};
exports.authGuard = authGuard;
const optionalAuth = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
    }
    catch {
        // ignore invalid tokens for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
function signToken(payload) {
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn });
}
//# sourceMappingURL=auth.js.map
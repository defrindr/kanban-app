"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = exports.io = exports.redis = exports.prisma = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Sentry = __importStar(require("@sentry/node"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const pino_http_1 = __importDefault(require("pino-http"));
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_js_1 = require("./utils/logger.js");
const handlers_js_1 = require("./socket/handlers.js");
const error_handler_js_1 = require("./middleware/error-handler.js");
const auth_js_1 = require("./middleware/auth.js");
const rate_limit_js_1 = require("./middleware/rate-limit.js");
const board_js_1 = __importDefault(require("./controllers/board.js"));
const list_js_1 = __importDefault(require("./controllers/list.js"));
const card_js_1 = __importDefault(require("./controllers/card.js"));
const comment_js_1 = __importDefault(require("./controllers/comment.js"));
const auth_js_2 = __importDefault(require("./controllers/auth.js"));
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
exports.prisma = new client_1.PrismaClient();
exports.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
exports.io = new socket_io_1.Server(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true },
});
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
        integrations: [Sentry.expressIntegration()],
    });
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
exports.io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        socket.data.user = payload;
        next();
    }
    catch {
        next(new Error('Invalid or expired token'));
    }
});
app.use((0, pino_http_1.default)({ logger: logger_js_1.logger }));
app.use((0, cors_1.default)({ origin: corsOrigin, credentials: true }));
app.use(express_1.default.json({ limit: '10kb' }));
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (_, res) => {
    try {
        await Promise.race([
            Promise.all([
                exports.prisma.$queryRaw `SELECT 1`,
                exports.redis.ping(),
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        res.json({ status: 'ok', uptime: process.uptime() });
    }
    catch {
        res.status(503).json({ status: 'error', message: 'Dependencies not ready' });
    }
});
app.use('/api/auth', rate_limit_js_1.authLimiter, auth_js_2.default);
app.use('/api/boards', rate_limit_js_1.apiLimiter, auth_js_1.authGuard, board_js_1.default);
app.use('/api/lists', rate_limit_js_1.apiLimiter, auth_js_1.authGuard, list_js_1.default);
app.use('/api/cards', rate_limit_js_1.apiLimiter, auth_js_1.authGuard, card_js_1.default);
app.use('/api/comments', rate_limit_js_1.apiLimiter, comment_js_1.default);
if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}
app.use(error_handler_js_1.errorHandler);
(0, handlers_js_1.registerSocketHandlers)(exports.io);
//# sourceMappingURL=app.js.map
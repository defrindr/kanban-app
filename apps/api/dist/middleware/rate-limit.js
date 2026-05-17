"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.authLimiter = void 0;
const app_js_1 = require("../app.js");
function createRateLimiter({ windowMs, max, keyPrefix }) {
    return async (req, res, next) => {
        if (process.env.NODE_ENV === 'test') {
            next();
            return;
        }
        try {
            const identifier = keyPrefix === 'auth' ? req.ip || 'unknown' : req.user?.userId || req.ip || 'unknown';
            const key = `ratelimit:${keyPrefix}:${identifier}`;
            const current = await app_js_1.redis.incr(key);
            if (current === 1) {
                await app_js_1.redis.pexpire(key, windowMs);
            }
            const ttl = await app_js_1.redis.pttl(key);
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
            res.setHeader('X-RateLimit-Reset', Math.ceil(ttl / 1000));
            if (current > max) {
                const retryAfter = Math.ceil(ttl / 1000);
                res.setHeader('Retry-After', retryAfter);
                return res.status(429).json({
                    ok: false,
                    error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' },
                });
            }
            next();
        }
        catch {
            next();
        }
    };
}
exports.authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyPrefix: 'auth',
});
exports.apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 200,
    keyPrefix: 'api',
});
//# sourceMappingURL=rate-limit.js.map
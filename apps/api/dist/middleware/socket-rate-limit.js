"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSocketRateLimit = checkSocketRateLimit;
const app_js_1 = require("../app.js");
const config = {
    windowMs: 60 * 1000,
    maxPerEvent: 30,
    maxTotal: 200,
};
async function checkSocketRateLimit(socket, event) {
    try {
        const userId = socket.data.user?.userId || socket.id;
        const eventKey = `socket:ratelimit:${userId}:${event}`;
        const totalKey = `socket:ratelimit:${userId}:total`;
        const [eventCount, totalCount] = await Promise.all([
            app_js_1.redis.incr(eventKey),
            app_js_1.redis.incr(totalKey),
        ]);
        if (eventCount === 1) {
            await app_js_1.redis.pexpire(eventKey, config.windowMs);
        }
        if (totalCount === 1) {
            await app_js_1.redis.pexpire(totalKey, config.windowMs);
        }
        if (eventCount > config.maxPerEvent || totalCount > config.maxTotal) {
            socket.emit('error', { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
            return false;
        }
        return true;
    }
    catch {
        return true;
    }
}
//# sourceMappingURL=socket-rate-limit.js.map
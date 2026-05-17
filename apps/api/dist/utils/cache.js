"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
const app_js_1 = require("../app.js");
const DEFAULT_TTL = 60;
async function cacheGet(key) {
    const raw = await app_js_1.redis.get(key);
    if (!raw)
        return null;
    return JSON.parse(raw);
}
async function cacheSet(key, value, ttl = DEFAULT_TTL) {
    await app_js_1.redis.set(key, JSON.stringify(value), 'EX', ttl);
}
async function cacheDel(pattern) {
    const keys = await app_js_1.redis.keys(pattern);
    if (keys.length > 0) {
        await app_js_1.redis.del(...keys);
    }
}
//# sourceMappingURL=cache.js.map
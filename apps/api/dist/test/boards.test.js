"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = require("../app.js");
const helpers_js_1 = require("./helpers.js");
const testEmail = `board-test-${Date.now()}@test.com`;
let token;
let boardId;
(0, vitest_1.afterAll)(async () => {
    await (0, helpers_js_1.cleanupTestUser)(testEmail);
});
(0, vitest_1.describe)('Board CRUD', () => {
    (0, vitest_1.it)('creates a board with auth', async () => {
        const { data } = await (0, helpers_js_1.registerTestUser)(testEmail);
        token = data.token;
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/boards')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test Board', description: 'A test board' });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.ok).toBe(true);
        (0, vitest_1.expect)(res.body.data.name).toBe('Test Board');
        (0, vitest_1.expect)(res.body.data.lists).toHaveLength(3);
        (0, vitest_1.expect)(res.body.data.members).toHaveLength(1);
        boardId = res.body.data.id;
    });
    (0, vitest_1.it)('lists boards', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .get('/api/boards')
            .set('Authorization', `Bearer ${token}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.ok).toBe(true);
        (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
    });
    (0, vitest_1.it)('gets a single board', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .get(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.name).toBe('Test Board');
    });
    (0, vitest_1.it)('updates a board', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .put(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Board' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.name).toBe('Updated Board');
    });
    (0, vitest_1.it)('deletes a board', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .delete(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.ok).toBe(true);
    });
    (0, vitest_1.it)('rejects without auth', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/boards')
            .send({ name: 'No Auth Board' });
        (0, vitest_1.expect)(res.status).toBe(401);
    });
});
//# sourceMappingURL=boards.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = require("../app.js");
const helpers_js_1 = require("./helpers.js");
const testEmail = `auth-test-${Date.now()}@test.com`;
(0, vitest_1.afterAll)(async () => {
    await (0, helpers_js_1.cleanupTestUser)(testEmail);
});
(0, vitest_1.describe)('POST /api/auth/register', () => {
    (0, vitest_1.it)('registers a new user', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: 'password123', name: 'Test' });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.ok).toBe(true);
        (0, vitest_1.expect)(res.body.data.token).toBeDefined();
        (0, vitest_1.expect)(res.body.data.user.email).toBe(testEmail);
    });
    (0, vitest_1.it)('rejects duplicate email', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: 'password123', name: 'Test' });
        (0, vitest_1.expect)(res.status).toBe(409);
        (0, vitest_1.expect)(res.body.ok).toBe(false);
        (0, vitest_1.expect)(res.body.error.code).toBe('CONFLICT');
    });
    (0, vitest_1.it)('rejects invalid email', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/auth/register')
            .send({ email: 'not-an-email', password: 'password123', name: 'Test' });
        (0, vitest_1.expect)(res.status).toBe(422);
        (0, vitest_1.expect)(res.body.ok).toBe(false);
    });
    (0, vitest_1.it)('rejects short password', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/auth/register')
            .send({ email: 'short@test.com', password: '123', name: 'Test' });
        (0, vitest_1.expect)(res.status).toBe(422);
        (0, vitest_1.expect)(res.body.ok).toBe(false);
    });
});
(0, vitest_1.describe)('POST /api/auth/login', () => {
    (0, vitest_1.it)('logs in with valid credentials', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: 'password123' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.ok).toBe(true);
        (0, vitest_1.expect)(res.body.data.token).toBeDefined();
    });
    (0, vitest_1.it)('rejects wrong password', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: 'wrongpass' });
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.ok).toBe(false);
        (0, vitest_1.expect)(res.body.error.code).toBe('UNAUTHORIZED');
    });
    (0, vitest_1.it)('rejects non-existent email', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/auth/login')
            .send({ email: 'nobody@test.com', password: 'password123' });
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.ok).toBe(false);
    });
});
(0, vitest_1.describe)('GET /api/auth/me', () => {
    (0, vitest_1.it)('returns current user with valid token', async () => {
        const { data } = await (0, helpers_js_1.registerTestUser)(`me-test-${Date.now()}@test.com`);
        const res = await (0, supertest_1.default)(app_js_1.app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${data.token}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.ok).toBe(true);
        (0, vitest_1.expect)(res.body.data.email).toBeDefined();
    });
    (0, vitest_1.it)('rejects without token', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app).get('/api/auth/me');
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.ok).toBe(false);
    });
    (0, vitest_1.it)('rejects invalid token', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalid-token');
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.ok).toBe(false);
    });
});
//# sourceMappingURL=auth.test.js.map
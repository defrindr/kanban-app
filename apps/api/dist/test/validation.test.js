"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = require("../app.js");
const helpers_js_1 = require("./helpers.js");
const testEmail = `validation-test-${Date.now()}@test.com`;
(0, vitest_1.describe)('Input validation', () => {
    (0, vitest_1.it)('rejects board without name', async () => {
        const { data } = await (0, helpers_js_1.registerTestUser)(testEmail);
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/boards')
            .set('Authorization', `Bearer ${data.token}`)
            .send({});
        (0, vitest_1.expect)(res.status).toBe(422);
        (0, vitest_1.expect)(res.body.error.code).toBe('VALIDATION_FAILED');
    });
    (0, vitest_1.it)('rejects card without title', async () => {
        const { data } = await (0, helpers_js_1.registerTestUser)(`card-val-${Date.now()}@test.com`);
        const res = await (0, supertest_1.default)(app_js_1.app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${data.token}`)
            .send({ listId: 'invalid' });
        (0, vitest_1.expect)(res.status).toBe(422);
        (0, vitest_1.expect)(res.body.error.code).toBe('VALIDATION_FAILED');
    });
    (0, vitest_1.it)('rejects non-cuid IDs', async () => {
        const { data } = await (0, helpers_js_1.registerTestUser)(`cuid-test-${Date.now()}@test.com`);
        const res = await (0, supertest_1.default)(app_js_1.app)
            .get('/api/boards/not-a-cuid')
            .set('Authorization', `Bearer ${data.token}`);
        (0, vitest_1.expect)(res.status).toBe(404);
    });
    (0, vitest_1.it)('returns 404 for non-existent board', async () => {
        const { data } = await (0, helpers_js_1.registerTestUser)(`notfound-${Date.now()}@test.com`);
        const fakeId = 'clx1234567890abcdefghijkl';
        const res = await (0, supertest_1.default)(app_js_1.app)
            .get(`/api/boards/${fakeId}`)
            .set('Authorization', `Bearer ${data.token}`);
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body.error.code).toBe('NOT_FOUND');
    });
});
//# sourceMappingURL=validation.test.js.map
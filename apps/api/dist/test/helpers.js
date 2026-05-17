"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTestUser = registerTestUser;
exports.cleanupTestUser = cleanupTestUser;
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = require("../app.js");
async function registerTestUser(email = 'test@test.com', password = 'password123', name = 'Test User') {
    const res = await (0, supertest_1.default)(app_js_1.app)
        .post('/api/auth/register')
        .send({ email, password, name });
    return res.body;
}
async function cleanupTestUser(email = 'test@test.com') {
    await app_js_1.prisma.user.deleteMany({ where: { email } });
}
//# sourceMappingURL=helpers.js.map
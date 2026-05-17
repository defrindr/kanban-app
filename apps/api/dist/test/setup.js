"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const app_js_1 = require("../app.js");
(0, vitest_1.beforeAll)(async () => {
    await app_js_1.prisma.$connect();
});
(0, vitest_1.afterAll)(async () => {
    await app_js_1.prisma.$disconnect();
});
//# sourceMappingURL=setup.js.map
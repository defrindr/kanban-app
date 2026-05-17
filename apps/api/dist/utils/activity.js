"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const app_js_1 = require("../app.js");
async function logActivity(params) {
    await app_js_1.prisma.activity.create({ data: params });
}
//# sourceMappingURL=activity.js.map
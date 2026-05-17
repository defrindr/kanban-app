"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const logger_js_1 = require("./utils/logger.js");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-here') {
    logger_js_1.logger.fatal('JWT_SECRET is not set or is default value');
    process.exit(1);
}
const PORT = process.env.PORT || 3001;
app_js_1.httpServer.listen(PORT, () => {
    logger_js_1.logger.info({ port: PORT }, `Server running on port ${PORT}`);
});
const shutdown = async (signal) => {
    logger_js_1.logger.info({ signal }, 'Shutting down gracefully');
    app_js_1.httpServer.close(async () => {
        await Promise.all([app_js_1.prisma.$disconnect(), app_js_1.redis.quit()]);
        process.exit(0);
    });
    setTimeout(() => {
        logger_js_1.logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
//# sourceMappingURL=index.js.map
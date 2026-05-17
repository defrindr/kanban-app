import { httpServer, prisma, io, redis } from './app.js';
import { logger } from './utils/logger.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-here') {
  logger.fatal('JWT_SECRET is not set or is default value');
  process.exit(1);
}

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, `Server running on port ${PORT}`);
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down gracefully');
  httpServer.close(async () => {
    await Promise.all([prisma.$disconnect(), redis.quit()]);
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

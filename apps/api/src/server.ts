import { createApp } from './app';
import { config } from './config/app';
import { initDB, disconnectDB } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { startWorkers } from './config/queue';
import { logger } from './app/middleware/logger';

async function bootstrap(): Promise<void> {
  // ── Connect infrastructure ───────────────────────────────────────────────
  await initDB();

  // Redis + workers are optional in dev — server still starts without them
  try {
    await connectRedis();
    startWorkers();
  } catch (err) {
    logger.warn('Redis unavailable — background workers disabled', { err });
  }

  // ── Start HTTP server ────────────────────────────────────────────────────
  const app    = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`API server running`, { port: config.port, env: config.nodeEnv });
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });
}

bootstrap().catch((err) => {
  // Use console here as logger may not be ready
  console.error('Failed to start server:', err);
  process.exit(1);
});

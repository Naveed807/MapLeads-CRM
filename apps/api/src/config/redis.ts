import Redis from 'ioredis';
import { logger } from '../app/middleware/logger';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error:', err));
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/** Plain connection options for BullMQ (avoids ioredis bundled-version conflict). */
export function getRedisConnection() {
  const url    = process.env.REDIS_URL || 'redis://localhost:6379';
  const parsed = new URL(url);
  return {
    host:     parsed.hostname || 'localhost',
    port:     parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    db:       parsed.pathname ? parseInt(parsed.pathname.slice(1) || '0', 10) : 0,
  };
}

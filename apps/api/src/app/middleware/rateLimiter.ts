import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { getRedis } from '../../config/redis';
import { config } from '../../config/app';
import { AppError } from '../errors/AppError';

let limiter: RateLimiterRedis | null = null;

function getLimiter(): RateLimiterRedis {
  if (!limiter) {
    limiter = new RateLimiterRedis({
      storeClient:   getRedis(),
      keyPrefix:     'rl',
      points:        config.rateLimit.max,
      duration:      Math.floor(config.rateLimit.windowMs / 1000),
      blockDuration: 60,
      // Fallback to in-memory limiting when Redis is unavailable
      insuranceLimiter: new RateLimiterMemory({
        keyPrefix: 'rl_mem',
        points:    config.rateLimit.max,
        duration:  Math.floor(config.rateLimit.windowMs / 1000),
      }),
    });
  }
  return limiter;
}

export function rateLimiter(req: Request, _res: Response, next: NextFunction): void {
  const key = req.user?.id || req.ip || 'anon';
  getLimiter()
    .consume(key)
    .then(() => next())
    .catch((err) => {
      if (err && typeof (err as any).remainingPoints === 'number') {
        next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please slow down.'));
      } else {
        next();
      }
    });
}

// Strict limiter for auth endpoints — 10 per 15 minutes
let authLimiter: RateLimiterRedis | null = null;

function getAuthLimiter(): RateLimiterRedis {
  if (!authLimiter) {
    authLimiter = new RateLimiterRedis({
      storeClient:   getRedis(),
      keyPrefix:     'rl_auth',
      points:        10,
      duration:      900,   // 15 minutes
      blockDuration: 900,
      // Fallback to in-memory limiting when Redis is unavailable
      insuranceLimiter: new RateLimiterMemory({
        keyPrefix: 'rl_auth_mem',
        points:    10,
        duration:  900,
      }),
    });
  }
  return authLimiter;
}

export function authRateLimiter(req: Request, _res: Response, next: NextFunction): void {
  const key = req.ip || 'anon';
  getAuthLimiter()
    .consume(key)
    .then(() => next())
    .catch((err) => {
      if (err && typeof (err as any).remainingPoints === 'number') {
        next(new AppError(429, 'AUTH_RATE_LIMIT', 'Too many login attempts. Try again in 15 minutes.'));
      } else {
        next();
      }
    });
}

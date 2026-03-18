import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedis } from '../../config/redis';
import { config } from '../../config/app';
import { AppError } from '../errors/AppError';

let limiter: RateLimiterRedis | null = null;

function getLimiter(): RateLimiterRedis {
  if (!limiter) {
    limiter = new RateLimiterRedis({
      storeClient: getRedis(),
      keyPrefix:   'rl',
      points:      config.rateLimit.max,
      duration:    Math.floor(config.rateLimit.windowMs / 1000),
      blockDuration: 60,
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
      // If Redis is down, fail open (allow request) rather than blocking all traffic
      if (err && err.remainingPoints === undefined) return next();
      next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please slow down.'));
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
      // If Redis is down, fail open
      if (err && err.remainingPoints === undefined) return next();
      next(new AppError(429, 'AUTH_RATE_LIMIT', 'Too many login attempts. Try again in 15 minutes.'));
    });
}

import { Request, Response, NextFunction } from 'express';
import { redis } from '../app.js';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

function createRateLimiter({ windowMs, max, keyPrefix }: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }
    try {
      const identifier = keyPrefix === 'auth' ? req.ip || 'unknown' : req.user?.userId || req.ip || 'unknown';
      const key = `ratelimit:${keyPrefix}:${identifier}`;

      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }

      const ttl = await redis.pttl(key);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
      res.setHeader('X-RateLimit-Reset', Math.ceil(ttl / 1000));

      if (current > max) {
        const retryAfter = Math.ceil(ttl / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          ok: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' },
        });
      }

      next();
    } catch {
      next();
    }
  };
}

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: 'auth',
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  keyPrefix: 'api',
});

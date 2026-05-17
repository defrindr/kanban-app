import { Request, Response, NextFunction } from 'express';
import { redis } from '../app.js';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
  getKey?: (req: Request) => string;
}

function envInt(key: string, def: number) {
  const v = process.env[key];
  return v ? parseInt(v, 10) : def;
}

function createRateLimiter({ windowMs, max, keyPrefix, getKey }: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }
    try {
      const identifier = getKey ? getKey(req) : req.user?.userId || req.ip || 'unknown';
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
  max: envInt('RATE_LIMIT_AUTH_MAX', 30),
  keyPrefix: 'auth',
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: envInt('RATE_LIMIT_API_MAX', 300),
  keyPrefix: 'api',
});

export const writeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: envInt('RATE_LIMIT_WRITE_MAX', 120),
  keyPrefix: 'write',
});

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: envInt('RATE_LIMIT_LOGIN_MAX', 20),
  keyPrefix: 'login',
  getKey: (req) => req.ip || 'unknown',
});

export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: envInt('RATE_LIMIT_REGISTER_MAX', 10),
  keyPrefix: 'register',
  getKey: (req) => req.ip || 'unknown',
});

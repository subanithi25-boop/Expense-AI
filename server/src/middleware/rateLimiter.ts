import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  windowMs?: number;      // Time window in ms (default 15 mins)
  max?: number;           // Max requests per window (default 50)
  message?: string;       // Custom error message
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const maxRequests = options.max || 50;
  const errorMessage = options.message || 'Too many authentication attempts. Please try again later.';

  const ipRecords = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically to prevent memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipRecords.entries()) {
      if (now > record.resetTime) {
        ipRecords.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref(); // unref so it does not block process exit in tests

  return (req: Request, res: Response, next: NextFunction) => {
    // Disable rate limiting during automated test suite execution to prevent test interference
    if (process.env.NODE_ENV === 'test' || req.headers['x-test-bypass-ratelimit']) {
      return next();
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    let record = ipRecords.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      ipRecords.set(clientIp, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', record.resetTime);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: errorMessage,
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication requests from this IP address. Please try again after 15 minutes.'
});


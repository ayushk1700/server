import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * JWT Auth Middleware
 * Protects all /api/messages routes from unauthenticated access.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Rate Limiter (simple in-memory)
 * Prevents brute-force attacks on auth endpoints.
 * In production, use Redis-backed rate limiting (e.g., express-rate-limit + ioredis).
 */
const requestCounts: Map<string, { count: number; resetAt: number }> = new Map();

export const rateLimit = (maxPerMinute: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || entry.resetAt < now) {
      requestCounts.set(ip, { count: 1, resetAt: now + 60_000 });
      next();
      return;
    }

    if (entry.count >= maxPerMinute) {
      res.status(429).json({ error: 'Too many requests. Slow down.' });
      return;
    }

    entry.count++;
    next();
  };
};

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

// 簡單的內存速率限制器
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(maxRequests: number = 10, windowMs: number = 60000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '請求過於頻繁，請稍後再試',
        },
      });
    }

    record.count++;
    next();
  };
}

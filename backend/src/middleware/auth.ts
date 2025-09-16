import { Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import { AuthenticatedRequest } from '../types';

/**
 * JWT認證中間件
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '需要認證token',
        },
      });
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token無效或已過期',
      },
    });
  }
}

/**
 * 可選認證中間件 - token存在時驗證，不存在時繼續
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // 如果token無效，繼續執行但不設置user
    next();
  }
}

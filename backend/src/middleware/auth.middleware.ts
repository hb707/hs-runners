import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.utils';
import { AppError } from './error.middleware';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}

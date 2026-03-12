import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types';
import { AppError } from './error.middleware';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}

export function requireTeamMember(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }
  if (!req.user.teamId) {
    return next(new AppError(403, 'NO_TEAM', 'You must be in a team to access this resource'));
  }
  next();
}

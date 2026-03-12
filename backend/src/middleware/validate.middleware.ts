import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './error.middleware';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return next(new AppError(400, 'VALIDATION_ERROR', message));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return next(new AppError(400, 'VALIDATION_ERROR', message));
    }
    req.query = result.data as typeof req.query;
    next();
  };
}

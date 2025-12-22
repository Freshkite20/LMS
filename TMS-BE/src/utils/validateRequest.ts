import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => {
      const error = e as any;
      return { 
        field: error.path || error.param || error.location || 'unknown', 
        message: e.msg 
      };
    });
    const err: any = new Error('Invalid input data');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    err.details = details;
    return next(err);
  }
  next();
}


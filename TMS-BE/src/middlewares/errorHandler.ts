import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.status || 500;
  const code = err.code || (status === 400 ? 'VALIDATION_ERROR' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  res.status(status).json({
    success: false,
    error: {
      code,
      message: err.message || 'Unexpected error',
      details: err.details || undefined
    },
    timestamp: new Date().toISOString()
  });
}


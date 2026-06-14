import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '../utils/errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (isAppError(err)) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Error) {
    console.error('[Error]', err.message);
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ error: err.message, stack: err.stack });
      return;
    }
  }

  res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

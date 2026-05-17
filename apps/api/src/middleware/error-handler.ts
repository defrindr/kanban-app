import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../errors.js';
import { logger } from '../utils/logger.js';

interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({ err, code: isAppError(err) ? err.code : 'INTERNAL_ERROR' }, err.message);

  if (isAppError(err)) {
    const response: ErrorResponse = {
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  const response: ErrorResponse = {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again later.',
    },
  };
  res.status(500).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => unknown
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
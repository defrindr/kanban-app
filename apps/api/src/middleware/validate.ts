import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../errors.js';

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      (req as unknown as { body: T }).body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError('VALIDATION_FAILED', 'Request body is invalid', 422, err.flatten()));
        return;
      }
      next(err);
    }
  };
};

export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      (req as unknown as { params: T }).params = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError('INVALID_PAYLOAD', 'URL parameters are invalid', 400, err.flatten()));
        return;
      }
      next(err);
    }
  };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      (req as unknown as { query: T }).query = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError('INVALID_PAYLOAD', 'Query parameters are invalid', 400, err.flatten()));
        return;
      }
      next(err);
    }
  };
};

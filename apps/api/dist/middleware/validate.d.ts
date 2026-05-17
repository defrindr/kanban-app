import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare const validateBody: <T>(schema: ZodSchema<T>) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateParams: <T>(schema: ZodSchema<T>) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateQuery: <T>(schema: ZodSchema<T>) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map
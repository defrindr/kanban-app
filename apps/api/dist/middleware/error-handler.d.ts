import { Request, Response, NextFunction } from 'express';
export declare const errorHandler: (err: Error, _req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => unknown) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error-handler.d.ts.map
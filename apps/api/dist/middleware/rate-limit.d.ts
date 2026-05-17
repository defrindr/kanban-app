import { Request, Response, NextFunction } from 'express';
export declare const authLimiter: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const apiLimiter: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=rate-limit.d.ts.map
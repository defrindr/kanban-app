import { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    userId: string;
    email: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare const authGuard: (req: Request, _res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, _res: Response, next: NextFunction) => void;
export declare function signToken(payload: AuthPayload): string;
//# sourceMappingURL=auth.d.ts.map
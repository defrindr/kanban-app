export declare const ErrorCode: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly INVALID_PAYLOAD: "INVALID_PAYLOAD";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
};
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
export declare class AppError extends Error {
    readonly code: ErrorCodeType;
    readonly message: string;
    readonly statusCode: number;
    readonly details?: unknown | undefined;
    constructor(code: ErrorCodeType, message: string, statusCode?: number, details?: unknown | undefined);
}
export declare const isAppError: (err: unknown) => err is AppError;
//# sourceMappingURL=errors.d.ts.map
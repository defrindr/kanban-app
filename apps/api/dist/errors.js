"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAppError = exports.AppError = exports.ErrorCode = void 0;
exports.ErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INVALID_PAYLOAD: 'INVALID_PAYLOAD',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};
class AppError extends Error {
    code;
    message;
    statusCode;
    details;
    constructor(code, message, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const isAppError = (err) => {
    return err instanceof AppError;
};
exports.isAppError = isAppError;
//# sourceMappingURL=errors.js.map
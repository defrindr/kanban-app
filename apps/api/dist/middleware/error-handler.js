"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const errors_js_1 = require("../errors.js");
const logger_js_1 = require("../utils/logger.js");
const errorHandler = (err, _req, res, _next) => {
    logger_js_1.logger.error({ err, code: (0, errors_js_1.isAppError)(err) ? err.code : 'INTERNAL_ERROR' }, err.message);
    if ((0, errors_js_1.isAppError)(err)) {
        const response = {
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
    const response = {
        ok: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong. Please try again later.',
        },
    };
    res.status(500).json(response);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error-handler.js.map
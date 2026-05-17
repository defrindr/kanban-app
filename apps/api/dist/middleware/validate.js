"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateParams = exports.validateBody = void 0;
const zod_1 = require("zod");
const errors_js_1 = require("../errors.js");
const validateBody = (schema) => {
    return (req, _res, next) => {
        try {
            const parsed = schema.parse(req.body);
            req.body = parsed;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                next(new errors_js_1.AppError('VALIDATION_FAILED', 'Request body is invalid', 422, err.flatten()));
                return;
            }
            next(err);
        }
    };
};
exports.validateBody = validateBody;
const validateParams = (schema) => {
    return (req, _res, next) => {
        try {
            const parsed = schema.parse(req.params);
            req.params = parsed;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                next(new errors_js_1.AppError('INVALID_PAYLOAD', 'URL parameters are invalid', 400, err.flatten()));
                return;
            }
            next(err);
        }
    };
};
exports.validateParams = validateParams;
const validateQuery = (schema) => {
    return (req, _res, next) => {
        try {
            const parsed = schema.parse(req.query);
            req.query = parsed;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                next(new errors_js_1.AppError('INVALID_PAYLOAD', 'Query parameters are invalid', 400, err.flatten()));
                return;
            }
            next(err);
        }
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validate.js.map
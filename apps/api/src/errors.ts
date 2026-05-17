export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCodeType,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const isAppError = (err: unknown): err is AppError => {
  return err instanceof AppError;
};
export type ApiSuccess<T> = {
  ok: true
  data: T
  meta?: {
    page?: number
    total?: number
    tookMs?: number
  }
}

export type ApiError = {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.ok === true
}
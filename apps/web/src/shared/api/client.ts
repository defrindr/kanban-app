import { camelizeResponse } from './case-transform'
import type { ApiResponse, ApiError } from './response'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type RequestOptions = RequestInit & {
  next?: NextFetchRequestConfig
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('kanban-token')
  } catch {
    return null
  }
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('kanban-token')
  window.location.href = '/login'
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const body = options.body

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers as Record<string, string> },
    body,
  })

  if (response.status === 401) {
    handleUnauthorized()
    return {
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Session expired. Please login again.' },
    }
  }

  const rawJson = await response.json().catch(() => null)
  const json = camelizeResponse<ApiResponse<T>>(rawJson)

  if (!response.ok) {
    return {
      ok: false,
      error: json && 'ok' in json && (json as ApiResponse<T>).ok === false
        ? (json as ApiError).error
        : {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}`,
          },
    }
  }

  return json as ApiResponse<T>
}

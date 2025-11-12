const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export class ApiError extends Error {
  status: number
  body: any

  constructor(status: number, body: any, message?: string) {
    super(message || `Request failed with status ${status}`)
    this.status = status
    this.body = body
  }
}

/**
 * Fetch helper that injects the organization header.
 */
export async function apiFetch(path: string, orgId: string, init: RequestInit = {}) {
  if (!orgId) {
    throw new Error('Missing org id for API request')
  }

  const headers = new Headers(init.headers || {})

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('x-org-id', orgId)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let parsed: any = errorText
    try {
      parsed = errorText ? JSON.parse(errorText) : null
    } catch {
      parsed = errorText
    }
    const message =
      (parsed && (parsed.detail || parsed.message || parsed.error)) ||
      (typeof parsed === 'string' && parsed) ||
      `Request failed with status ${response.status}`
    throw new ApiError(response.status, parsed, message)
  }

  return response
}


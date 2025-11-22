import { getStoredSession } from './session'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

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
export async function apiFetch<T = any>(path: string, initOrOrgId?: RequestInit | string, init: RequestInit = {}): Promise<T> {
  // Handle overloaded parameters
  let resolvedInit: RequestInit
  let orgIdParam: string | undefined

  if (typeof initOrOrgId === 'string') {
    // apiFetch(path, orgId, init) - legacy signature
    orgIdParam = initOrOrgId
    resolvedInit = init
  } else {
    // apiFetch(path, init) - new signature
    orgIdParam = undefined
    resolvedInit = initOrOrgId || {}
  }
  // For demo mode, always use demo org if no orgId provided
  const session = getStoredSession()
  const resolvedOrgId = orgIdParam || session?.orgId || 'org_demo'

  const headers = new Headers(resolvedInit.headers || {})

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('x-org-id', resolvedOrgId)

  // Add Authorization header if we have a valid token
  if (session?.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  console.log('🌐 Making API request:', {
    url: `${API_BASE_URL}${path}`,
    method: resolvedInit.method || 'GET',
    headers: Object.fromEntries(headers.entries())
  })

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...resolvedInit,
      headers,
    })
  } catch (error) {
    console.error('🚨 Network error during fetch:', error)
    console.error('🚨 Attempted URL:', `${API_BASE_URL}${path}`)
    console.error('🚨 API_BASE_URL:', API_BASE_URL)
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  if (!response.ok) {
    const errorText = await response.text()
    let parsed: any = errorText
    try {
      parsed = errorText ? JSON.parse(errorText) : null
    } catch {
      parsed = errorText
    }

    // If we get an auth error, clear the invalid session
    if (response.status === 401 && session?.accessToken) {
      console.warn('[API] Got 401 error, clearing invalid session...')
      const { clearSession } = await import('./session')
      clearSession()
      // Don't retry - let the auth provider handle re-authentication
    }

    const message =
      (parsed && (parsed.detail || parsed.message || parsed.error)) ||
      (typeof parsed === 'string' && parsed) ||
      `Request failed with status ${response.status}`
    throw new ApiError(response.status, parsed, message)
  }

  return response.json()
}

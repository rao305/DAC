export interface StoredSession {
  accessToken: string
  orgId: string
  userId?: string
  email?: string
}

const STORAGE_KEY = 'dac_session'

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export function saveSession(data: StoredSession) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

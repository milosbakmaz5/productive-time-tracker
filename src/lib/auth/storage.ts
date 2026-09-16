const STORAGE_KEY = 'productive-time-tracker:auth'

export interface AuthCredentials {
  apiToken: string
  organizationId: string
  personId: string
}

export function loadCredentials(): AuthCredentials | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthCredentials
  } catch {
    return null
  }
}

export function saveCredentials(credentials: AuthCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY)
}

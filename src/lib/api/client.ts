import type { AuthCredentials } from '../auth/storage'
import { loadCredentials } from '../auth/storage'
import { ApiError } from './errors'

const BASE_URL = 'https://api.productive.io/api/v2'

export type ApiAuth = Pick<AuthCredentials, 'apiToken' | 'organizationId'>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string>
  /** Explicit credentials, for calls made before login (e.g. token validation) that can't read from storage. */
  auth?: ApiAuth
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? loadCredentials()
  if (!auth) {
    throw new ApiError('Not authenticated', 401)
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      'X-Auth-Token': auth.apiToken,
      'X-Organization-Id': auth.organizationId,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    throw new ApiError(`Productive API error (${response.status})`, response.status, body)
  }

  return body as T
}

import { ApiError, errorFromResponse, readJson } from '@/lib/api/client'

/**
 * Browser-side entry point of the back-office: every call goes to the
 * same-origin route handlers under /admin/api, which hold the session.
 */

const LOGIN_URL = '/admin/login?session=expired'

type QueryValue = string | number | boolean | undefined | null

export type AdminRequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
  /** The login form handles its own 401: no redirect. */
  redirectOnUnauthorized?: boolean
}

function messageOf(payload: unknown): string | undefined {
  return typeof payload === 'object' && payload !== null && typeof (payload as { message?: unknown }).message === 'string' ? (payload as { message: string }).message : undefined
}

function codeOf(payload: unknown): string | null {
  const code = typeof payload === 'object' && payload !== null ? (payload as { code?: unknown }).code : null

  return typeof code === 'string' ? code : null
}

export async function adminFetch<T>(path: string, options: AdminRequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal, redirectOnUnauthorized = true } = options
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '' && value !== false) params.set(key, value === true ? '1' : String(value))
  }

  const queryString = params.toString()
  let response: Response

  try {
    response = await fetch(`/admin/api/${path}${queryString ? `?${queryString}` : ''}`, {
      method,
      signal,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('network', 0)
  }

  const payload = await readJson(response)

  if (response.ok && payload !== null) return payload as T

  if (response.status === 401 && redirectOnUnauthorized) {
    // The session expired or was revoked: back to the login page, with a full page load
    // so that no private page stays in the client-side router cache.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(LOGIN_URL)
    throw new ApiError('http', 401, { message: 'Votre session a expiré. Veuillez vous reconnecter.' })
  }

  // The messages of these statuses are written for administrators by the API.
  if ([401, 403, 409].includes(response.status)) throw new ApiError('http', response.status, { message: messageOf(payload), code: codeOf(payload) })
  if (response.status === 429) throw new ApiError('rate_limit', 429, { message: messageOf(payload), code: codeOf(payload) })

  throw errorFromResponse(response, payload)
}

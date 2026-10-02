/**
 * Single entry point for every call to the Laravel API.
 * Components never call `fetch()` directly: they go through the services,
 * which go through `apiFetch`.
 */

export type ApiErrorKind = 'network' | 'validation' | 'rate_limit' | 'not_found' | 'server' | 'http'

export type ValidationErrors = Record<string, string[]>

const messages: Record<ApiErrorKind, string> = {
  network: 'Impossible de contacter le service pour le moment. Vérifiez votre connexion puis réessayez.',
  validation: 'Certaines informations sont invalides.',
  rate_limit: 'Trop de requêtes ont été envoyées récemment. Veuillez patienter quelques minutes avant de réessayer.',
  not_found: 'Cette information est introuvable.',
  server: 'Impossible de récupérer les informations pour le moment.',
  http: 'Impossible de récupérer les informations pour le moment.',
}

/**
 * Error raised for every failed API call.
 *
 * `message` is always safe to show to a visitor: server-side details
 * (exceptions, SQL, URLs) are never copied into it.
 */
export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  readonly errors: ValidationErrors
  /** Seconds to wait before retrying, when the API provided it (HTTP 429). */
  readonly retryAfter: number | null
  /** Stable machine-readable reason sent by the API, e.g. `duplicate_report`. Never shown as is. */
  readonly code: string | null

  constructor(kind: ApiErrorKind, status: number, options: { message?: string; errors?: ValidationErrors; retryAfter?: number | null; code?: string | null } = {}) {
    super(options.message ?? messages[kind])
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.errors = options.errors ?? {}
    this.retryAfter = options.retryAfter ?? null
    this.code = options.code ?? null
  }

  /** First validation message of a field, if any. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError('network', 0)
}

type QueryValue = string | number | undefined | null

export type ApiRequestOptions = {
  method?: 'GET' | 'POST'
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '')

  if (!url) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('NEXT_PUBLIC_API_URL is not defined. Copy .env.example to .env.local and set it.')
    }
    throw new ApiError('network', 0)
  }

  return url
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }

  const queryString = params.toString()

  return `${baseUrl()}/${path.replace(/^\/+/, '')}${queryString ? `?${queryString}` : ''}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseValidationErrors(payload: unknown): ValidationErrors {
  if (!isRecord(payload) || !isRecord(payload.errors)) return {}

  const errors: ValidationErrors = {}

  for (const [field, value] of Object.entries(payload.errors)) {
    const fieldMessages = (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string')
    if (fieldMessages.length) errors[field] = fieldMessages
  }

  return errors
}

export async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

/** Build the visitor-safe error matching a failed HTTP response. */
export function errorFromResponse(response: Response, payload: unknown): ApiError {
  const { status } = response

  if (status === 422) {
    const errors = parseValidationErrors(payload)
    // Laravel validation messages are written for the visitor.
    const message = Object.values(errors)[0]?.[0]

    return new ApiError('validation', status, { errors, message })
  }

  if (status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After'))

    const code = isRecord(payload) && typeof payload.code === 'string' && /^[a-z_]{1,40}$/.test(payload.code) ? payload.code : null

    return new ApiError('rate_limit', status, { code, retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null })
  }

  if (status === 404) return new ApiError('not_found', status)
  if (status >= 500) return new ApiError('server', status)
  // Any other 4xx (400, 401, 403, 405…): the generic message, never the body of the response.

  return new ApiError('http', status)
}

/**
 * Call the API and return the parsed JSON body.
 *
 * @throws {ApiError} for network failures and every non-2xx response.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options
  const url = buildUrl(path, query)

  let response: Response

  try {
    response = await fetch(url, {
      method,
      signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('network', 0)
  }

  const payload = await readJson(response)

  if (!response.ok) throw errorFromResponse(response, payload)
  if (payload === null) throw new ApiError('server', response.status)

  return payload as T
}

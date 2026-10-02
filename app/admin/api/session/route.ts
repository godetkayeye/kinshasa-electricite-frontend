import { type NextRequest, NextResponse } from 'next/server'
import { isSameOrigin } from '@/lib/admin/request-guard'
import { ADMIN_COOKIE, adminApiFetch, adminCookieOptions, getAdminToken } from '@/lib/admin/session'

const unavailable = () => NextResponse.json({ message: 'Service indisponible. Veuillez réessayer dans quelques instants.' }, { status: 503 })
const forbidden = () => NextResponse.json({ message: 'Requête refusée.' }, { status: 403 })

/** Sign in: exchange the credentials for a token kept in an HttpOnly cookie. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden()

  const body: unknown = await request.json().catch(() => null)
  const credentials = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

  let response: Response

  try {
    response = await adminApiFetch('login', undefined, { method: 'POST', body: JSON.stringify({ email: credentials.email, password: credentials.password }) })
  } catch {
    return unavailable()
  }

  const payload = (await response.json().catch(() => null)) as { data?: { token?: string; expires_at?: string; user?: unknown }; message?: string; code?: string; errors?: unknown } | null

  if (!response.ok || !payload?.data?.token) {
    if (response.status >= 500 || !payload) return unavailable()

    // Only the message, the code and the field errors are passed on.
    return NextResponse.json({ message: payload.message, code: payload.code, errors: payload.errors }, { status: response.status, headers: retryAfter(response) })
  }

  const result = NextResponse.json({ data: payload.data.user })
  result.cookies.set(ADMIN_COOKIE, payload.data.token, adminCookieOptions(payload.data.expires_at))

  return result
}

/** Sign out: revoke the token on the API, then forget the cookie. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden()

  const token = await getAdminToken()

  if (token) {
    // Even if the API cannot be reached, the browser session ends.
    await adminApiFetch('logout', token, { method: 'POST' }).catch(() => null)
  }

  const result = NextResponse.json({ message: 'Déconnecté.' })
  result.cookies.set(ADMIN_COOKIE, '', { ...adminCookieOptions(), maxAge: 0 })

  return result
}

function retryAfter(response: Response): HeadersInit {
  const value = response.headers.get('Retry-After')

  return value ? { 'Retry-After': value } : {}
}

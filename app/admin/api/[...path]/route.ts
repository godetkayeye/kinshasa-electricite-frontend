import { type NextRequest, NextResponse } from 'next/server'
import { isSameOrigin } from '@/lib/admin/request-guard'
import { ADMIN_COOKIE, adminApiFetch, adminCookieOptions, getAdminToken } from '@/lib/admin/session'

/**
 * Forwards the back-office requests of the browser to the Laravel admin API,
 * adding the token of the session on the server.
 *
 * Only the routes listed here are forwarded. Laravel still authorises every
 * request itself: this proxy is not the security boundary.
 */
const readable = [/^dashboard$/, /^signalements$/, /^signalements\/\d+$/, /^communes$/, /^communes\/[a-z0-9-]+$/, /^activite$/, /^me$/]
const writable = [/^signalements\/\d+\/(invalidate|restore)$/]

type Context = { params: Promise<{ path: string[] }> }

async function forward(request: NextRequest, context: Context, allowed: RegExp[]) {
  const path = (await context.params).path.join('/')

  if (!allowed.some((pattern) => pattern.test(path))) return NextResponse.json({ message: 'Introuvable.' }, { status: 404 })

  const token = await getAdminToken()

  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 })

  let response: Response

  try {
    response = await adminApiFetch(`${path}${request.nextUrl.search}`, token, request.method === 'POST' ? { method: 'POST', body: (await request.text()) || '{}' } : {})
  } catch {
    return NextResponse.json({ message: 'Service indisponible. Veuillez réessayer dans quelques instants.' }, { status: 503 })
  }

  const payload: unknown = await response.json().catch(() => null)
  // A server error of the API is never passed on as is.
  const result = response.status >= 500 || payload === null
    ? NextResponse.json({ message: 'Impossible de récupérer les informations pour le moment.' }, { status: response.status >= 500 ? 502 : response.status })
    : NextResponse.json(payload, { status: response.status })

  // The token was revoked or expired: the browser session ends too.
  if (response.status === 401) result.cookies.set(ADMIN_COOKIE, '', { ...adminCookieOptions(), maxAge: 0 })

  return result
}

export function GET(request: NextRequest, context: Context) {
  return forward(request, context, readable)
}

export function POST(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: 'Requête refusée.' }, { status: 403 })

  return forward(request, context, writable)
}

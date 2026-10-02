import 'server-only'

import type { NextRequest } from 'next/server'

/**
 * Refuse state-changing requests that do not come from this site.
 *
 * Together with the SameSite cookie, this protects the route handlers
 * against cross-site request forgery: a browser always sends the Origin
 * header with a cross-origin POST.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')

  if (!origin || !host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

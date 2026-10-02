import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AdminUser } from '@/lib/admin/types'

/**
 * Back-office session, handled on the Next.js server only.
 *
 * The Laravel API token never reaches the browser's JavaScript: it is kept
 * in an HttpOnly cookie, and every admin request goes through the route
 * handlers under /admin/api, which add the token on the server.
 */

export const ADMIN_COOKIE = 'ke_admin_session'
export const ADMIN_LOGIN_PATH = '/admin/login'

/** Base URL of the Laravel admin API, as seen from the Next.js server. */
export function adminApiUrl(path: string): string {
  const base = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '')

  if (!base) throw new Error('NEXT_PUBLIC_API_URL (or API_INTERNAL_URL) is not defined.')

  return `${base}/admin/${path.replace(/^\/+/, '')}`
}

export function adminCookieOptions(expiresAt?: string) {
  const expires = expiresAt ? new Date(expiresAt) : undefined

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Lax: the cookie is not sent with cross-site POST requests.
    sameSite: 'lax' as const,
    path: '/admin',
    expires: expires && !Number.isNaN(expires.getTime()) ? expires : undefined,
  }
}

export async function getAdminToken(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_COOKIE)?.value || undefined
}

/** Call the Laravel admin API with the token of the current session. */
export function adminApiFetch(path: string, token: string | undefined, init: RequestInit = {}): Promise<Response> {
  return fetch(adminApiUrl(path), {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

/** The signed-in administrator, or `null` when there is no valid session. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const token = await getAdminToken()

  if (!token) return null

  const response = await adminApiFetch('me', token)

  if (response.status === 401 || response.status === 403) return null
  if (!response.ok) throw new Error(`Admin API unavailable (${response.status}).`)

  return ((await response.json()) as { data: AdminUser }).data
}

/**
 * Guard of every back-office page: runs on the server before anything is
 * rendered, so a visitor without a session never sees private content.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const hadToken = Boolean(await getAdminToken())
  const admin = await currentAdmin()

  if (!admin) redirect(hadToken ? `${ADMIN_LOGIN_PATH}?session=expired` : ADMIN_LOGIN_PATH)

  return admin
}

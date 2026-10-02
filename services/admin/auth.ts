import type { AdminUser } from '@/lib/admin/types'
import { adminFetch } from '@/services/admin/client'

/** POST /admin/api/session → POST /api/admin/login */
export async function signIn(email: string, password: string): Promise<AdminUser> {
  return (await adminFetch<{ data: AdminUser }>('session', { method: 'POST', body: { email, password }, redirectOnUnauthorized: false })).data
}

/** DELETE /admin/api/session → POST /api/admin/logout */
export async function signOut(): Promise<void> {
  await adminFetch('session', { method: 'DELETE', redirectOnUnauthorized: false })
}

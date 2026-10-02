import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

/**
 * Every page of the back-office is rendered inside this layout. The session
 * is checked on the server first: without a valid one, the visitor is
 * redirected to the login page and no private content is ever sent.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return <AdminShell user={admin}>{children}</AdminShell>
}

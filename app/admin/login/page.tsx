import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/login-form'
import { currentAdmin } from '@/lib/admin/session'

export const metadata: Metadata = { title: 'Connexion' }
export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  // Already signed in: straight to the dashboard. If the API cannot be reached, the form is shown.
  const admin = await currentAdmin().catch(() => null)

  if (admin) redirect('/admin')

  return <LoginForm sessionExpired={(await searchParams).session === 'expired'} />
}

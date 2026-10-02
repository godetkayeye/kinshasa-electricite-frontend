import type { Metadata } from 'next'
import { DashboardView } from '@/components/admin/dashboard-view'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default function AdminDashboardPage() {
  return <DashboardView />
}

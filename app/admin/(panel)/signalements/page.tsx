import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ReportsView } from '@/components/admin/reports-view'

export const metadata: Metadata = { title: 'Signalements' }

export default function AdminReportsPage() {
  return <Suspense fallback={<p className="text-sm text-[#64748b]">Chargement…</p>}><ReportsView /></Suspense>
}

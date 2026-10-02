import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site'
import { Suspense } from 'react'
import { ReportFlow } from '@/components/report-flow'

export const metadata: Metadata = pageMetadata({
  title: 'Faire un signalement',
  description: "Signalez en moins d'une minute une coupure d'électricité ou le retour du courant dans votre quartier à Kinshasa. Aucun compte nécessaire.",
  path: '/signaler',
})

export default function SignalerPage() {
  return <Suspense fallback={<div className="mx-auto max-w-3xl px-5 py-12 text-sm text-[#64748b]">Chargement du formulaire…</div>}><ReportFlow /></Suspense>
}

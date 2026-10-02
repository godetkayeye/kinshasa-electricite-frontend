import type { Metadata } from 'next'
import { NotFoundPanel } from '@/components/not-found-panel'
import { PageShell } from '@/components/situation'

export const metadata: Metadata = { title: 'Page introuvable' }

export default function NotFound() {
  return (
    <PageShell>
      <NotFoundPanel
        title="Page introuvable"
        description="Cette page n'existe pas ou a été déplacée."
        actions={[{ href: '/', label: "Retour à l'accueil" }, { href: '/situation', label: 'Consulter la situation' }]}
      />
    </PageShell>
  )
}

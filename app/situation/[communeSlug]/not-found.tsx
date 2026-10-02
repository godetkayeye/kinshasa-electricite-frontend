import type { Metadata } from 'next'
import { NotFoundPanel } from '@/components/not-found-panel'
import { PageShell } from '@/components/situation'

export const metadata: Metadata = { title: 'Commune introuvable' }

export default function CommuneNotFound() {
  return (
    <PageShell>
      <NotFoundPanel
        title="Commune introuvable"
        description="Cette commune n'existe pas ou n'est pas encore référencée."
        actions={[{ href: '/situation/communes', label: 'Consulter les communes' }, { href: '/signaler', label: 'Faire un signalement' }]}
      />
    </PageShell>
  )
}

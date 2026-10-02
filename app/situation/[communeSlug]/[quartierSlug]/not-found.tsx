import type { Metadata } from 'next'
import { NotFoundPanel } from '@/components/not-found-panel'
import { PageShell } from '@/components/situation'

export const metadata: Metadata = { title: 'Quartier introuvable' }

export default function QuartierNotFound() {
  return (
    <PageShell>
      <NotFoundPanel
        title="Quartier introuvable"
        description="Ce quartier n'existe pas dans la commune sélectionnée ou n'est pas encore référencé."
        actions={[{ href: '/situation/communes', label: 'Consulter les communes' }, { href: '/signaler', label: 'Faire un signalement' }]}
      />
    </PageShell>
  )
}

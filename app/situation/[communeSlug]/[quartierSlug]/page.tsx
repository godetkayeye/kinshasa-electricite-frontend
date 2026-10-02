import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { QuartierSituationView } from '@/components/quartier-situation'
import { PageShell } from '@/components/situation'
import { lookupQuartier } from '@/lib/server-lookup'
import { pageMetadata } from '@/lib/site'

type Props = { params: Promise<{ communeSlug: string; quartierSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { communeSlug, quartierSlug } = await params
  const situation = await lookupQuartier(communeSlug, quartierSlug)

  if (situation.status === 'not-found') return { title: 'Quartier introuvable' }
  if (situation.status === 'unavailable') return { title: 'Situation électrique signalée à Kinshasa' }

  const { quartier, commune } = situation.data

  return pageMetadata({
    title: `Situation électrique à ${quartier.name}, ${commune.name} (Kinshasa)`,
    description: `Coupures d'électricité et retours du courant signalés récemment par les habitants du quartier ${quartier.name}, commune de ${commune.name} à Kinshasa. Informations communautaires, sans confirmation officielle.`,
    path: `/situation/${commune.slug}/${quartier.slug}`,
  })
}

export default async function QuartierPage({ params }: Props) {
  const { communeSlug, quartierSlug } = await params
  // The quartier is always resolved inside its commune: a slug such as
  // « salongo » exists in several communes.
  const situation = await lookupQuartier(communeSlug, quartierSlug)

  if (situation.status === 'not-found') notFound()

  return <PageShell><QuartierSituationView communeSlug={communeSlug} quartierSlug={quartierSlug} initialData={situation.status === 'found' ? situation.data : undefined} /></PageShell>
}

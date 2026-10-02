import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CommuneSituationView } from '@/components/commune-situation'
import { PageShell } from '@/components/situation'
import { lookupCommune } from '@/lib/server-lookup'
import { pageMetadata } from '@/lib/site'

type Props = { params: Promise<{ communeSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { communeSlug } = await params
  const commune = await lookupCommune(communeSlug)

  if (commune.status === 'not-found') return { title: 'Commune introuvable' }
  if (commune.status === 'unavailable') return { title: 'Situation électrique signalée à Kinshasa' }

  return pageMetadata({
    title: `Situation électrique à ${commune.data.name}, Kinshasa`,
    description: `Coupures d'électricité et retours du courant signalés récemment par les habitants dans les quartiers de ${commune.data.name}, à Kinshasa. Informations communautaires, sans confirmation officielle.`,
    path: `/situation/${commune.data.slug}`,
  })
}

export default async function CommunePage({ params }: Props) {
  const { communeSlug } = await params
  const commune = await lookupCommune(communeSlug)

  if (commune.status === 'not-found') notFound()

  return <PageShell><CommuneSituationView communeSlug={communeSlug} initialData={commune.status === 'found' ? commune.data : undefined} /></PageShell>
}

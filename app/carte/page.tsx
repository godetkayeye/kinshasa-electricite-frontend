import type { Metadata } from 'next'
import { MapView } from '@/components/map/map-view'
import { PageShell } from '@/components/situation'
import { pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Carte des coupures',
  description: "Visualisez sur une carte de Kinshasa les coupures d'électricité signalées par les habitants, commune par commune. Informations communautaires, sans confirmation officielle.",
  path: '/carte',
})

export default function MapPage() {
  return <PageShell><MapView /></PageShell>
}

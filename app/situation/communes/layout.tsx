import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Communes de Kinshasa : situation électrique signalée',
  description: 'Coupures et retours du courant signalés récemment par les habitants dans chaque commune de Kinshasa. Informations communautaires, sans confirmation officielle.',
  path: '/situation/communes',
})

export default function CommunesLayout({ children }: { children: React.ReactNode }) {
  return children
}

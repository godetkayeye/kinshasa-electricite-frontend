import type { Metadata } from 'next'
import { CommunesView } from '@/components/admin/communes-view'

export const metadata: Metadata = { title: 'Communes & quartiers' }

export default function AdminCommunesPage() {
  return <CommunesView />
}

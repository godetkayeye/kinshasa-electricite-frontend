import type { Metadata } from 'next'
import { ActivityView } from '@/components/admin/activity-view'

export const metadata: Metadata = { title: 'Activité' }

export default function AdminActivityPage() {
  return <ActivityView />
}

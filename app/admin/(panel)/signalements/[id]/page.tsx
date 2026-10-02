import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ReportDetailView } from '@/components/admin/report-detail-view'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Signalement n° ${(await params).id}` }
}

export default async function AdminReportPage({ params }: Props) {
  const { id } = await params

  if (!/^\d{1,9}$/.test(id)) notFound()

  return <ReportDetailView id={Number(id)} />
}

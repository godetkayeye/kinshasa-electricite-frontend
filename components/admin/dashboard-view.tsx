'use client'

import Link from 'next/link'
import { ReportList } from '@/components/admin/report-list'
import { focusRing, PageHeader, Panel, StatCard } from '@/components/admin/ui'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import { formatRelativeTime } from '@/lib/format-date'
import { useApi } from '@/lib/use-api'
import { pluralize } from '@/lib/utils'
import { getDashboard } from '@/services/admin/dashboard'

export function DashboardView() {
  const { data, error, loading, reload } = useApi('admin-dashboard', getDashboard)
  const stats = data?.statistics
  const moreLink = `text-sm font-bold text-[#0067d8] hover:underline rounded ${focusRing}`

  return (
    <>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble des signalements citoyens. Les chiffres des dernières 24 heures ne comptent que les signalements actifs." />
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><LoadingLabel />{[0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} className="h-[116px] rounded-2xl" />)}</div>}
      {stats && data && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Signalements aujourd'hui" value={stats.reports_today} detail="depuis minuit, tous états confondus" href="/admin/signalements" />
            <StatCard label="Coupures signalées" value={stats.outage_reports_24h} detail="dernières 24 heures" href="/admin/signalements?type=outage" />
            <StatCard label="Retours signalés" value={stats.restoration_reports_24h} detail="dernières 24 heures" href="/admin/signalements?type=restored" />
            <StatCard label="Quartiers actifs" value={stats.active_quartiers_24h} detail="avec au moins un signalement en 24 heures" href="/admin/communes" />
            <StatCard label="Signalements invalidés" value={stats.invalidated_reports} detail={`dont ${stats.invalidated_reports_24h} au cours des dernières 24 heures`} href="/admin/signalements?moderation_status=invalidated" />
            <StatCard label="Activité inhabituelle" value={stats.suspicious_reports_24h} detail="signalements à vérifier, dernières 24 heures" href="/admin/signalements?suspicious=1" />
          </div>
          <Panel title="Activité récente" action={<Link href="/admin/signalements" className={moreLink}>Tous les signalements</Link>}>
            {data.latest_reports.length ? <ReportList reports={data.latest_reports} /> : <EmptyState className="m-5 border-0" title="Aucun signalement" description="Les signalements reçus apparaîtront ici." />}
          </Panel>
          <Panel title="Quartiers les plus actifs (24 heures)" action={<Link href="/admin/communes" className={moreLink}>Communes & quartiers</Link>}>
            {data.most_active_quartiers.length ? (
              <ul className="divide-y divide-[#e2e8f0]">
                {data.most_active_quartiers.map((quartier) => (
                  <li key={quartier.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-bold">{quartier.name} <span className="font-normal text-[#64748b]">· {quartier.commune?.name}</span></p>
                    <p className="text-sm text-[#475569]">{pluralize(quartier.outage_reports_count, 'coupure', 'coupures')} · {pluralize(quartier.restoration_reports_count, 'retour', 'retours')}{quartier.invalidated_reports_count > 0 && <> · {pluralize(quartier.invalidated_reports_count, 'invalidé', 'invalidés')}</>} · {formatRelativeTime(quartier.last_reported_at).toLowerCase()}</p>
                  </li>
                ))}
              </ul>
            ) : <EmptyState className="m-5 border-0" title="Aucune activité" description="Aucun signalement actif au cours des dernières 24 heures." />}
          </Panel>
        </div>
      )}
    </>
  )
}

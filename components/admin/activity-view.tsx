'use client'

import { PageHeader, Panel, StatCard } from '@/components/admin/ui'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import { moderationReasonLabel } from '@/lib/admin/labels'
import type { LocationActivity, ModerationReason, TimelinePoint } from '@/lib/admin/types'
import { formatActivityLabel } from '@/lib/format-date'
import { useApi } from '@/lib/use-api'
import { pluralize } from '@/lib/utils'
import { getActivity } from '@/services/admin/activity'

const series = [
  { key: 'outage_reports_count', label: 'Coupures', bar: 'bg-[#ce1021]' },
  { key: 'restoration_reports_count', label: 'Retours du courant', bar: 'bg-[#007fff]' },
  { key: 'invalidated_reports_count', label: 'Invalidés', bar: 'bg-[#94a3b8]' },
] as const

const CHART_HEIGHT = 130
const total = (point: TimelinePoint) => point.outage_reports_count + point.restoration_reports_count + point.invalidated_reports_count

function Timeline({ points, granularity, timezone }: { points: TimelinePoint[]; granularity: 'hour' | 'day'; timezone: string }) {
  const max = Math.max(0, ...points.map(total))
  const labelEvery = granularity === 'hour' ? 4 : 1

  return (
    <div className="px-5 py-5">
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#475569]">
        {series.map((item) => <span key={item.key} className="inline-flex items-center gap-2"><span aria-hidden="true" className={`size-3 rounded-sm ${item.bar}`} /> {item.label}</span>)}
      </div>
      {max === 0 ? (
        <p className="flex h-44 items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] px-4 text-center text-sm text-[#64748b]">Aucun signalement sur cette période.</p>
      ) : (
        <div className="flex h-44 items-end gap-1 sm:gap-2">
          {points.map((point, index) => {
            const label = formatActivityLabel(point.period_start, granularity, timezone)
            const description = `${label} : ${series.map((item) => `${point[item.key]} ${item.label.toLowerCase()}`).join(', ')}`

            return (
              <div key={point.period_start} className="flex min-w-0 flex-1 flex-col items-center gap-2" title={description}>
                <div role="img" aria-label={description} className="flex w-full flex-col justify-end overflow-hidden rounded-t-md">
                  {total(point) === 0 && <div className="h-[3px] bg-[#e2e8f0]" />}
                  {[...series].reverse().map((item) => point[item.key] > 0 && <div key={item.key} className={item.bar} style={{ height: `${Math.max(5, (point[item.key] / max) * CHART_HEIGHT)}px` }} />)}
                </div>
                <span className="h-4 whitespace-nowrap text-[11px] text-[#64748b]">{(points.length - 1 - index) % labelEvery === 0 ? label : ''}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Ranking({ items, empty }: { items: LocationActivity[]; empty: string }) {
  if (!items.length) return <p className="px-5 py-5 text-sm text-[#475569]">{empty}</p>

  return (
    <ol className="divide-y divide-[#e2e8f0]">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <span className="min-w-0"><span className="mr-2 font-mono text-xs text-[#64748b]">{index + 1}.</span><span className="font-bold">{item.name}</span>{item.commune && <span className="text-[#64748b]"> · {item.commune.name}</span>}</span>
          <span className="shrink-0 text-right text-[#475569]">{pluralize(item.outage_reports_count, 'coupure', 'coupures')} · {pluralize(item.restoration_reports_count, 'retour', 'retours')}</span>
        </li>
      ))}
    </ol>
  )
}

export function ActivityView() {
  const { data, error, loading, reload } = useApi('admin-activity', getActivity)
  const sum = (points: TimelinePoint[], key: (typeof series)[number]['key']) => points.reduce((count, point) => count + point[key], 0)

  return (
    <>
      <PageHeader title="Activité" description="Volume de signalements reçus. Les signalements invalidés sont comptés à part et n'entrent pas dans les données publiques." />
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data && <div className="flex flex-col gap-5"><LoadingLabel /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>}
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Coupures signalées" value={sum(data.by_day, 'outage_reports_count')} detail={`${data.period_days} derniers jours`} />
            <StatCard label="Retours signalés" value={sum(data.by_day, 'restoration_reports_count')} detail={`${data.period_days} derniers jours`} />
            <StatCard label="Invalidations" value={data.moderation.invalidations} detail={`décisions des ${data.period_days} derniers jours`} href="/admin/signalements?moderation_status=invalidated" />
            <StatCard label="Restaurations" value={data.moderation.restorations} detail={`décisions des ${data.period_days} derniers jours`} />
          </div>
          <Panel title="Activité par heure (24 heures)"><Timeline points={data.by_hour} granularity="hour" timezone={data.timezone} /></Panel>
          <Panel title={`Activité par jour (${data.period_days} jours)`}><Timeline points={data.by_day} granularity="day" timezone={data.timezone} /></Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title={`Communes les plus actives (${data.period_days} jours)`}><Ranking items={data.most_active_communes} empty="Aucun signalement actif sur la période." /></Panel>
            <Panel title={`Quartiers les plus actifs (${data.period_days} jours)`}><Ranking items={data.most_active_quartiers} empty="Aucun signalement actif sur la période." /></Panel>
          </div>
          <Panel title={`Invalidations par motif (${data.period_days} jours)`}>
            {data.moderation.invalidations ? (
              <ul className="divide-y divide-[#e2e8f0]">
                {Object.entries(data.moderation.by_reason).map(([reason, count]) => <li key={reason} className="flex items-center justify-between px-5 py-3 text-sm"><span className="font-semibold">{moderationReasonLabel(reason as ModerationReason)}</span><span className="text-[#475569]">{count}</span></li>)}
              </ul>
            ) : <EmptyState className="m-5 border-0" title="Aucune invalidation" description="Aucun signalement n'a été invalidé sur la période." />}
          </Panel>
        </div>
      )}
    </>
  )
}

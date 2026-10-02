'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { focusRing, PageHeader, Panel } from '@/components/admin/ui'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import type { LocationActivity } from '@/lib/admin/types'
import { formatRelativeTime } from '@/lib/format-date'
import { useApi } from '@/lib/use-api'
import { pluralize } from '@/lib/utils'
import { getAdminCommune, getAdminCommunes } from '@/services/admin/communes'

const counts = (item: LocationActivity) => `${pluralize(item.outage_reports_count, 'coupure', 'coupures')} · ${pluralize(item.restoration_reports_count, 'retour', 'retours')}${item.invalidated_reports_count > 0 ? ` · ${pluralize(item.invalidated_reports_count, 'invalidé', 'invalidés')}` : ''}`
const lastActivity = (item: LocationActivity) => (item.last_reported_at ? formatRelativeTime(item.last_reported_at) : 'Aucun signalement')

function Quartiers({ commune }: { commune: LocationActivity }) {
  const { data, error, loading, reload } = useApi(`admin-commune:${commune.slug}`, (signal) => getAdminCommune(commune.slug, signal))

  if (error) return <div className="px-5 pb-5"><ErrorState error={error} onRetry={reload} /></div>
  if (loading && !data) return <div className="flex flex-col gap-2 px-5 pb-5"><LoadingLabel />{[0, 1, 2].map((index) => <Skeleton key={index} className="h-10" />)}</div>
  if (!data?.quartiers?.length) return <p className="px-5 pb-5 text-sm text-[#475569]">Aucun quartier référencé pour cette commune.</p>

  return (
    <ul className="mx-5 mb-5 divide-y divide-[#e2e8f0] rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
      {data.quartiers.map((quartier) => (
        <li key={quartier.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold">{quartier.name}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#475569]">
            <span>{counts(quartier)}</span><span className="text-xs">{lastActivity(quartier)}</span>
            <Link href={`/admin/signalements?commune_id=${commune.id}&quartier_id=${quartier.id}`} className={`rounded font-bold text-[#0067d8] hover:underline ${focusRing}`}>Signalements<span className="sr-only"> de {quartier.name}</span></Link>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Read-only: communes and quartiers cannot be edited from the back-office. */
export function CommunesView() {
  const { data, error, loading, reload } = useApi('admin-communes', getAdminCommunes)
  const [open, setOpen] = useState<string | null>(null)

  return (
    <>
      <PageHeader title="Communes & quartiers" description="Activité des dernières 24 heures par commune. Les communes et les quartiers sont consultables mais ne peuvent pas être modifiés ici." />
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data && <div className="flex flex-col gap-3"><LoadingLabel />{[0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} className="h-16 rounded-2xl" />)}</div>}
      {data && data.length === 0 && <EmptyState title="Aucune commune" description="Aucune commune n'est référencée." />}
      {data && data.length > 0 && (
        <Panel>
          <ul className="divide-y divide-[#e2e8f0]">
            {data.map((commune) => {
              const expanded = open === commune.slug

              return (
                <li key={commune.id}>
                  <button type="button" aria-expanded={expanded} aria-controls={`quartiers-${commune.slug}`} onClick={() => setOpen(expanded ? null : commune.slug)} className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#f8fafc] ${focusRing}`}>
                    <span className="min-w-0">
                      <span className="block font-bold">{commune.name}</span>
                      <span className="mt-1 block text-sm text-[#475569]">{pluralize(commune.quartiers_count ?? 0, 'quartier', 'quartiers')} · {pluralize(commune.reports_count, 'signalement en 24 h', 'signalements en 24 h')} · {counts(commune)}</span>
                      <span className="mt-1 block text-xs text-[#64748b]">Dernière activité : {lastActivity(commune).toLowerCase()}</span>
                    </span>
                    <ChevronDown aria-hidden="true" className={`size-5 shrink-0 text-[#64748b] transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div id={`quartiers-${commune.slug}`} hidden={!expanded}>{expanded && <Quartiers commune={commune} />}</div>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react'
import { ReportList } from '@/components/admin/report-list'
import { focusRing, PageHeader, Panel } from '@/components/admin/ui'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import type { ModerationStatus, ReportFilters } from '@/lib/admin/types'
import type { OutageReportType } from '@/lib/api/types'
import { useApi } from '@/lib/use-api'
import { useCommunes, useQuartiers } from '@/lib/use-locations'
import { pluralize } from '@/lib/utils'
import { getReports } from '@/services/admin/reports'

const PER_PAGE_OPTIONS = [25, 50, 100]
const fieldClass = `h-11 w-full min-w-0 rounded-xl border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/15 disabled:bg-[#f8fafc] disabled:text-[#94a3b8]`

const positiveInt = (value: string | null) => (value && /^\d{1,9}$/.test(value) ? Number(value) : undefined)

/** The filters live in the URL, so a filtered list can be reloaded, shared or returned to. */
function filtersFrom(params: URLSearchParams): ReportFilters {
  const type = params.get('type')
  const status = params.get('moderation_status')

  return {
    type: type === 'outage' || type === 'restored' ? (type as OutageReportType) : undefined,
    commune_id: positiveInt(params.get('commune_id')),
    quartier_id: positiveInt(params.get('quartier_id')),
    date_from: params.get('date_from') || undefined,
    date_to: params.get('date_to') || undefined,
    moderation_status: status === 'active' || status === 'invalidated' ? (status as ModerationStatus) : undefined,
    suspicious: params.get('suspicious') === '1' || undefined,
    search: params.get('search') || undefined,
    per_page: PER_PAGE_OPTIONS.includes(Number(params.get('per_page'))) ? Number(params.get('per_page')) : undefined,
    page: positiveInt(params.get('page')),
  }
}

export function ReportsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const filters = filtersFrom(searchParams)
  const [search, setSearch] = useState(filters.search ?? '')

  const communes = useCommunes()
  const commune = communes.data?.find((item) => item.id === filters.commune_id)
  const quartiers = useQuartiers(commune?.slug)
  // Filtering and pagination are done by the API: only one page is ever loaded.
  const { data, error, loading, reload } = useApi(`admin-reports:${queryString}`, (signal) => getReports(filters, signal))

  const update = (changes: Record<string, string | undefined>, keepPage = false) => {
    const next = new URLSearchParams(queryString)

    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!keepPage) next.delete('page')

    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  const reset = () => { setSearch(''); router.replace(pathname, { scroll: false }) }
  const hasFilters = [...searchParams.keys()].some((key) => !['page', 'per_page'].includes(key))
  const meta = data?.meta

  return (
    <>
      <PageHeader title="Signalements" description="Tous les signalements reçus, y compris ceux qui ont été invalidés." />
      <Panel className="mb-5 p-4 sm:p-5">
        <form onSubmit={(event) => { event.preventDefault(); update({ search: search.trim() || undefined }) }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[#475569]">Type
            <select value={filters.type ?? ''} onChange={(event) => update({ type: event.target.value || undefined })} className={fieldClass}>
              <option value="">Tous</option><option value="outage">Coupure</option><option value="restored">Retour du courant</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[#475569]">Commune
            <select value={communes.data ? String(filters.commune_id ?? '') : ''} disabled={!communes.data} onChange={(event) => update({ commune_id: event.target.value || undefined, quartier_id: undefined })} className={fieldClass}>
              <option value="">{communes.loading ? 'Chargement…' : communes.error ? 'Indisponible' : 'Toutes'}</option>
              {communes.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[#475569]">Quartier
            <select value={quartiers.data ? String(filters.quartier_id ?? '') : ''} disabled={!commune || !quartiers.data} onChange={(event) => update({ quartier_id: event.target.value || undefined })} className={fieldClass}>
              <option value="">{!commune ? "Choisissez d'abord une commune" : quartiers.loading ? 'Chargement…' : 'Tous'}</option>
              {quartiers.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[#475569]">État de modération
            <select value={filters.moderation_status ?? ''} onChange={(event) => update({ moderation_status: event.target.value || undefined })} className={fieldClass}>
              <option value="">Tous</option><option value="active">Actif</option><option value="invalidated">Invalidé</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[#475569]">Du
            <input type="date" value={filters.date_from ?? ''} max={filters.date_to} onChange={(event) => update({ date_from: event.target.value || undefined })} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[#475569]">Au
            <input type="date" value={filters.date_to ?? ''} min={filters.date_from} onChange={(event) => update({ date_to: event.target.value || undefined })} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[#475569] sm:col-span-2">Recherche (numéro, commentaire, nom)
            <span className="flex gap-2">
              <input type="search" value={search} maxLength={100} onChange={(event) => setSearch(event.target.value)} placeholder="Ex. 128 ou « depuis lundi »" className={fieldClass} />
              <button type="submit" className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#0f172a] px-4 text-sm font-bold text-white hover:bg-[#1e293b] ${focusRing}`}><Search aria-hidden="true" className="size-4" /> Rechercher</button>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] sm:col-span-2">
            <input type="checkbox" checked={Boolean(filters.suspicious)} onChange={(event) => update({ suspicious: event.target.checked ? '1' : undefined })} className="size-4 accent-[#007fff]" />
            Uniquement l&apos;activité inhabituelle
          </label>
          <div className="flex items-center justify-start sm:col-span-2 sm:justify-end">
            <button type="button" onClick={reset} disabled={!hasFilters} className={`inline-flex items-center gap-2 rounded-xl border border-[#cbd5e1] px-3 py-2 text-sm font-bold hover:border-[#007fff] hover:text-[#007fff] disabled:opacity-50 ${focusRing}`}><RotateCcw aria-hidden="true" className="size-4" /> Réinitialiser les filtres</button>
          </div>
        </form>
      </Panel>

      <Panel>
        {error && <div className="p-5"><ErrorState error={error} onRetry={reload} /></div>}
        {loading && !data && <div className="flex flex-col gap-3 p-5"><LoadingLabel />{[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="h-12" />)}</div>}
        {data && data.data.length === 0 && <EmptyState className="m-5 border-0" title={hasFilters ? 'Aucun signalement ne correspond à ces filtres' : 'Aucun signalement'} description={hasFilters ? 'Modifiez ou réinitialisez les filtres.' : 'Les signalements reçus apparaîtront ici.'} />}
        {data && data.data.length > 0 && meta && (
          <div aria-busy={loading} className={loading ? 'opacity-60' : ''}>
            <ReportList reports={data.data} />
            <div className="flex flex-col gap-3 border-t border-[#e2e8f0] px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[#475569]" role="status">{pluralize(meta.total, 'signalement', 'signalements')} · page {meta.current_page} sur {meta.last_page}</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-[#475569]">Par page
                  <select value={meta.per_page} onChange={(event) => update({ per_page: event.target.value === '25' ? undefined : event.target.value })} className={`${fieldClass} h-10 w-auto`}>
                    {PER_PAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <button type="button" disabled={meta.current_page <= 1 || loading} onClick={() => update({ page: String(meta.current_page - 1) }, true)} className={`inline-flex h-10 items-center gap-1 rounded-xl border border-[#cbd5e1] px-3 font-bold hover:border-[#007fff] hover:text-[#007fff] disabled:opacity-50 ${focusRing}`}><ChevronLeft aria-hidden="true" className="size-4" /> Précédent</button>
                <button type="button" disabled={meta.current_page >= meta.last_page || loading} onClick={() => update({ page: String(meta.current_page + 1) }, true)} className={`inline-flex h-10 items-center gap-1 rounded-xl border border-[#cbd5e1] px-3 font-bold hover:border-[#007fff] hover:text-[#007fff] disabled:opacity-50 ${focusRing}`}>Suivant <ChevronRight aria-hidden="true" className="size-4" /></button>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </>
  )
}

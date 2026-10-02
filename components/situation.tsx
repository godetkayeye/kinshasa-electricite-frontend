'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, ArrowRight, Check, Clock3, House, Info, MapPinned, Search, Share2, ShieldCheck, Zap, ZapOff } from 'lucide-react'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import { SiteFooter } from '@/components/site-footer'
import type { ActivityPeriod, Commune, CommuneOutageSummary, OutageReportType, QuartierOutageSummary, SituationStatus } from '@/lib/api/types'
import { formatActivityLabel, formatDateTime, formatRelativeTime } from '@/lib/format-date'
import { affectedAreaLabel, COMMUNITY_NOTICE, outageDurationLabel, reportTypeLabel, situationStatusLabel } from '@/lib/outage-options'
import { useApi } from '@/lib/use-api'
import { useCommunes, useQuartiers } from '@/lib/use-locations'
import { pluralize } from '@/lib/utils'
import { getCommunesSituation, getMostReportedQuartiers, getQuartierActivity, getQuartierSituation, getStatistics } from '@/services/outages'
import { getRecentReports } from '@/services/reports'

export function FlagLine() {
  return <div aria-hidden="true" className="h-1 w-full bg-[linear-gradient(90deg,#007fff_0_48%,#f7d618_48%_52%,#ce1021_52%)]" />
}

const navigation = [
  { href: '/', label: 'Accueil', Icon: House },
  { href: '/situation', label: 'Situation', Icon: Activity },
  { href: '/carte', label: 'Carte', Icon: MapPinned },
  { href: '/signaler', label: 'Signaler', Icon: Zap },
  { href: '/a-propos', label: 'À propos', Icon: Info },
]

function useCurrentPath() {
  const pathname = usePathname()

  return (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))
}

export function SiteHeader() {
  const isCurrent = useCurrentPath()

  return (
    <header className="border-b border-[#e2e8f0] bg-white">
      <FlagLine />
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-[72px] md:px-5 lg:px-8">
        <Link href="/" className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#007fff] text-white md:size-10"><Zap fill="currentColor" /></span>
          <span className="min-w-0">
            <strong className="block truncate text-sm tracking-tight text-[#0f172a]">Kinshasa Électricité</strong>
            <small className="block truncate text-xs text-[#64748b]">Signalement citoyen</small>
          </span>
        </Link>
        {/* On phones the navigation is the tab bar at the bottom of the screen. */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 text-sm font-semibold text-[#475569] md:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined} className={`rounded focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30 ${isCurrent(item.href) ? 'text-[#0067d8] underline decoration-2 underline-offset-8' : 'hover:text-[#007fff]'}`}>{item.href === '/signaler' ? 'Faire un signalement' : item.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

/** Navigation of the phone layout: four large targets within reach of the thumb. */
export function MobileTabBar() {
  const isCurrent = useCurrentPath()

  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e2e8f0] bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {navigation.map(({ href, label, Icon }) => {
          const current = isCurrent(href)
          const primary = href === '/signaler'

          return (
            <li key={href}>
              <Link href={href} aria-current={current ? 'page' : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#007fff]/30 ${current || primary ? 'text-[#0067d8]' : 'text-[#475569]'}`}>
                <span className={`flex h-7 w-11 items-center justify-center rounded-full ${primary ? 'bg-[#007fff] text-white' : current ? 'bg-[#eff6ff]' : ''}`}><Icon aria-hidden="true" className="size-5" /></span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <SiteHeader />
      {children}
      {/* The footer leaves room for the tab bar fixed at the bottom of phones. */}
      <SiteFooter className="mt-12 pb-[calc(4rem+env(safe-area-inset-bottom))] md:mt-16 md:pb-0" />
      <MobileTabBar />
    </div>
  )
}

export function CommunityNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm leading-6 text-[#1e40af]">
      <ShieldCheck className="mt-0.5 shrink-0" /> Situation basée sur les signalements récents de la communauté. Elle ne constitue pas une confirmation officielle.
    </div>
  )
}

/** Colours of a report type. The type is always written next to its icon, never conveyed by colour alone. */
const typeStyles: Record<OutageReportType, { icon: string; bar: string; text: string }> = {
  outage: { icon: 'bg-[#fff1f2] text-[#ce1021]', bar: 'bg-[#ce1021]', text: 'text-[#ce1021]' },
  restored: { icon: 'bg-[#eff6ff] text-[#007fff]', bar: 'bg-[#007fff]', text: 'text-[#0067d8]' },
}

export function ReportTypeIcon({ type, className = 'size-10' }: { type: OutageReportType; className?: string }) {
  const Icon = type === 'restored' ? Zap : ZapOff

  return <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full ${className} ${(typeStyles[type] ?? typeStyles.outage).icon}`}><Icon /></span>
}

export const statusStyles: Record<SituationStatus, { badge: string; panel: string; accent: string }> = {
  no_recent_reports: { badge: 'bg-[#f1f5f9] text-[#475569]', panel: 'border-[#e2e8f0] bg-white', accent: 'text-[#64748b]' },
  outage_reports: { badge: 'bg-[#fff1f2] text-[#b91c1c]', panel: 'border-[#fecdd3] bg-[#fff7f7]', accent: 'text-[#b91c1c]' },
  mixed_reports: { badge: 'bg-[#fff4e6] text-[#92400e]', panel: 'border-[#fde3b8] bg-[#fffaf0]', accent: 'text-[#92400e]' },
  restoration_reports: { badge: 'bg-[#eff6ff] text-[#0067d8]', panel: 'border-[#bfdbfe] bg-[#f5f9ff]', accent: 'text-[#0067d8]' },
}

type ReportCounts = { outage_reports_count: number; restoration_reports_count: number }

export function StatusBadge({ status, counts }: { status: SituationStatus; counts?: ReportCounts }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${(statusStyles[status] ?? statusStyles.no_recent_reports).badge}`}>{situationStatusLabel(status, counts)}</span>
}

const outagesCount = (count: number) => pluralize(count, 'coupure signalée', 'coupures signalées')
const restorationsCount = (count: number) => pluralize(count, 'retour du courant signalé', 'retours du courant signalés')

/** « Retour du courant signalé il y a 4 min » */
export function lastActivityLabel(type: OutageReportType | null, reportedAt: string | null): string {
  if (!type || !reportedAt) return '—'

  const when = formatRelativeTime(reportedAt)

  return `${reportTypeLabel(type)} ${when.charAt(0).toLowerCase()}${when.slice(1)}`
}

export function StatCards() {
  const { data, error, loading, reload } = useApi('statistics', getStatistics)

  if (error) return <ErrorState error={error} onRetry={reload} />

  const window = data ? `au cours des ${data.recent_hours} dernières heures` : ''
  const stats = data
    ? [
        [`${data.affected_communes} / ${data.total_communes}`, 'Communes concernées', 'communes avec des coupures signalées récemment'],
        [data.affected_quartiers.toLocaleString('fr-FR'), 'Quartiers signalés', 'quartiers avec au moins une coupure signalée récemment'],
        [data.recent_outage_reports.toLocaleString('fr-FR'), 'Coupures signalées', window],
        [data.recent_restoration_reports.toLocaleString('fr-FR'), 'Retours du courant signalés', window],
      ]
    : []

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {loading && !data && <LoadingLabel>Chargement des statistiques…</LoadingLabel>}
      {loading && !data && [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-[156px] rounded-2xl" />)}
      {stats.map(([value, label, detail], index) => (
        <div key={label} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <div className={`mb-5 flex size-10 items-center justify-center rounded-xl ${index === 2 ? 'bg-[#fff1f2] text-[#ce1021]' : index === 1 ? 'bg-[#fff9db] text-[#b08b00]' : 'bg-[#eff6ff] text-[#007fff]'}`}>{index === 2 ? <ZapOff /> : index === 3 ? <Zap /> : <Activity />}</div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 font-semibold">{label}</p>
          <p className="mt-1 text-xs text-[#64748b]">{detail}</p>
        </div>
      ))}
    </div>
  )
}

const selectClass = 'h-14 w-full min-w-0 rounded-xl border border-[#cbd5e1] bg-white px-4 text-base font-normal text-[#0f172a] outline-none focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/10 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8]'

function SelectError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <span role="alert" className="text-xs font-semibold text-[#ce1021]">
      {message} <button type="button" onClick={onRetry} className="underline">Réessayer</button>
    </span>
  )
}

/**
 * Commune and quartier selects fed by the API. The quartier select stays
 * disabled until a commune is chosen and only lists the quartiers of that commune.
 */
export function LocationSelects({ communeSlug, quartierSlug, onCommuneChange, onQuartierChange }: { communeSlug: string; quartierSlug: string; onCommuneChange: (slug: string) => void; onQuartierChange: (slug: string) => void }) {
  const communes = useCommunes()
  const quartiers = useQuartiers(communeSlug || null)

  const communePlaceholder = communes.loading ? 'Chargement des communes…' : communes.data?.length === 0 ? 'Aucune commune disponible' : 'Sélectionner'
  const quartierPlaceholder = !communeSlug ? "Sélectionnez d'abord une commune" : quartiers.loading ? 'Chargement des quartiers…' : quartiers.data?.length === 0 ? 'Aucun quartier disponible' : 'Sélectionner'

  return (
    <>
      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
        Commune
        <select value={communes.data ? communeSlug : ''} disabled={!communes.data?.length} aria-busy={communes.loading} onChange={(event) => onCommuneChange(event.target.value)} className={selectClass}>
          <option value="">{communePlaceholder}</option>
          {communes.data?.map((commune) => <option key={commune.id} value={commune.slug}>{commune.name}</option>)}
        </select>
        {communes.error && <SelectError message="Impossible de charger les communes." onRetry={communes.reload} />}
      </label>
      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
        Quartier
        <select value={quartiers.data ? quartierSlug : ''} disabled={!communeSlug || !quartiers.data?.length} aria-busy={quartiers.loading} onChange={(event) => onQuartierChange(event.target.value)} className={selectClass}>
          <option value="">{quartierPlaceholder}</option>
          {quartiers.data?.map((quartier) => <option key={quartier.id} value={quartier.slug}>{quartier.name}</option>)}
        </select>
        {quartiers.error && <SelectError message="Impossible de charger les quartiers." onRetry={quartiers.reload} />}
      </label>
    </>
  )
}

export function SituationSearch() {
  const [commune, setCommune] = useState('')
  const [quartier, setQuartier] = useState('')
  const [checked, setChecked] = useState<{ commune: string; quartier: string } | null>(null)
  const situation = useApi(checked ? `situation:${checked.commune}/${checked.quartier}` : null, (signal) => getQuartierSituation(checked?.commune ?? '', checked?.quartier ?? '', signal))
  const selected = situation.data

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 md:p-8">
      <form onSubmit={(event) => { event.preventDefault(); if (commune && quartier) setChecked({ commune, quartier }) }} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-start">
        <LocationSelects communeSlug={commune} quartierSlug={quartier} onCommuneChange={(slug) => { setCommune(slug); setQuartier(''); setChecked(null) }} onQuartierChange={(slug) => { setQuartier(slug); setChecked(null) }} />
        <button type="submit" disabled={!commune || !quartier} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 font-bold text-white hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50 md:mt-7"><Search aria-hidden="true" /> Vérifier</button>
      </form>
      {!checked && <p className="mt-5 text-sm text-[#64748b]">Sélectionnez une commune puis un quartier pour consulter les signalements récents.</p>}
      {situation.loading && <div className="mt-6"><LoadingLabel /><Skeleton className="h-44 rounded-2xl" /></div>}
      {situation.error && <ErrorState error={situation.error} onRetry={situation.reload} className="mt-6" />}
      {selected && (
        <div className={`mt-6 rounded-2xl border p-5 ${statusStyles[selected.situation_status].panel}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xl font-bold">{selected.quartier.name} <span className="font-normal text-[#64748b]">· {selected.commune.name}</span></p>
              <p className="mt-2 text-sm text-[#475569]">Situation basée sur les signalements récents de la communauté.</p>
            </div>
            <StatusBadge status={selected.situation_status} counts={selected} />
          </div>
          <div className="mt-5 grid gap-4 border-t border-[#e2e8f0] pt-4 text-sm sm:grid-cols-3">
            <div><p className="text-xs text-[#64748b]">Coupures signalées</p><p className="mt-1 text-lg font-bold">{selected.outage_reports_count}</p></div>
            <div><p className="text-xs text-[#64748b]">Retours du courant signalés</p><p className="mt-1 text-lg font-bold">{selected.restoration_reports_count}</p></div>
            <div><p className="text-xs text-[#64748b]">Dernière activité</p><p className="mt-1 font-bold">{lastActivityLabel(selected.last_report_type, selected.last_reported_at)}</p></div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href={`/situation/${selected.commune.slug}/${selected.quartier.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007fff] px-4 font-bold text-white hover:bg-[#006fe0]">Voir les détails <ArrowRight /></Link>
            <Link href={`/signaler?commune=${selected.commune.slug}&quartier=${selected.quartier.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 font-bold text-[#0f172a] hover:border-[#007fff] hover:text-[#007fff]">Faire un signalement</Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function QuartierCard({ quartier, commune }: { quartier: QuartierOutageSummary; commune: Commune }) {
  return (
    <Link href={`/situation/${commune.slug}/${quartier.slug}`} className="group rounded-2xl border border-[#e2e8f0] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold group-hover:text-[#007fff]">{quartier.name}</p>
          <p className="text-sm text-[#64748b]">{commune.name}</p>
        </div>
        <StatusBadge status={quartier.situation_status} counts={quartier} />
      </div>
      <div className="mt-7 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold">{quartier.outage_reports_count}</p>
          <p className="text-sm text-[#64748b]">{quartier.outage_reports_count > 1 ? 'coupures signalées' : 'coupure signalée'}</p>
          {quartier.restoration_reports_count > 0 && <p className="mt-1 text-sm font-semibold text-[#0067d8]">{restorationsCount(quartier.restoration_reports_count)}</p>}
        </div>
        {quartier.last_reported_at && <p className="flex shrink-0 items-center gap-1 text-xs text-[#64748b]"><Clock3 /> {formatRelativeTime(quartier.last_reported_at)}</p>}
      </div>
    </Link>
  )
}

const noRecentReports = {
  title: 'Aucun signalement récent',
  action: { href: '/signaler', label: 'Faire un signalement' },
}

export function TopQuartiers({ limit = 6 }: { limit?: number }) {
  const { data, error, loading, reload } = useApi(`top-quartiers:${limit}`, (signal) => getMostReportedQuartiers(limit, signal))

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading && !data) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><LoadingLabel />{[0, 1, 2].map((index) => <Skeleton key={index} className="h-[168px] rounded-2xl" />)}</div>
  if (!data?.length) return <EmptyState {...noRecentReports} description="Soyez parmi les premiers à signaler la situation de votre quartier." />

  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.map((quartier) => <QuartierCard key={quartier.id} quartier={quartier} commune={quartier.commune} />)}</div>
}

export function CommuneList({ items }: { items: CommuneOutageSummary[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((commune) => (
        <Link key={commune.id} href={`/situation/${commune.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-5 hover:border-[#bfdbfe] hover:shadow-sm">
          <div>
            <p className="font-bold">{commune.name}</p>
            <p className="mt-1 text-sm text-[#64748b]">{pluralize(commune.affected_quartiers_count, 'quartier signalé', 'quartiers signalés')} · {outagesCount(commune.outage_reports_count)}{commune.restoration_reports_count > 0 && <> · {restorationsCount(commune.restoration_reports_count)}</>}</p>
          </div>
          <ArrowRight className="shrink-0 text-[#007fff]" />
        </Link>
      ))}
    </div>
  )
}

export function CommuneListSkeleton({ count = 4 }: { count?: number }) {
  return <div className="grid gap-4 md:grid-cols-2"><LoadingLabel />{Array.from({ length: count }, (_, index) => <Skeleton key={index} className="h-[86px] rounded-2xl" />)}</div>
}

export function TopCommunes({ limit = 6 }: { limit?: number }) {
  const { data, error, loading, reload } = useApi('communes-situation:reports', (signal) => getCommunesSituation('reports', signal))

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading && !data) return <CommuneListSkeleton />

  const reported = (data ?? []).filter((commune) => commune.recent_reports_count > 0).slice(0, limit)

  if (!reported.length) return <EmptyState {...noRecentReports} description="Les communes apparaîtront ici lorsque des signalements seront reçus." />

  return <CommuneList items={reported} />
}

/**
 * Latest public reports (outages and power-restored), optionally limited to one quartier.
 * Only the type, the location, what was declared and the date are shown: never who reported.
 */
export function RecentReports({ limit = 8, quartierId, showLocation = true, dateFormat = 'relative', empty }: { limit?: number; quartierId?: number; showLocation?: boolean; dateFormat?: 'relative' | 'datetime'; empty?: React.ReactNode }) {
  const { data, error, loading, reload } = useApi(`recent-reports:${quartierId ?? 'all'}:${limit}`, (signal) => getRecentReports({ limit, quartierId }, signal))

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading && !data) return <div className="flex flex-col gap-3"><LoadingLabel />{[0, 1, 2].map((index) => <Skeleton key={index} className="h-[88px] rounded-2xl" />)}</div>
  if (!data?.length) return <>{empty ?? <EmptyState {...noRecentReports} description="Soyez parmi les premiers à signaler la situation de votre quartier." />}</>

  return (
    <ul className="divide-y divide-[#e2e8f0] rounded-2xl border border-[#e2e8f0] bg-white">
      {data.map((report) => (
        <li key={report.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ReportTypeIcon type={report.report_type} />
            <div>
              <p className="font-bold">{reportTypeLabel(report.report_type)}</p>
              {showLocation && <p className="text-sm text-[#64748b]">{report.quartier.name} · {report.commune.name}</p>}
              <p className="mt-1 text-xs text-[#64748b]">
                {report.report_type === 'restored'
                  ? <>Zone rétablie : <span className="font-semibold text-[#0f172a]">{affectedAreaLabel(report.affected_area)}</span></>
                  : <>Durée déclarée : <span className="font-semibold text-[#0f172a]">{outageDurationLabel(report.outage_duration)}</span> · Zone : <span className="font-semibold text-[#0f172a]">{affectedAreaLabel(report.affected_area)}</span></>}
              </p>
            </div>
          </div>
          <p className="flex shrink-0 items-center gap-1 text-xs text-[#64748b]"><Clock3 /> {dateFormat === 'datetime' ? formatDateTime(report.reported_at) : formatRelativeTime(report.reported_at)}</p>
        </li>
      ))}
    </ul>
  )
}

const periods: { value: ActivityPeriod; label: string }[] = [
  { value: '24h', label: '24 heures' },
  { value: '7d', label: '7 jours' },
]

const CHART_HEIGHT = 125

/** Reports of a quartier over time: outages and power-restored reports are stacked in each bar. */
export function ActivityChart({ communeSlug, quartierSlug }: { communeSlug: string; quartierSlug: string }) {
  const [period, setPeriod] = useState<ActivityPeriod>('24h')
  const { data, error, loading, reload } = useApi(`activity:${communeSlug}/${quartierSlug}:${period}`, (signal) => getQuartierActivity(communeSlug, quartierSlug, period, signal))
  const max = Math.max(0, ...(data?.points.map((point) => point.reports_count) ?? []))
  const labelEvery = data?.granularity === 'hour' ? 4 : 1
  const barHeight = (count: number) => (count > 0 ? Math.max(6, (count / max) * CHART_HEIGHT) : 0)

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Activité des signalements</h2>
        <div className="flex rounded-lg bg-[#f1f5f9] p-1 text-xs font-bold">
          {periods.map((item) => (
            <button key={item.value} type="button" aria-pressed={period === item.value} className={`min-h-11 rounded-md px-4 text-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30 ${period === item.value ? 'bg-white text-[#007fff] shadow-sm' : 'text-[#64748b]'}`} onClick={() => setPeriod(item.value)}>{item.label}</button>
          ))}
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#475569]">
        <span className="inline-flex items-center gap-2"><span aria-hidden="true" className={`size-3 rounded-sm ${typeStyles.outage.bar}`} /> Coupures signalées</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden="true" className={`size-3 rounded-sm ${typeStyles.restored.bar}`} /> Retours du courant signalés</span>
      </div>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data && <><LoadingLabel /><Skeleton className="h-44" /></>}
      {data && max === 0 && (
        <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] px-4 text-center">
          <p className="font-bold">Aucun signalement sur cette période</p>
          <p className="mt-1 text-sm text-[#64748b]">Le graphique s&apos;affichera dès qu&apos;un signalement sera reçu pour ce quartier.</p>
        </div>
      )}
      {data && max > 0 && (
        <div className="flex h-44 items-end gap-1 sm:gap-2">
          {data.points.map((point, index) => {
            const label = formatActivityLabel(point.period_start, data.granularity, data.timezone)
            const description = `${label} : ${outagesCount(point.outage_reports_count)}, ${restorationsCount(point.restoration_reports_count)}`

            return (
              <div key={point.period_start} className="flex min-w-0 flex-1 flex-col items-center gap-2" title={description}>
                <div role="img" aria-label={description} className="flex w-full flex-col justify-end overflow-hidden rounded-t-md">
                  {point.reports_count === 0 && <div className="h-[3px] bg-[#e2e8f0]" />}
                  {point.restoration_reports_count > 0 && <div data-series="restored" className={`transition-all ${typeStyles.restored.bar}`} style={{ height: `${barHeight(point.restoration_reports_count)}px` }} />}
                  {point.outage_reports_count > 0 && <div data-series="outage" className={`transition-all ${typeStyles.outage.bar}`} style={{ height: `${barHeight(point.outage_reports_count)}px` }} />}
                </div>
                <span className="h-4 whitespace-nowrap text-xs text-[#475569]">{(data.points.length - 1 - index) % labelEvery === 0 ? label : ''}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Share the page of a quartier. `text` says what was reported; the community notice is always appended. */
export function ShareButton({ quartier, commune, text }: { quartier: string; commune: string; text: string }) {
  const [shared, setShared] = useState(false)
  const share = async () => {
    const message = `${quartier}, commune de ${commune} (Kinshasa) — ${text} ${COMMUNITY_NOTICE}`

    try {
      if (navigator.share) await navigator.share({ title: `Situation électrique à ${quartier}`, text: message, url: window.location.href })
      else {
        await navigator.clipboard?.writeText(`${message} ${window.location.href}`)
        setShared(true)
      }
    } catch {
      // The visitor closed the share sheet: nothing to report.
    }
  }

  return <button type="button" onClick={share} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 font-bold hover:border-[#007fff] hover:text-[#007fff] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30">{shared ? <Check /> : <Share2 />} {shared ? 'Lien copié' : 'Partager la situation'}</button>
}

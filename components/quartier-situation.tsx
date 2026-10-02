'use client'

import Link from 'next/link'
import { ArrowLeft, Clock3, Zap, ZapOff } from 'lucide-react'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import { ActivityChart, RecentReports, ShareButton, statusStyles } from '@/components/situation'
import type { QuartierSituation } from '@/lib/api/types'
import { formatRelativeTime } from '@/lib/format-date'
import { affectedAreaLabel, COMMUNITY_NOTICE, outageDurationLabel, reportTypeLabel, situationStatusLabel, situationStatusLabels } from '@/lib/outage-options'
import { useApi } from '@/lib/use-api'
import { getQuartierSituation } from '@/services/outages'

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)
const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30'
const backLink = `inline-flex min-h-11 items-center gap-2 rounded font-bold text-[#0067d8] ${focusRing}`

/**
 * Page of a quartier. On a phone the first screen holds what matters most:
 * the community status, the two counters, the last activity and the two
 * buttons to report. The chart and the list of reports come after.
 */
export function QuartierSituationView({ communeSlug, quartierSlug, initialData }: { communeSlug: string; quartierSlug: string; initialData?: QuartierSituation }) {
  const { data: situation, error, loading, reload } = useApi(`situation:${communeSlug}/${quartierSlug}`, (signal) => getQuartierSituation(communeSlug, quartierSlug, signal), { initialData })
  const reportHref = (type?: 'outage' | 'restored') => `/signaler?${type ? `type=${type}&` : ''}commune=${encodeURIComponent(communeSlug)}&quartier=${encodeURIComponent(quartierSlug)}`

  if (!situation) {
    return (
      <main id="contenu" className="mx-auto max-w-5xl px-4 py-5 sm:px-5 sm:py-14 lg:px-8">
        <Link href={`/situation/${communeSlug}`} className={backLink}><ArrowLeft aria-hidden="true" /> Retour à la commune</Link>
        {error?.status === 404 && <EmptyState className="mt-5" title="Quartier introuvable" description="Ce quartier n'existe pas dans cette commune." action={{ href: `/situation/${communeSlug}`, label: 'Voir les quartiers de la commune' }} />}
        {error && error.status !== 404 && <ErrorState error={error} onRetry={reload} className="mt-5" />}
        {loading && (
          <div className="mt-5">
            <LoadingLabel />
            <Skeleton className="h-9 max-w-xs" />
            <Skeleton className="mt-5 h-64 rounded-2xl" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          </div>
        )}
      </main>
    )
  }

  const { quartier, commune } = situation
  const status = situationStatusLabels[situation.situation_status] ?? situationStatusLabels.no_recent_reports
  const styles = statusStyles[situation.situation_status] ?? statusStyles.no_recent_reports
  const counter = 'rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 sm:p-4'

  return (
    <main id="contenu" className="mx-auto max-w-5xl px-4 py-2 sm:px-5 sm:py-14 lg:px-8">
      <Link href={`/situation/${commune.slug}`} className={backLink}><ArrowLeft aria-hidden="true" /> Commune de {commune.name}</Link>
      <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight sm:mt-5 sm:text-4xl">{quartier.name}</h1>

      <section aria-labelledby="etat-communautaire" className={`mt-3 rounded-2xl border p-3 sm:mt-8 sm:p-8 ${styles.panel}`}>
        <p className="text-sm font-semibold text-[#475569]">Signalé par les habitants depuis 24 h</p>
        <h2 id="etat-communautaire" className={`text-xl font-bold leading-snug sm:mt-1 sm:text-3xl ${styles.accent}`}>{situationStatusLabel(situation.situation_status, situation)}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4">
          <div className={counter}>
            <dd className="flex items-center gap-2 text-3xl font-bold text-[#0f172a] sm:text-5xl"><ZapOff aria-hidden="true" className="size-6 shrink-0 text-[#ce1021]" />{situation.outage_reports_count}</dd>
            <dt className="text-sm font-semibold leading-tight text-[#334155] sm:mt-1">{situation.outage_reports_count > 1 ? 'Coupures signalées' : 'Coupure signalée'}</dt>
          </div>
          <div className={counter}>
            <dd className="flex items-center gap-2 text-3xl font-bold text-[#0f172a] sm:text-5xl"><Zap aria-hidden="true" className="size-6 shrink-0 text-[#007fff]" />{situation.restoration_reports_count}</dd>
            <dt className="text-sm font-semibold leading-tight text-[#334155] sm:mt-1">{situation.restoration_reports_count > 1 ? 'Retours signalés' : 'Retour signalé'}</dt>
          </div>
        </dl>
        {situation.last_reported_at && situation.last_report_type && (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-[#334155] sm:mt-4 sm:text-base">
            <Clock3 aria-hidden="true" className="size-5 shrink-0" />
            <span>Dernière activité : <strong className="text-[#0f172a]">{lowerFirst(formatRelativeTime(situation.last_reported_at))}</strong></span>
            <span>({lowerFirst(reportTypeLabel(situation.last_report_type))})</span>
          </p>
        )}
      </section>

      {/* Side by side, so both stay on the first screen of a phone, above the tab bar. */}
      <section aria-labelledby="signaler-ici" className="mt-3 sm:mt-4">
        <h2 id="signaler-ici" className="text-sm font-bold sm:text-base">Vous êtes dans ce quartier ? Signalez :</h2>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <Link href={reportHref('outage')} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-[#b91c1c] px-2 py-2 text-center text-sm font-bold leading-tight text-white hover:bg-[#991b1b] sm:flex-row sm:gap-2 sm:text-base ${focusRing}`}><ZapOff aria-hidden="true" className="size-5 shrink-0" /><span><span className="sr-only">Signaler </span>Une coupure</span></Link>
          <Link href={reportHref('restored')} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-[#007fff] px-2 py-2 text-center text-sm font-bold leading-tight text-white hover:bg-[#006fe0] sm:flex-row sm:gap-2 sm:text-base ${focusRing}`}><Zap aria-hidden="true" className="size-5 shrink-0" /><span><span className="sr-only">Signaler </span>Le retour du courant</span></Link>
        </div>
      </section>

      <p className="mt-5 leading-7 text-[#475569]">{status.description} {situation.recent_reports_count > 0 && COMMUNITY_NOTICE}</p>

      {situation.outage_reports_count > 0 && (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className={counter}><dt className="text-sm text-[#475569]">Durée de coupure la plus rapportée</dt><dd className="mt-1 font-bold">{outageDurationLabel(situation.most_reported_outage_duration)}</dd></div>
          <div className={counter}><dt className="text-sm text-[#475569]">Zone de coupure la plus rapportée</dt><dd className="mt-1 font-bold">{affectedAreaLabel(situation.most_reported_affected_area)}</dd></div>
        </dl>
      )}

      <div className="mt-6"><ActivityChart communeSlug={commune.slug} quartierSlug={quartier.slug} /></div>

      <section className="mt-8">
        <h2 className="text-xl font-bold sm:text-2xl">Derniers signalements</h2>
        <div className="mt-4">
          <RecentReports
            quartierId={quartier.id}
            showLocation={false}
            dateFormat="datetime"
            limit={10}
            empty={<EmptyState title="Aucun signalement récent" description={situationStatusLabels.no_recent_reports.description} />}
          />
        </div>
      </section>

      <div className="mt-8"><ShareButton quartier={quartier.name} commune={commune.name} text={status.share} /></div>
    </main>
  )
}

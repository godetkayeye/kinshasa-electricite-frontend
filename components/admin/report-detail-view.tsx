'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ExternalLink, RotateCcw, ShieldOff } from 'lucide-react'
import { ModerationDialog } from '@/components/admin/moderation-dialog'
import { focusRing, ModerationBadge, Notice, Panel, SuspicionBadge, TypeBadge } from '@/components/admin/ui'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import { moderationActionLabels, moderationReasonLabel, suspicionIndicatorLabels } from '@/lib/admin/labels'
import type { AdminReport } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/format-date'
import { affectedAreaLabel, outageDurationLabel } from '@/lib/outage-options'
import { useApi } from '@/lib/use-api'
import { getReport } from '@/services/admin/reports'

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="px-5 py-3 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#64748b]">{label}</dt><dd className="mt-1 text-sm text-[#0f172a] sm:mt-0">{children}</dd></div>
}

const none = <span className="text-[#64748b]">Non renseigné</span>

export function ReportDetailView({ id }: { id: number }) {
  const { data, error, loading, reload } = useApi(`admin-report:${id}`, (signal) => getReport(id, signal))
  // The API returns the updated report after a decision: the page is refreshed in place.
  const [updated, setUpdated] = useState<AdminReport | null>(null)
  const [dialog, setDialog] = useState<'invalidate' | 'restore' | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const report = updated ?? data
  const backLink = <Link href="/admin/signalements" className={`mb-5 inline-flex items-center gap-2 rounded text-sm font-bold text-[#0067d8] hover:underline ${focusRing}`}><ArrowLeft aria-hidden="true" className="size-4" /> Tous les signalements</Link>

  if (!report) {
    return (
      <>
        {backLink}
        {error?.status === 404 && <EmptyState title="Signalement introuvable" description="Ce signalement n'existe pas." action={{ href: '/admin/signalements', label: 'Voir les signalements' }} />}
        {error && error.status !== 404 && <ErrorState error={error} onRetry={reload} />}
        {loading && <div className="flex flex-col gap-4"><LoadingLabel /><Skeleton className="h-10 max-w-sm" /><Skeleton className="h-72 rounded-2xl" /></div>}
      </>
    )
  }

  const invalidated = report.moderation.status === 'invalidated'
  const logs = report.moderation_logs ?? []

  return (
    <>
      {backLink}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Signalement n° {report.id}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2"><TypeBadge type={report.report_type} /><ModerationBadge status={report.moderation.status} /><SuspicionBadge suspicion={report.suspicion} /></div>
        </div>
        {invalidated
          ? <button type="button" onClick={() => setDialog('restore')} className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#007fff] px-4 font-bold text-white hover:bg-[#006fe0] ${focusRing}`}><RotateCcw aria-hidden="true" className="size-4" /> Restaurer</button>
          : <button type="button" onClick={() => setDialog('invalidate')} className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#fecaca] bg-white px-4 font-bold text-[#b91c1c] hover:bg-[#fff1f2] ${focusRing}`}><ShieldOff aria-hidden="true" className="size-4" /> Invalider le signalement</button>}
      </div>

      <div className="flex flex-col gap-5">
        {done && <Notice tone="success">{done}</Notice>}
        {invalidated && (
          <Notice>
            Signalement invalidé{report.moderation.moderated_at && <> le {formatDateTime(report.moderation.moderated_at).toLowerCase()}</>}{report.moderation.moderated_by && <> par {report.moderation.moderated_by.name}</>} — motif : {moderationReasonLabel(report.moderation.reason_code)}.
            {report.moderation.reason_note && <span className="mt-1 block whitespace-pre-wrap break-words font-normal">{report.moderation.reason_note}</span>}
            <span className="mt-1 block font-normal">Il n&apos;est plus pris en compte dans les données publiques.</span>
          </Notice>
        )}

        <Panel title="Détails">
          <dl className="divide-y divide-[#e2e8f0]">
            <Detail label="Type">{report.report_type === 'restored' ? 'Retour du courant' : 'Coupure'}</Detail>
            <Detail label="Commune">{report.commune.name}</Detail>
            <Detail label="Quartier">
              {report.quartier.name}{' '}
              <Link href={`/situation/${report.commune.slug}/${report.quartier.slug}`} target="_blank" rel="noopener" className={`ml-2 inline-flex items-center gap-1 rounded font-bold text-[#0067d8] hover:underline ${focusRing}`}>Fiche publique <ExternalLink aria-hidden="true" className="size-3.5" /><span className="sr-only">(nouvel onglet)</span></Link>
            </Detail>
            {report.report_type === 'outage' && <Detail label="Durée déclarée">{outageDurationLabel(report.outage_duration)}</Detail>}
            <Detail label={report.report_type === 'restored' ? 'Zone rétablie' : 'Zone concernée'}>{affectedAreaLabel(report.affected_area)}</Detail>
            <Detail label="Date">{formatDateTime(report.reported_at)}</Detail>
            <Detail label="Nom ou pseudonyme">{report.reporter_name ? <span className="break-words">{report.reporter_name}</span> : none}</Detail>
            {/* User content: rendered as text by React, never as HTML. */}
            <Detail label="Commentaire">{report.comment ? <p className="whitespace-pre-wrap break-words">{report.comment}</p> : none}</Detail>
          </dl>
          <p className="border-t border-[#e2e8f0] px-5 py-3 text-xs text-[#64748b]">Le nom et le commentaire ne sont jamais affichés sur le site public.</p>
        </Panel>

        <Panel title="Activité autour de ce signalement">
          <div className="px-5 py-4 text-sm leading-6">
            {report.suspicion?.is_suspicious ? (
              <>
                <p className="flex items-start gap-2 font-bold text-[#92400e]"><AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> Activité inhabituelle</p>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[#475569]">
                  {report.suspicion.indicators.map((indicator) => <li key={indicator}><strong className="text-[#0f172a]">{suspicionIndicatorLabels[indicator]?.label}</strong> — {suspicionIndicatorLabels[indicator]?.description}</li>)}
                </ul>
                <p className="mt-3 text-[#475569]">Cet indicateur ne signifie pas que le signalement est faux : il vous invite seulement à vérifier.</p>
              </>
            ) : <p className="text-[#475569]">Aucune activité inhabituelle détectée autour de ce signalement.</p>}
            {report.suspicion && <p className="mt-3 text-xs text-[#64748b]">Même quartier : {report.suspicion.burst_reports_count} signalement(s) à ±10 min · {report.suspicion.opposite_reports_count} de l&apos;autre type à ±5 min · {report.suspicion.volume_reports_count} à ±1 h.</p>}
          </div>
        </Panel>

        <Panel title="Historique de modération">
          {logs.length ? (
            <ol className="divide-y divide-[#e2e8f0]">
              {logs.map((log) => (
                <li key={log.id} className="px-5 py-4 text-sm">
                  <p className="font-bold">{moderationActionLabels[log.action]}</p>
                  <p className="mt-1 text-[#475569]">{formatDateTime(log.created_at)} · {log.admin?.name ?? 'Administrateur supprimé'}{log.reason_code && <> · Motif : {moderationReasonLabel(log.reason_code)}</>}</p>
                  {log.reason_note && <p className="mt-1 whitespace-pre-wrap break-words text-[#475569]">{log.reason_note}</p>}
                </li>
              ))}
            </ol>
          ) : <p className="px-5 py-4 text-sm text-[#475569]">Aucune décision de modération pour ce signalement.</p>}
        </Panel>
      </div>

      {dialog && (
        <ModerationDialog
          action={dialog}
          report={report}
          onClose={() => setDialog(null)}
          onDone={(next) => { setUpdated(next); setDialog(null); setDone(dialog === 'invalidate' ? 'Signalement invalidé. Les données publiques ont été recalculées.' : 'Signalement restauré. Il est de nouveau pris en compte dans les données publiques.') }}
        />
      )}
    </>
  )
}

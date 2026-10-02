import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { focusRing, ModerationBadge, SuspicionBadge, TypeBadge } from '@/components/admin/ui'
import type { AdminReport } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/format-date'
import { affectedAreaLabel, outageDurationLabel } from '@/lib/outage-options'

const duration = (report: AdminReport) => (report.report_type === 'outage' ? outageDurationLabel(report.outage_duration) : '—')

/**
 * Reports as a table on wide screens and as cards on narrow ones, so
 * nothing overflows horizontally on a phone.
 */
export function ReportList({ reports }: { reports: AdminReport[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Signalements</caption>
          <thead className="border-b border-[#e2e8f0] text-xs uppercase tracking-wide text-[#64748b]">
            <tr>
              {['ID', 'Type', 'Commune', 'Quartier', 'Zone', 'Durée', 'Date', 'État'].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-bold">{heading}</th>)}
              <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {reports.map((report) => (
              <tr key={report.id} className={report.moderation.status === 'invalidated' ? 'bg-[#f8fafc] text-[#64748b]' : ''}>
                <td className="px-4 py-3 font-mono text-xs">#{report.id}</td>
                <td className="px-4 py-3"><TypeBadge type={report.report_type} /></td>
                <td className="px-4 py-3">{report.commune.name}</td>
                <td className="px-4 py-3 font-semibold text-[#0f172a]">{report.quartier.name}</td>
                <td className="px-4 py-3">{affectedAreaLabel(report.affected_area)}</td>
                <td className="px-4 py-3">{duration(report)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatDateTime(report.reported_at)}</td>
                <td className="px-4 py-3"><div className="flex flex-col items-start gap-1"><ModerationBadge status={report.moderation.status} /><SuspicionBadge suspicion={report.suspicion} /></div></td>
                <td className="px-4 py-3 text-right"><Link href={`/admin/signalements/${report.id}`} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-[#0067d8] hover:underline ${focusRing}`}>Ouvrir<span className="sr-only"> le signalement {report.id}</span> <ChevronRight aria-hidden="true" className="size-4" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-[#e2e8f0] lg:hidden">
        {reports.map((report) => (
          <li key={report.id}>
            <Link href={`/admin/signalements/${report.id}`} className={`block px-4 py-4 hover:bg-[#f8fafc] ${focusRing}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-[#64748b]">#{report.id}</span>
                <TypeBadge type={report.report_type} />
                <ModerationBadge status={report.moderation.status} />
                <SuspicionBadge suspicion={report.suspicion} />
              </div>
              <p className="mt-2 font-bold text-[#0f172a]">{report.quartier.name} <span className="font-normal text-[#64748b]">· {report.commune.name}</span></p>
              <p className="mt-1 text-sm text-[#475569]">Zone : {affectedAreaLabel(report.affected_area)}{report.report_type === 'outage' && <> · Durée : {duration(report)}</>}</p>
              <p className="mt-1 text-xs text-[#64748b]">{formatDateTime(report.reported_at)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

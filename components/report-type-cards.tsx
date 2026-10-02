'use client'

import { Zap, ZapOff } from 'lucide-react'
import type { OutageReportType } from '@/lib/api/types'

const cards: { type: OutageReportType; Icon: typeof Zap; title: string; shortTitle: string; description: string; icon: string; selected: string; hover: string }[] = [
  {
    type: 'outage',
    Icon: ZapOff,
    title: 'Une coupure',
    shortTitle: 'Coupure',
    description: 'Mon quartier est actuellement sans électricité.',
    icon: 'bg-[#fff1f2] text-[#ce1021]',
    selected: 'border-[#ce1021] bg-[#fff7f7] ring-2 ring-[#ce1021]/10',
    hover: 'hover:border-[#f3a6ae]',
  },
  {
    type: 'restored',
    Icon: Zap,
    title: 'Le retour du courant',
    shortTitle: 'Retour du courant',
    description: "L'électricité vient de revenir dans mon quartier.",
    icon: 'bg-[#eff6ff] text-[#007fff]',
    selected: 'border-[#007fff] bg-[#eff6ff] ring-2 ring-[#007fff]/10',
    hover: 'hover:border-[#93c5fd]',
  },
]

/**
 * The two things a citizen can report. `compact` renders the short version
 * used on the home page.
 */
export function ReportTypeCards({ value, onChange, compact = false }: { value: OutageReportType | ''; onChange: (type: OutageReportType) => void; compact?: boolean }) {
  return (
    <div role="group" aria-label="Type de signalement" className="grid gap-3 sm:grid-cols-2">
      {cards.map(({ type, Icon, title, shortTitle, description, icon, selected, hover }) => (
        <button
          key={type}
          type="button"
          data-report-type={type}
          aria-pressed={value === type}
          onClick={() => onChange(type)}
          className={`flex rounded-2xl border text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/20 ${compact ? 'items-center gap-3 p-3' : 'flex-col gap-4 p-5 sm:p-6'} ${value === type ? selected : `border-[#e2e8f0] bg-white ${hover}`}`}
        >
          <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full ${compact ? 'size-9' : 'size-12'} ${icon}`}><Icon /></span>
          <span>
            <span className={`block font-bold text-[#0f172a] ${compact ? 'text-sm' : 'text-lg'}`}>{compact ? shortTitle : title}</span>
            {!compact && <span className="mt-1 block text-sm leading-6 text-[#64748b]">{description}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

export const reportTypeNames: Record<OutageReportType, string> = { outage: 'Coupure', restored: 'Retour du courant' }

export function isReportType(value: string | null | undefined): value is OutageReportType {
  return value === 'outage' || value === 'restored'
}

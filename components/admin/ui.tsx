import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ShieldOff, Zap, ZapOff } from 'lucide-react'
import { moderationStatusLabels, suspicionIndicatorLabels } from '@/lib/admin/labels'
import type { AdminReport, ModerationStatus } from '@/lib/admin/types'
import type { OutageReportType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30'

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748b]">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-[#e2e8f0] bg-white', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="font-bold text-[#0f172a]">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, detail, href }: { label: string; value: number; detail?: string; href?: string }) {
  const content = (
    <>
      <p className="text-sm font-semibold text-[#475569]">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">{value.toLocaleString('fr-FR')}</p>
      {detail && <p className="mt-1 text-xs text-[#64748b]">{detail}</p>}
    </>
  )
  const className = 'block rounded-2xl border border-[#e2e8f0] bg-white p-5'

  return href ? <Link href={href} className={cn(className, focusRing, 'transition hover:border-[#93c5fd] hover:shadow-sm')}>{content}</Link> : <div className={className}>{content}</div>
}

const badge = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold'

/** The type is always written: the colour and the icon only reinforce it. */
export function TypeBadge({ type }: { type: OutageReportType }) {
  return type === 'restored'
    ? <span className={cn(badge, 'bg-[#eff6ff] text-[#0067d8]')}><Zap aria-hidden="true" className="size-3.5" /> Retour du courant</span>
    : <span className={cn(badge, 'bg-[#fff1f2] text-[#b91c1c]')}><ZapOff aria-hidden="true" className="size-3.5" /> Coupure</span>
}

export function ModerationBadge({ status }: { status: ModerationStatus }) {
  return status === 'invalidated'
    ? <span className={cn(badge, 'bg-[#f1f5f9] text-[#334155]')}><ShieldOff aria-hidden="true" className="size-3.5" /> {moderationStatusLabels.invalidated}</span>
    : <span className={cn(badge, 'bg-[#e8f7ef] text-[#166534]')}><CheckCircle2 aria-hidden="true" className="size-3.5" /> {moderationStatusLabels.active}</span>
}

export function SuspicionBadge({ suspicion }: { suspicion: AdminReport['suspicion'] }) {
  if (!suspicion?.is_suspicious) return null

  return (
    <span className={cn(badge, 'bg-[#fff4e6] text-[#92400e]')} title={suspicion.indicators.map((indicator) => suspicionIndicatorLabels[indicator]?.label).join(', ')}>
      <AlertTriangle aria-hidden="true" className="size-3.5" /> Activité inhabituelle
    </span>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'success' | 'error'; children: React.ReactNode }) {
  const tones = { info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]', success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]', error: 'border-[#fecaca] bg-[#fff1f2] text-[#b91c1c]' }

  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm font-semibold leading-6', tones[tone])}>{children}</div>
}

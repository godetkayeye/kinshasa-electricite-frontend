import Link from 'next/link'
import { AlertCircle, RotateCcw } from 'lucide-react'
import type { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-[#e8eef5]', className)} />
}

/** Screen-reader announcement shown next to skeletons. */
export function LoadingLabel({ children = 'Chargement…' }: { children?: React.ReactNode }) {
  return <span className="sr-only" role="status">{children}</span>
}

/**
 * Failure of one section. Only the visitor-safe message of the ApiError is
 * shown: never a stack trace, an exception or an internal URL.
 */
export function ErrorState({ error, onRetry, className }: { error?: ApiError | null; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fff1f2] p-5 text-sm leading-6 text-[#b91c1c] sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="flex items-start gap-2 font-semibold">
        <AlertCircle className="mt-0.5 shrink-0" />
        {error?.message ?? 'Impossible de récupérer les informations pour le moment.'}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#fecaca] bg-white px-4 font-bold hover:border-[#b91c1c] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#b91c1c]/20">
          <RotateCcw /> Réessayer
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action, className }: { title: string; description: string; action?: { href: string; label: string }; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-6 text-center sm:p-8', className)}>
      <p className="font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748b]">{description}</p>
      {action && (
        <Link href={action.href} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#007fff] px-5 font-bold text-white hover:bg-[#006fe0] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30">
          {action.label}
        </Link>
      )}
    </div>
  )
}

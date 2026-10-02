import Link from 'next/link'
import { SearchX } from 'lucide-react'

type Action = { href: string; label: string }

/** Body of a « not found » page: what is missing and where to go next. */
export function NotFoundPanel({ title, description, actions }: { title: string; description: string; actions: [Action, ...Action[]] }) {
  return (
    <main id="contenu" className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-[#eff6ff] text-[#007fff]"><SearchX /></span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#007fff]">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-md leading-7 text-[#64748b]">{description}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {actions.map((action, index) => (
          <Link key={action.href} href={action.href} className={`inline-flex min-h-14 items-center justify-center rounded-xl px-5 font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30 ${index === 0 ? 'bg-[#007fff] text-white hover:bg-[#006fe0]' : 'border border-[#cbd5e1] bg-white text-[#0f172a] hover:border-[#007fff] hover:text-[#007fff]'}`}>
            {action.label}
          </Link>
        ))}
      </div>
    </main>
  )
}

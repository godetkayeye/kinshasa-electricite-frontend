'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import { QuartierCard } from '@/components/situation'
import type { CommuneSituation } from '@/lib/api/types'
import { formatRelativeTime } from '@/lib/format-date'
import { useApi } from '@/lib/use-api'
import { normalizeName } from '@/lib/use-locations'
import { pluralize } from '@/lib/utils'
import { getCommuneSituation } from '@/services/outages'

type Filter = 'all' | 'reported' | 'quiet' | 'most-reported'

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'reported', label: 'Avec signalements récents' },
  { value: 'quiet', label: 'Sans signalement récent' },
  { value: 'most-reported', label: 'Les plus signalés' },
]

export function CommuneSituationView({ communeSlug, initialData }: { communeSlug: string; initialData?: CommuneSituation }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const { data: commune, error, loading, reload } = useApi(`commune-situation:${communeSlug}`, (signal) => getCommuneSituation(communeSlug, signal), { initialData })

  const backLink = <Link href="/situation/communes" className="inline-flex min-h-11 items-center gap-2 rounded font-bold text-[#0067d8] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30"><ArrowLeft aria-hidden="true" /> Toutes les communes</Link>

  if (!commune) {
    return (
      <main id="contenu" className="mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-14 lg:px-8">
        {backLink}
        {error?.status === 404 && <EmptyState className="mt-7" title="Commune introuvable" description="Cette commune n'existe pas dans notre répertoire." action={{ href: '/situation/communes', label: 'Voir toutes les communes' }} />}
        {error && error.status !== 404 && <ErrorState error={error} onRetry={reload} className="mt-7" />}
        {loading && (
          <div className="mt-7">
            <LoadingLabel />
            <Skeleton className="h-10 max-w-lg" />
            <Skeleton className="mt-4 h-6 max-w-md" />
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} className="h-[168px] rounded-2xl" />)}</div>
          </div>
        )}
      </main>
    )
  }

  // The API lists the quartiers from the most to the least reported.
  const byName = [...commune.quartiers].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  const quartiers = (filter === 'most-reported' ? commune.quartiers.filter((quartier) => quartier.outage_reports_count > 0) : byName)
    .filter((quartier) => (filter === 'reported' ? quartier.recent_reports_count > 0 : filter === 'quiet' ? quartier.recent_reports_count === 0 : true))
    .filter((quartier) => normalizeName(quartier.name).includes(normalizeName(query)))

  return (
    <main id="contenu" className="mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-14 lg:px-8">
      {backLink}
      <h1 className="mt-3 text-[1.7rem] font-bold leading-tight tracking-tight sm:mt-7 sm:text-4xl">Situation signalée à {commune.name}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#475569]">
        {pluralize(commune.affected_quartiers_count, 'quartier concerné', 'quartiers concernés')} sur {commune.quartiers.length} · {pluralize(commune.outage_reports_count, 'coupure signalée', 'coupures signalées')} · {pluralize(commune.restoration_reports_count, 'retour du courant signalé', 'retours du courant signalés')}
        {commune.last_reported_at && <> · dernière activité : {formatRelativeTime(commune.last_reported_at).toLowerCase()}</>}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row">
        <label className="relative block flex-1 sm:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un quartier" aria-label="Rechercher un quartier" className="h-14 w-full rounded-xl border border-[#cbd5e1] bg-white pl-11 pr-4 text-base outline-none focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/15" />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} aria-label="Filtrer les quartiers" className="h-14 rounded-xl border border-[#cbd5e1] bg-white px-4 text-base font-semibold focus:outline-none focus:ring-4 focus:ring-[#007fff]/15">
          {filters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <h2 className="mt-8 text-xl font-bold sm:mt-12 sm:text-2xl">Quartiers de {commune.name}</h2>
      {quartiers.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{quartiers.map((quartier) => <QuartierCard key={quartier.id} quartier={quartier} commune={commune} />)}</div>
      ) : (
        <EmptyState
          className="mt-6"
          title={query ? 'Aucun quartier trouvé' : filter === 'quiet' ? 'Tous les quartiers ont des signalements récents' : 'Aucun signalement récent'}
          description={query ? 'Aucun quartier ne correspond à votre recherche.' : filter === 'quiet' ? 'Chaque quartier de cette commune a reçu au moins un signalement récent.' : `Soyez parmi les premiers à signaler la situation de votre quartier à ${commune.name}.`}
          action={query || filter === 'quiet' ? undefined : { href: `/signaler?commune=${commune.slug}`, label: 'Faire un signalement' }}
        />
      )}
    </main>
  )
}

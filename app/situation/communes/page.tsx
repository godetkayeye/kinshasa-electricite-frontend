'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/data-states'
import { CommuneList, CommuneListSkeleton, PageShell } from '@/components/situation'
import { useApi } from '@/lib/use-api'
import { normalizeName } from '@/lib/use-locations'
import { getCommunesSituation } from '@/services/outages'

export default function CommunesPage() {
  const [query, setQuery] = useState('')
  const { data, error, loading, reload } = useApi('communes-situation:name', (signal) => getCommunesSituation('name', signal))
  const filtered = (data ?? []).filter((commune) => normalizeName(commune.name).includes(normalizeName(query)))

  return (
    <PageShell>
      <main id="contenu" className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
        <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl">Toutes les communes</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#64748b]">Explorez la situation basée sur les signalements de la communauté dans les communes de Kinshasa.</p>
        <label className="relative mt-5 block max-w-xl sm:mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une commune" aria-label="Rechercher une commune" className="h-14 w-full rounded-xl border border-[#cbd5e1] bg-white pl-11 pr-4 text-base outline-none focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/15" />
        </label>
        <div className="mt-8">
          {error && <ErrorState error={error} onRetry={reload} />}
          {loading && !data && <CommuneListSkeleton count={8} />}
          {data && (filtered.length ? <CommuneList items={filtered} /> : <EmptyState title="Aucune commune trouvée" description={data.length ? 'Aucune commune ne correspond à votre recherche.' : "Aucune commune n'est disponible pour le moment."} />)}
        </div>
      </main>
    </PageShell>
  )
}

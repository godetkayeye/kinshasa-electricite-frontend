'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { X, ZapOff } from 'lucide-react'
import { EmptyState, ErrorState, LoadingLabel, Skeleton } from '@/components/data-states'
import type { MapFocus, MapMarker } from '@/components/map/kinshasa-map'
import { LocationSelects } from '@/components/situation'
import type { MapCommune, MapLevel, MapPeriod, MapPlace, MapQuartier } from '@/lib/api/types'
import { formatRelativeTime } from '@/lib/format-date'
import { KINSHASA, levelRange, mapLevelOrder, mapLevels, RECENT_ACTIVITY_MINUTES } from '@/lib/map-config'
import { COMMUNITY_NOTICE, outageDurationLabel } from '@/lib/outage-options'
import { useApi } from '@/lib/use-api'
import { useQuartiers } from '@/lib/use-locations'
import { pluralize } from '@/lib/utils'
import { getMapSituation } from '@/services/map'

// Leaflet needs the browser: the map itself is never rendered on the server.
const KinshasaMap = dynamic(() => import('@/components/map/kinshasa-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
})

type Filter = 'all' | 'strong' | 'low' | 'recent'
type Selection = { kind: 'commune'; communeSlug: string } | { kind: 'quartier'; communeSlug: string; quartierSlug: string }

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'strong', label: 'Fortement signalés' },
  { value: 'low', label: 'À confirmer' },
  { value: 'recent', label: 'Signalements récents' },
]

const periods: { value: MapPeriod; label: string }[] = [
  { value: '24h', label: 'Dernières 24 h' },
  { value: '7d', label: '7 derniers jours' },
]

const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30'
const chip = (active: boolean) => `inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-bold ${focusRing} ${active ? 'border-[#007fff] bg-[#007fff] text-white' : 'border-[#cbd5e1] bg-white text-[#334155] hover:border-[#007fff]'}`

function matches(place: MapPlace, filter: Filter): boolean {
  if (filter === 'strong') return place.level === 'high' || place.level === 'medium'
  if (filter === 'low') return place.level === 'low'
  if (filter === 'recent') return place.last_reported_at !== null && Date.now() - new Date(place.last_reported_at).getTime() <= RECENT_ACTIVITY_MINUTES * 60_000

  return true
}

/** Only places with known coordinates are ever drawn or flown to. */
function positioned<T extends MapPlace>(place: T): place is T & { latitude: number; longitude: number } {
  return place.latitude !== null && place.longitude !== null
}

function LevelDot({ level }: { level: MapLevel }) {
  return <span aria-hidden="true" className="inline-block size-3.5 shrink-0 rounded-full border-2" style={{ background: mapLevels[level].fill, borderColor: mapLevels[level].stroke }} />
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-baseline justify-between gap-4 py-2"><dt className="text-sm text-[#475569]">{label}</dt><dd className="text-right font-bold text-[#0f172a]">{children}</dd></div>
}

export function MapView() {
  const [period, setPeriod] = useState<MapPeriod>('24h')
  const [filter, setFilter] = useState<Filter>('all')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [focus, setFocus] = useState<MapFocus | null>(null)
  const [search, setSearch] = useState({ commune: '', quartier: '' })
  const { data, error, loading, reload } = useApi(`map:${period}`, (signal) => getMapSituation(period, signal))

  const communes = data?.communes ?? []
  const quartiers = data?.quartiers ?? []
  const selectedCommune = selection ? communes.find((commune) => commune.slug === selection.communeSlug) : undefined
  // The names of the quartiers of the selected commune come from the same list as everywhere else on the site.
  const communeQuartiers = useQuartiers(selection?.communeSlug)

  const communeOf = (quartier: MapQuartier) => communes.find((commune) => commune.id === quartier.commune_id)

  // One marker per commune, and one per reported quartier whose position is known.
  const markers: MapMarker[] = [
    ...communes.filter(positioned).filter((commune) => matches(commune, filter)).map((commune) => ({ key: `commune:${commune.slug}`, kind: 'commune' as const, name: commune.name, latitude: commune.latitude, longitude: commune.longitude, level: commune.level, outageReportsCount: commune.outage_reports_count })),
    ...quartiers.filter(positioned).filter((quartier) => matches(quartier, filter)).flatMap((quartier) => {
      const commune = communeOf(quartier)

      return commune ? [{ key: `quartier:${commune.slug}/${quartier.slug}`, kind: 'quartier' as const, name: `${quartier.name}, ${commune.name}`, latitude: quartier.latitude, longitude: quartier.longitude, level: quartier.level, outageReportsCount: quartier.outage_reports_count }] : []
    }),
  ]

  const selectCommune = (commune: MapCommune, move = true) => {
    setSelection({ kind: 'commune', communeSlug: commune.slug })
    if (move && positioned(commune)) setFocus({ latitude: commune.latitude, longitude: commune.longitude, zoom: KINSHASA.communeZoom })
  }

  const selectQuartier = (communeSlug: string, quartierSlug: string) => {
    const commune = communes.find((item) => item.slug === communeSlug)
    const quartier = quartiers.find((item) => item.slug === quartierSlug && item.commune_id === commune?.id)

    setSelection({ kind: 'quartier', communeSlug, quartierSlug })
    // A quartier without known coordinates is shown through its commune, never at a guessed spot.
    if (quartier && positioned(quartier)) setFocus({ latitude: quartier.latitude, longitude: quartier.longitude, zoom: KINSHASA.quartierZoom })
    else if (commune && positioned(commune)) setFocus({ latitude: commune.latitude, longitude: commune.longitude, zoom: KINSHASA.communeZoom })
  }

  const onMarker = (key: string) => {
    const [kind, path] = key.split(':')
    const [communeSlug, quartierSlug] = path.split('/')

    if (kind === 'quartier' && quartierSlug) setSelection({ kind: 'quartier', communeSlug, quartierSlug })
    else setSelection({ kind: 'commune', communeSlug })
  }

  const reportedCommunes = communes.filter((commune) => commune.outage_reports_count > 0)
  const reportedQuartiers = quartiers.filter((quartier) => quartier.outage_reports_count > 0)
  const outageReports = communes.reduce((count, commune) => count + commune.outage_reports_count, 0)
  const periodLabel = period === '24h' ? 'depuis 24 heures' : 'depuis 7 jours'

  return (
    <main id="contenu" className="mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-10 lg:px-8">
      <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl">Carte des coupures</h1>
      <p className="mt-2 max-w-2xl text-[#475569] sm:text-lg">Visualisez les signalements d&apos;électricité quartier par quartier à Kinshasa.</p>

      <section aria-labelledby="synthese" className="mt-5">
        <h2 id="synthese" className="text-sm font-semibold text-[#475569]">Situation signalée à Kinshasa, {periodLabel}</h2>
        <dl aria-busy={loading} className="mt-2 grid grid-cols-3 gap-3">
          {[
            [data ? `${reportedCommunes.length} / ${communes.length}` : '—', 'communes concernées'],
            [data ? reportedQuartiers.length.toLocaleString('fr-FR') : '—', 'quartiers signalés'],
            [data ? outageReports.toLocaleString('fr-FR') : '—', 'coupures signalées'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5">
              <dd className="text-xl font-bold text-[#0f172a] sm:text-2xl">{value}</dd>
              <dt className="text-xs leading-tight text-[#475569] sm:text-sm">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="recherche" className="mt-5">
        <h2 id="recherche" className="text-base font-bold">Rechercher un quartier</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <LocationSelects
            communeSlug={search.commune}
            quartierSlug={search.quartier}
            onCommuneChange={(slug) => {
              setSearch({ commune: slug, quartier: '' })
              const commune = communes.find((item) => item.slug === slug)

              if (commune) selectCommune(commune)
              else setSelection(null)
            }}
            onQuartierChange={(slug) => {
              setSearch((current) => ({ ...current, quartier: slug }))
              if (slug) selectQuartier(search.commune, slug)
            }}
          />
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-2">
        <div role="group" aria-label="Filtrer les lieux affichés" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={chip(filter === item.value)}>{item.label}</button>)}
        </div>
        <div role="group" aria-label="Période" className="flex gap-2">
          {periods.map((item) => <button key={item.value} type="button" aria-pressed={period === item.value} onClick={() => setPeriod(item.value)} className={chip(period === item.value)}>{item.label}</button>)}
        </div>
      </div>

      {error && <ErrorState error={error} onRetry={reload} className="mt-4" />}

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#e5eef6]">
        <div className="h-[62dvh] min-h-[360px] md:h-[640px]">
          {loading && !data && <><LoadingLabel>Chargement de la carte…</LoadingLabel><Skeleton className="h-full w-full rounded-none" /></>}
          {data && <KinshasaMap markers={markers} selectedKey={selection ? (selection.kind === 'quartier' ? `quartier:${selection.communeSlug}/${selection.quartierSlug}` : `commune:${selection.communeSlug}`) : null} focus={focus} onSelect={onMarker} />}
        </div>

        {data && (
          <div className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[70%] rounded-xl border border-[#e2e8f0] bg-white/95 p-2.5 text-xs text-[#334155] shadow-sm">
            <p className="sr-only">Légende</p>
            <ul className="flex flex-col gap-1">
              {mapLevelOrder.map((level) => <li key={level} className="flex items-center gap-2"><LevelDot level={level} /><span><strong>{mapLevels[level].short}</strong> <span className="hidden sm:inline">· {levelRange(level, data.levels)}</span></span></li>)}
            </ul>
          </div>
        )}

        {selection && selectedCommune && data && (
          <PlaceSheet onClose={() => setSelection(null)} title={selection.kind === 'quartier' ? (communeQuartiers.data?.find((item) => item.slug === selection.quartierSlug)?.name ?? quartiers.find((item) => item.slug === selection.quartierSlug && item.commune_id === selectedCommune.id)?.name ?? 'Quartier') : selectedCommune.name}>
            {selection.kind === 'commune' ? (
              <CommuneDetails commune={selectedCommune} quartiers={quartiers.filter((quartier) => quartier.commune_id === selectedCommune.id)} onQuartier={(slug) => selectQuartier(selectedCommune.slug, slug)} />
            ) : (
              <QuartierDetails commune={selectedCommune} quartierSlug={selection.quartierSlug} quartier={quartiers.find((item) => item.slug === selection.quartierSlug && item.commune_id === selectedCommune.id)} />
            )}
          </PlaceSheet>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-[#475569]">Les informations affichées sont basées sur les signalements de la population et ne constituent pas une confirmation officielle de l&apos;état du réseau électrique.</p>
      {data && data.quartiers_without_coordinates > 0 && <p className="mt-1 text-sm leading-6 text-[#475569]">Chaque point représente une commune. Les quartiers dont la position n&apos;est pas encore connue sont comptés dans le point de leur commune ; touchez une commune pour voir ses quartiers signalés.</p>}

      {data && (
        <section aria-labelledby="communes-signalees" className="mt-8">
          <h2 id="communes-signalees" className="text-xl font-bold sm:text-2xl">Communes les plus signalées</h2>
          {reportedCommunes.length === 0 ? (
            <EmptyState className="mt-4" title="Aucune coupure signalée" description={`Aucun habitant n'a signalé de coupure ${periodLabel}. ${COMMUNITY_NOTICE}`} action={{ href: '/signaler?type=outage', label: 'Signaler une coupure' }} />
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reportedCommunes.slice(0, 9).map((commune) => (
                <li key={commune.id}>
                  <button type="button" onClick={() => { selectCommune(commune); document.getElementById('contenu')?.querySelector('.leaflet-container')?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }} className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-left hover:border-[#007fff] ${focusRing}`}>
                    <span><span className="block font-bold">{commune.name}</span><span className="flex items-center gap-2 text-sm text-[#475569]"><LevelDot level={commune.level} />{mapLevels[commune.level].short}</span></span>
                    <span className="shrink-0 text-right text-sm text-[#475569]"><strong className="block text-xl text-[#0f172a]">{commune.outage_reports_count}</strong>{commune.outage_reports_count > 1 ? 'coupures' : 'coupure'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

/** Details of the selected place: a sheet at the bottom of phones, a panel on the map on wide screens. */
function PlaceSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <section aria-label={`Informations : ${title}`} className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 max-h-[58dvh] overflow-y-auto overscroll-contain rounded-t-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.15)] md:absolute md:inset-x-auto md:bottom-auto md:right-3 md:top-3 md:max-h-[calc(100%-1.5rem)] md:w-96 md:rounded-2xl md:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold leading-tight">{title}</h2>
        <button type="button" onClick={onClose} className={`-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-[#f1f5f9] ${focusRing}`}><X aria-hidden="true" /><span className="sr-only">Fermer</span></button>
      </div>
      {children}
    </section>
  )
}

function Situation({ place }: { place: Pick<MapPlace, 'level'> }) {
  return <span className="inline-flex items-center justify-end gap-2"><LevelDot level={place.level} />{mapLevels[place.level].label}</span>
}

function CommuneDetails({ commune, quartiers, onQuartier }: { commune: MapCommune; quartiers: MapQuartier[]; onQuartier: (slug: string) => void }) {
  return (
    <>
      <dl className="mt-2 divide-y divide-[#e2e8f0]">
        <Row label="Situation"><Situation place={commune} /></Row>
        <Row label="Coupures signalées">{commune.outage_reports_count}</Row>
        <Row label="Retours du courant signalés">{commune.restoration_reports_count}</Row>
        <Row label="Dernier signalement">{commune.last_reported_at ? formatRelativeTime(commune.last_reported_at) : 'Aucun'}</Row>
      </dl>
      {quartiers.length > 0 && (
        <>
          <h3 className="mt-3 text-sm font-bold">Quartiers signalés</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {quartiers.map((quartier) => (
              <li key={quartier.id}>
                <button type="button" onClick={() => onQuartier(quartier.slug)} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] px-3 text-left hover:border-[#007fff] ${focusRing}`}>
                  <span className="flex items-center gap-2 font-semibold"><LevelDot level={quartier.level} />{quartier.name}</span>
                  <span className="shrink-0 text-sm text-[#475569]">{pluralize(quartier.outage_reports_count, 'coupure', 'coupures')}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-4 grid gap-2">
        <Link href={`/signaler?type=outage&commune=${commune.slug}`} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#b91c1c] px-4 font-bold text-white hover:bg-[#991b1b] ${focusRing}`}><ZapOff aria-hidden="true" className="size-5" /> Signaler une coupure</Link>
        <Link href={`/situation/${commune.slug}`} className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cbd5e1] px-4 font-bold hover:border-[#007fff] hover:text-[#0067d8] ${focusRing}`}>Voir tous les quartiers</Link>
      </div>
    </>
  )
}

function QuartierDetails({ commune, quartierSlug, quartier }: { commune: MapCommune; quartierSlug: string; quartier: MapQuartier | undefined }) {
  const located = quartier?.latitude != null && quartier.longitude != null

  return (
    <>
      <dl className="mt-2 divide-y divide-[#e2e8f0]">
        <Row label="Commune">{commune.name}</Row>
        <Row label="Situation"><Situation place={{ level: quartier?.level ?? 'none' }} /></Row>
        <Row label="Coupures signalées">{quartier?.outage_reports_count ?? 0}</Row>
        <Row label="Retours du courant signalés">{quartier?.restoration_reports_count ?? 0}</Row>
        <Row label="Dernier signalement">{quartier?.last_reported_at ? formatRelativeTime(quartier.last_reported_at) : 'Aucun'}</Row>
        {quartier?.most_reported_outage_duration && <Row label="Durée la plus déclarée">{outageDurationLabel(quartier.most_reported_outage_duration)}</Row>}
      </dl>
      {!located && <p className="mt-2 text-xs leading-5 text-[#475569]">La position précise de ce quartier n&apos;est pas encore connue : la carte montre sa commune.</p>}
      <div className="mt-4 grid gap-2">
        <Link href={`/signaler?type=outage&commune=${commune.slug}&quartier=${quartierSlug}`} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#b91c1c] px-4 font-bold text-white hover:bg-[#991b1b] ${focusRing}`}><ZapOff aria-hidden="true" className="size-5" /> Signaler aussi une coupure</Link>
        <Link href={`/situation/${commune.slug}/${quartierSlug}`} className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cbd5e1] px-4 font-bold hover:border-[#007fff] hover:text-[#0067d8] ${focusRing}`}>Voir la fiche du quartier</Link>
      </div>
    </>
  )
}

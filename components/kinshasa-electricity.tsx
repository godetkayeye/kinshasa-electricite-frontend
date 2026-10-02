'use client'

import Link from 'next/link'
import { PageShell, SituationSearch, TopQuartiers } from '@/components/situation'
import { useApi } from '@/lib/use-api'
import { getStatistics } from '@/services/outages'

const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30'

/** The four figures of the last 24 hours, as plain numbers. */
function Figures() {
  const { data, error, loading, reload } = useApi('statistics', getStatistics)

  if (error) {
    return (
      <p role="alert" className="mt-8 border-t border-[#e2e8f0] pt-5 text-sm text-[#475569]">
        Les chiffres ne sont pas disponibles pour le moment. <button type="button" onClick={reload} className={`rounded font-semibold text-[#0067d8] underline ${focusRing}`}>Réessayer</button>
      </p>
    )
  }

  const value = (count: number | undefined) => (count === undefined ? '—' : count.toLocaleString('fr-FR'))
  const figures = [
    [data ? `${data.affected_communes} sur ${data.total_communes}` : '—', 'communes avec des coupures signalées'],
    [value(data?.affected_quartiers), 'quartiers avec des coupures signalées'],
    [value(data?.recent_outage_reports), 'coupures signalées'],
    [value(data?.recent_restoration_reports), 'retours du courant signalés'],
  ]

  return (
    <div className="mt-8 border-t border-[#e2e8f0] pt-5">
      <h2 className="text-sm font-semibold text-[#475569]">Depuis 24 heures</h2>
      <dl aria-busy={loading} className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {figures.map(([number, label]) => (
          <div key={label}>
            <dd className="text-2xl font-bold text-[#0f172a]">{number}</dd>
            <dt className="mt-0.5 text-sm leading-5 text-[#475569]">{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function KinshasaElectricity() {
  return (
    <PageShell>
      <main id="contenu">
        <section className="border-b border-[#e2e8f0] bg-white">
          <div className="mx-auto max-w-5xl px-4 py-7 sm:px-5 sm:py-14 lg:px-8">
            <h1 className="text-[1.7rem] font-bold leading-tight text-[#0f172a] sm:text-4xl">Coupures d&apos;électricité à Kinshasa</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
              Les habitants signalent ici les coupures et les retours du courant, quartier par quartier. Regardez ce qui a été signalé chez vous, ou ajoutez votre signalement.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:mt-7 sm:flex-row">
              <Link href="/signaler?type=outage" className={`inline-flex min-h-14 items-center justify-center rounded-xl bg-[#007fff] px-5 text-base font-bold text-white hover:bg-[#006fe0] ${focusRing}`}>Signaler une coupure</Link>
              <Link href="/signaler?type=restored" className={`inline-flex min-h-14 items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-5 text-base font-bold text-[#0f172a] hover:border-[#007fff] hover:text-[#0067d8] ${focusRing}`}>Signaler le retour du courant</Link>
            </div>
            <Figures />
          </div>
        </section>

        <section id="verifier" className="mx-auto max-w-5xl scroll-mt-6 px-4 py-8 sm:px-5 sm:py-10 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0f172a]">Vérifier un quartier</h2>
          <p className="mt-2 text-[#475569]">Choisissez une commune puis un quartier pour voir les signalements récents.</p>
          <div className="mt-5"><SituationSearch /></div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-5 sm:pb-10 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-2xl font-bold text-[#0f172a]">Quartiers les plus signalés</h2>
            <Link href="/situation" className={`inline-flex min-h-11 items-center rounded font-semibold text-[#0067d8] underline ${focusRing}`}>Voir toute la situation</Link>
          </div>
          <div className="mt-5"><TopQuartiers limit={6} /></div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-5 lg:px-8">
          <h2 className="text-lg font-bold text-[#0f172a]">À savoir</h2>
          <p className="mt-2 max-w-3xl leading-7 text-[#475569]">
            Ces informations viennent uniquement des habitants. Elles ne sont pas confirmées par la SNEL, et un quartier sans signalement n&apos;a pas forcément du courant. Ce site est indépendant. <Link href="/a-propos" className={`rounded font-semibold text-[#0067d8] underline ${focusRing}`}>En savoir plus</Link>
          </p>
        </section>
      </main>
    </PageShell>
  )
}

export default KinshasaElectricity

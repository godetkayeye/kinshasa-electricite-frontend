import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CommunityNotice, PageShell, RecentReports, SituationSearch, StatCards, TopCommunes, TopQuartiers } from '@/components/situation'

export const metadata: Metadata = pageMetadata({
  title: 'Situation électrique signalée à Kinshasa',
  description: "Coupures d'électricité et retours du courant signalés par les habitants dans les communes et quartiers de Kinshasa. Informations communautaires, sans confirmation officielle.",
  path: '/situation',
})

export default function SituationPage() {
  return (
    <PageShell>
      <main id="contenu">
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-14 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight sm:text-5xl">Situation électrique signalée à Kinshasa</h1>
              <p className="mt-3 text-base leading-7 text-[#475569] sm:mt-5 sm:text-lg sm:leading-8">Consultez les coupures d&apos;électricité signalées par les habitants à travers les communes et quartiers de Kinshasa.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="#verifier" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#007fff] px-5 font-bold text-white hover:bg-[#006fe0]">Vérifier mon quartier <ArrowRight aria-hidden="true" /></Link>
                <Link href="/signaler" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-5 font-bold hover:border-[#007fff] hover:text-[#007fff]">Faire un signalement</Link>
              </div>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-5 lg:px-8"><CommunityNotice /></div>
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:px-8">
          <h2 className="mb-5 text-2xl font-bold">Vue d&apos;ensemble</h2>
          <StatCards />
        </section>
        <section id="verifier" className="scroll-mt-6 bg-white py-8 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold sm:text-3xl">Vérifier la situation de votre quartier</h2>
            </div>
            <SituationSearch />
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Quartiers les plus signalés</h2>
            </div>
          </div>
          <div className="mt-7"><TopQuartiers /></div>
        </section>
        <section className="bg-white py-8 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Communes avec le plus de signalements récents</h2>
              </div>
              <Link href="/situation/communes" className="inline-flex min-h-11 items-center rounded font-bold text-[#0067d8] underline">Voir toutes les communes</Link>
            </div>
            <div className="mt-7"><TopCommunes /></div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold sm:text-3xl">Signalements récents</h2>
          </div>
          <RecentReports />
        </section>
      </main>
    </PageShell>
  )
}

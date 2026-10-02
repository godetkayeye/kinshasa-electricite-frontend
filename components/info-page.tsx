import { PageShell } from '@/components/situation'

/** Layout of the text pages (about, privacy, contact). */
export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <PageShell>
      <main id="contenu" className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007fff]">{eyebrow}</p>
        <h1 className="mt-2 text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-base leading-7 text-[#475569] sm:mt-5 sm:text-lg sm:leading-8">{intro}</p>
        <div className="mt-6 flex flex-col gap-4 sm:mt-10 sm:gap-8">{children}</div>
      </main>
    </PageShell>
  )
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 leading-7 text-[#475569] [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-[#0f172a] [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">{children}</div>
    </section>
  )
}

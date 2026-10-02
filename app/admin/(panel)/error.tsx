'use client'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main id="contenu" className="flex min-h-screen items-center justify-center bg-[#f1f5f9] px-4 text-[#0f172a]">
      <div role="alert" className="w-full max-w-md rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Administration indisponible</h1>
        <p className="mt-3 leading-7 text-[#64748b]">Impossible de vérifier votre session pour le moment. Veuillez réessayer dans quelques instants.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#007fff] px-5 font-bold text-white hover:bg-[#006fe0] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30">Réessayer</button>
      </div>
    </main>
  )
}

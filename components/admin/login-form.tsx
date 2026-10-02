'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, LogIn, Zap } from 'lucide-react'
import { Notice } from '@/components/admin/ui'
import { toApiError } from '@/lib/api/client'
import { signIn } from '@/services/admin/auth'

/** Message for a failed sign-in. It never says whether the e-mail address exists. */
function failureMessage(status: number, code: string | null, kind: string): string {
  if (code === 'account_disabled') return 'Ce compte est désactivé. Contactez un administrateur.'
  if (status === 401 || status === 422) return 'Identifiants incorrects.'
  if (status === 403) return 'Accès refusé.'
  if (status === 429) return 'Trop de tentatives de connexion. Veuillez patienter une minute avant de réessayer.'
  if (kind === 'network') return 'Impossible de contacter le service. Vérifiez votre connexion puis réessayez.'

  return 'Connexion impossible pour le moment. Veuillez réessayer dans quelques instants.'
}

export function LoginForm({ sessionExpired }: { sessionExpired: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (loading) return

    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      // The dashboard is rendered by the server with the new session.
      router.replace('/admin')
      router.refresh()
    } catch (caught) {
      const failure = toApiError(caught)

      setError(failureMessage(failure.status, failure.code, failure.kind))
      setPassword('')
      setLoading(false)
    }
  }

  const inputClass = 'h-12 w-full rounded-xl border border-[#cbd5e1] bg-white px-4 outline-none transition focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/15'

  return (
    <main id="contenu" className="flex min-h-screen flex-col bg-[#f1f5f9] text-[#0f172a]">
      <div aria-hidden="true" className="h-1 w-full bg-[linear-gradient(90deg,#007fff_0_48%,#f7d618_48%_52%,#ce1021_52%)]" />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-xl shadow-[#0f172a]/5 sm:p-8">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-[#007fff] text-white"><Zap fill="currentColor" /></span>
            <span><strong className="block">Kinshasa Électricité</strong><small className="text-xs text-[#64748b]">Administration</small></span>
          </div>
          <h1 className="mt-7 text-2xl font-bold tracking-tight">Connexion</h1>
          <p className="mt-1 text-sm text-[#64748b]">Espace réservé aux administrateurs de la plateforme.</p>

          <div className="mt-5 flex flex-col gap-3">
            {sessionExpired && !error && <Notice>Votre session a expiré. Veuillez vous reconnecter.</Notice>}
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-semibold leading-6 text-[#b91c1c]"><AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" />{error}</div>}
          </div>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold">Adresse e-mail</label>
              <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-bold">Mot de passe</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
            </div>
            <button type="submit" disabled={loading || !email || !password} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#007fff] font-bold text-white hover:bg-[#006fe0] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 aria-hidden="true" className="animate-spin" /> Connexion…</> : <><LogIn aria-hidden="true" /> Se connecter</>}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

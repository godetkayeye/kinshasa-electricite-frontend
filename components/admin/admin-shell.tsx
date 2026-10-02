'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, ExternalLink, LayoutDashboard, LogOut, MapPinned, MessageSquareWarning, Zap } from 'lucide-react'
import { focusRing } from '@/components/admin/ui'
import type { AdminUser } from '@/lib/admin/types'
import { signOut } from '@/services/admin/auth'

const navigation = [
  { href: '/admin', label: 'Tableau de bord', short: 'Accueil', Icon: LayoutDashboard },
  { href: '/admin/signalements', label: 'Signalements', short: 'Signalements', Icon: MessageSquareWarning },
  { href: '/admin/communes', label: 'Communes & quartiers', short: 'Communes', Icon: MapPinned },
  { href: '/admin/activite', label: 'Activité', short: 'Activité', Icon: Activity },
]

function FlagLine() {
  return <div aria-hidden="true" className="h-1 w-full bg-[linear-gradient(90deg,#007fff_0_48%,#f7d618_48%_52%,#ce1021_52%)]" />
}

/** Layout of the back-office: sidebar on large screens, top bar and tab bar on small ones. */
export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)
  const isCurrent = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`))

  const logout = async () => {
    if (signingOut) return

    setSigningOut(true)
    // Whatever the outcome, the login page is shown: a full navigation also drops every cached private page.
    await signOut().catch(() => null)
    // A full page load on purpose: it discards every private page kept in the client-side router cache.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/admin/login')
  }

  const logoutButton = (className: string) => (
    <button type="button" onClick={logout} disabled={signingOut} className={`${className} ${focusRing} disabled:opacity-60`}>
      <LogOut aria-hidden="true" className="size-4 shrink-0" /> {signingOut ? 'Déconnexion…' : 'Déconnexion'}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#0b1b33] text-white lg:flex">
        <FlagLine />
        <div className="flex items-center gap-3 px-5 py-5">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-[#007fff]"><Zap fill="currentColor" /></span>
          <span><strong className="block text-sm">Kinshasa Électricité</strong><small className="text-xs text-[#a8b7ca]">Administration</small></span>
        </div>
        <nav aria-label="Administration" className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navigation.map(({ href, label, Icon }) => (
            <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${isCurrent(href) ? 'bg-white/15 text-white' : 'text-[#c5d2e3] hover:bg-white/10 hover:text-white'}`}>
              <Icon aria-hidden="true" className="size-4 shrink-0" /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#c5d2e3] hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><ExternalLink aria-hidden="true" className="size-4 shrink-0" /> Voir le site public</Link>
          {logoutButton('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#c5d2e3] hover:bg-white/10 hover:text-white')}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#e2e8f0] bg-white">
          <div className="lg:hidden"><FlagLine /></div>
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#007fff] text-white"><Zap fill="currentColor" /></span>
              <strong className="truncate text-sm">Administration</strong>
            </div>
            <p className="hidden text-sm font-semibold text-[#475569] lg:block">Espace réservé aux administrateurs</p>
            <div className="flex min-w-0 items-center gap-3">
              <p className="hidden min-w-0 text-right text-sm leading-tight sm:block"><strong className="block truncate">{user.name}</strong><span className="block truncate text-xs text-[#64748b]">{user.email}</span></p>
              <div className="lg:hidden">{logoutButton('inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm font-bold hover:border-[#007fff] hover:text-[#007fff]')}</div>
            </div>
          </div>
          <nav aria-label="Administration" className="flex gap-1 overflow-x-auto border-t border-[#e2e8f0] px-2 py-2 lg:hidden">
            {navigation.map(({ href, short, Icon }) => (
              <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${focusRing} ${isCurrent(href) ? 'bg-[#eff6ff] text-[#0067d8]' : 'text-[#475569] hover:bg-[#f8fafc]'}`}>
                <Icon aria-hidden="true" className="size-4 shrink-0" /> {short}
              </Link>
            ))}
          </nav>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}

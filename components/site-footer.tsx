import Link from 'next/link'
import { Zap } from 'lucide-react'
import { INDEPENDENCE_NOTICE, SITE_NAME } from '@/lib/site'

function FlagLine() {
  return <div aria-hidden="true" className="h-1 w-full bg-[linear-gradient(90deg,#007fff_0_48%,#f7d618_48%_52%,#ce1021_52%)]" />
}

const linkClass = 'inline-flex min-h-11 items-center rounded hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white'

/** Footer shared by every page. */
export function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`bg-[#0b1b33] text-white ${className}`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 md:py-14 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-[#007fff]"><Zap fill="currentColor" /></span>
            <strong>{SITE_NAME}</strong>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#a8b7ca]">Une initiative citoyenne pour mieux visualiser les coupures d&apos;électricité et les retours du courant signalés à Kinshasa.</p>
        </div>
        <nav aria-label="Explorer">
          <p className="font-bold">Explorer</p>
          <ul className="mt-2 flex flex-col text-base text-[#a8b7ca] md:text-sm">
            <li><Link href="/situation" className={linkClass}>Situation</Link></li>
            <li><Link href="/signaler" className={linkClass}>Faire un signalement</Link></li>
          </ul>
        </nav>
        <nav aria-label="Informations">
          <p className="font-bold">Informations</p>
          <ul className="mt-2 flex flex-col text-base text-[#a8b7ca] md:text-sm">
            <li><Link href="/a-propos" className={linkClass}>À propos</Link></li>
            <li><Link href="/confidentialite" className={linkClass}>Confidentialité</Link></li>
            <li><Link href="/contact" className={linkClass}>Contact</Link></li>
          </ul>
        </nav>
      </div>
      <FlagLine />
      <p className="mx-auto max-w-7xl px-5 py-5 text-xs leading-5 text-[#a8b7ca] lg:px-8">{INDEPENDENCE_NOTICE}</p>
    </footer>
  )
}

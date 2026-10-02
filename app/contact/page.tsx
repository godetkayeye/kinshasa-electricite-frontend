import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone } from 'lucide-react'
import { InfoPage, InfoSection } from '@/components/info-page'
import { CONTACT, INDEPENDENCE_NOTICE, pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description: 'Informations de contact de la plateforme citoyenne de signalement des coupures d’électricité à Kinshasa.',
  path: '/contact',
})

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Nous joindre" title="Contact" intro="Une question, une remarque ou un problème sur le site ? Vous pouvez nous joindre par téléphone.">
      <InfoSection title="Coordonnées">
        <p><strong>{CONTACT.name}</strong></p>
        <p>
          <a href={CONTACT.phoneHref} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 text-lg font-bold text-[#0067d8] hover:border-[#007fff] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30">
            <Phone aria-hidden="true" className="size-5" /> {CONTACT.phone}
          </a>
        </p>
      </InfoSection>

      <InfoSection title="Signaler une situation électrique">
        <p>Pour signaler une coupure ou le retour du courant dans votre quartier, utilisez directement le formulaire : il ne nécessite aucun compte.</p>
        <p><Link href="/signaler" className="font-bold text-[#0067d8] underline">Faire un signalement</Link></p>
      </InfoSection>

      <InfoSection title="Urgence ou panne à déclarer">
        <p>{INDEPENDENCE_NOTICE}</p>
        <p>Cette plateforme ne transmet pas vos signalements à un fournisseur d&apos;électricité et ne permet pas de demander une intervention.</p>
      </InfoSection>
    </InfoPage>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/info-page'
import { INDEPENDENCE_NOTICE, pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description: 'Informations de contact de la plateforme citoyenne de signalement des coupures d’électricité à Kinshasa.',
  path: '/contact',
})

// The official contact details of the project are not defined yet. Add them
// in the first section when they are: never publish a placeholder address.
export default function ContactPage() {
  return (
    <InfoPage eyebrow="Nous joindre" title="Contact" intro="Les coordonnées officielles du projet seront publiées sur cette page.">
      <InfoSection title="Coordonnées">
        <p>Les coordonnées de contact ne sont pas encore disponibles. Elles seront indiquées ici dès qu&apos;elles seront définies.</p>
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

import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/info-page'
import { INDEPENDENCE_NOTICE, pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'À propos',
  description: 'Une initiative citoyenne indépendante qui permet aux habitants de Kinshasa de partager la situation électrique observée dans leurs quartiers.',
  path: '/a-propos',
})

export default function AboutPage() {
  return (
    <InfoPage eyebrow="La plateforme" title="À propos" intro="Cette plateforme permet aux habitants de Kinshasa de partager la situation électrique observée dans leurs quartiers.">
      <InfoSection title="Une initiative indépendante">
        <p><strong>{INDEPENDENCE_NOTICE}</strong></p>
        <p>Elle ne remplace aucune communication officielle et ne permet pas de contacter un fournisseur d&apos;électricité.</p>
      </InfoSection>

      <InfoSection title="Comment ça marche">
        <ul>
          <li>Un habitant signale une <strong>coupure</strong> ou le <strong>retour du courant</strong> dans son quartier, sans créer de compte.</li>
          <li>Les signalements sont regroupés par quartier et par commune.</li>
          <li>Chaque quartier affiche le nombre de coupures et de retours signalés récemment, ainsi que la date de la dernière activité.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Ce que les informations signifient">
        <p>Les informations affichées reposent sur les signalements de la communauté. Elles décrivent ce que des habitants ont déclaré, pas l&apos;état réel du réseau électrique.</p>
        <ul>
          <li>Un quartier sans signalement récent n&apos;est pas forcément alimenté.</li>
          <li>Des retours du courant signalés ne garantissent pas que tout le quartier est alimenté.</li>
          <li>Lorsque coupures et retours sont signalés à peu de temps d&apos;intervalle, la situation est présentée comme « partagée ».</li>
        </ul>
        <p>Les compteurs sont toujours affichés pour que chacun puisse juger par lui-même du nombre de personnes qui ont signalé.</p>
      </InfoSection>

      <InfoSection title="Participer">
        <p>Plus les habitants signalent, plus la vue d&apos;ensemble est utile à tous.</p>
        <p><Link href="/signaler" className="font-bold text-[#0067d8] underline">Faire un signalement</Link> · <Link href="/situation" className="font-bold text-[#0067d8] underline">Consulter la situation</Link></p>
      </InfoSection>
    </InfoPage>
  )
}
